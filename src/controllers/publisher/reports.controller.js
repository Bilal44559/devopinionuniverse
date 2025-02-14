import OfferProcess from '../../models/offerprocess.model.js';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import App from '../../models/apps.model.js';
import Transaction from '../../models/transactions.model.js';
import OfferEvent from '../../models/offerevents.model.js';
import CampaignProcess from '../../models/campaignProcess.model.js';
import { DateTime } from 'luxon';
import moment from 'moment';
import PbSettings from '../../models/pbsettings.model.js';
import Pbsent from '../../models/pb_sent.model.js';
import QuestionnariesResult from '../../models/questionnaire_results.model.js';
import reportsController from './reports.controller.js';
import fs from 'fs';
import path from 'path';
import { parse } from 'json2csv';
import { fileURLToPath } from 'url';
import userQuestionsAttempt from '../../models/userQuestionAttempts.model.js';
import LiveSurveyQuestion from '../../models/liveSurveyQuestionaries.model.js';

export default {

    dailyReports: async (req, res, start_date = null, end_date = null) => {
        try {
            let msg;
            const { app_id, page = 1, itemsPerPage = 10 } = req.body;
            const uid = req.userId;
            const app = await App.findOne({ uid: uid, _id: app_id });
            const appId = app ? app._id.toString() : null;
            // const startDate = DateTime.now().minus({ days: 37 }).startOf('day').toJSDate();
            // const endDate = DateTime.now().endOf('day').toJSDate();
                let startDate;
                let endDate;
                if (start_date) {
                    startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
                }
                startDate = DateTime.now().minus({ days: 37 }).startOf('day').toJSDate();
                if (end_date) {
                    endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
                }
                endDate = DateTime.now().endOf('day').toJSDate();

                if (start_date && end_date) {
                    const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                    const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                    if (startDateValidated && endDateValidated) {
                        const today = DateTime.now().toUTC().endOf('day').toJSDate();
                        if (endDateValidated > today) {
                            msg = 'End Date should be less than or equal to today.';
                            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                            return res.status(StatusCodes.BAD_REQUEST).json(result);
                            // return res.status(400).json({ message: 'End Date should be less than or equal to today' });
                        }
                        if (startDateValidated > endDateValidated) {
                            msg = 'Start Date should be before End Date.';
                            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                            return res.status(StatusCodes.BAD_REQUEST).json(result);
                            // return res.status(400).json({ message: 'Start Date should be before End Date' });
                        }
                        startDate = startDateValidated;
                        endDate = endDateValidated;
                    } else {
                        msg = 'Invalid Start Date or End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                        // return res.status(400).json({ message: 'Invalid Start Date or End Date' });
                    }
                }
            const dateArray = [];
            let currentDate = DateTime.fromJSDate(startDate);
            while (currentDate <= DateTime.fromJSDate(endDate)) {
                dateArray.push(currentDate.toFormat('yyyy-MM-dd'));
                currentDate = currentDate.plus({ days: 1 });
            }
            const reversedDates = dateArray.reverse();
            const offset = (page - 1) * itemsPerPage;
            const paginatedDates = reversedDates.slice(offset, offset + itemsPerPage);

            let totalClicks = 0;
            let totalConversions = 0;
            let totalRevenue = 0;
            const reports = [];

            const totals = await OfferProcess.aggregate([
                {
                    $match: {
                        uid: uid,
                        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                        ...(appId ? { app_id: appId } : {})
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalConversions: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                        totalClicks: { $sum: 1 },
                    }
                }
            ]);

            if (totals.length > 0) {
                totalClicks = totals[0].totalClicks;
                totalConversions = totals[0].totalConversions;
            }

            const totalCredits = await Transaction.aggregate([
                {
                    $match: {
                        uid: uid,
                        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                        type: 'credit',
                        ...(appId ? { app_id: appId } : {})
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$credits" }
                    }
                }
            ]);

            if (totalCredits.length > 0) {
                totalRevenue = Number(totalCredits[0].totalRevenue);
            }

            for (const date of paginatedDates) {
                const offerData = await OfferProcess.aggregate([
                    {
                        $match: {
                            uid: uid,
                            ...(appId ? { app_id: appId } : {}),
                            date: {
                                $gte: DateTime.fromFormat(date, 'yyyy-MM-dd').startOf('day').toJSDate(),
                                $lte: DateTime.fromFormat(date, 'yyyy-MM-dd').endOf('day').toJSDate()
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            conversions: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                            clicks: { $sum: 1 }
                        }
                    }
                ]);
                let conversions = 0;
                let clicks = 0;

                if (offerData.length > 0) {
                    conversions = offerData[0].conversions;
                    clicks = offerData[0].clicks;
                }
                const transactionData = await Transaction.aggregate([
                    {
                        $match: {
                            uid: uid,
                            ...(appId ? { app_id: appId } : {}),
                            type: 'credit',
                            date: {
                                $gte: DateTime.fromFormat(date, 'yyyy-MM-dd').startOf('day').toJSDate(),
                                $lte: DateTime.fromFormat(date, 'yyyy-MM-dd').endOf('day').toJSDate()
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            revenue: { $sum: "$credits" }
                        }
                    }
                ]);
                let revenue = 0;

                if (transactionData.length > 0) {
                    revenue = Number(transactionData[0].revenue);
                }
                reports.push({
                    date: date,
                    conversions: conversions,
                    clicks: clicks,
                    revenue: revenue.toFixed(2)
                });

            }
            const totalNumOfRecord = reversedDates.length;
            const last = Math.ceil(totalNumOfRecord / itemsPerPage);
            msg = 'Get all Daily Reports successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit: itemsPerPage,
                totalPages: last,
                totalReports: totalNumOfRecord,
                reports,
                totalClicks,
                totalConversions,
                totalRevenue: totalRevenue.toFixed(2),
            });
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    conversionReports: async (req, res, start_date = null, end_date = null) => {
        try {
            let msg;
            const { app_id, page = 1, itemsPerPage = 10 } = req.body;
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            // const startDate = DateTime.now().minus({ days: 6 }).startOf('day').toJSDate();
            // const endDate = DateTime.now().endOf('day').toJSDate();
            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ days: 6 }).startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                        msg = 'End Date should be less than or equal to today.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'Invalid Start Date or End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            const offset = (page - 1) * itemsPerPage;

            const query = {
                completed_date: { $gte: startDate, $lte: endDate },
                uid: uid,
                status: 1,
            };

            if (appId) {
                query.app_id =  appId ? appId.toString() : null;
            }
            const totalNumOfRecords = await OfferProcess.countDocuments(query);

            const reports = await OfferProcess.find(query)
                .limit(itemsPerPage)
                .skip(offset);

            let reportResults = [];
            for (let row of reports) {
                let credits = row.credits;
                let date = moment(row.completed_date).format('YYYY-MM-DD');
                let offer_id = row.campaign_id;
                let offer_name = row.offer_name;
                let status = 'Completed';
                let network = row.network;
                let totalEvents = 0;

                if (network === 'Hangmyads' || network === 'Adgatemedia' || network === 'Farly') {
                    credits = row.total_success_credit;
                } else {
                    credits = credits;
                }

                const eventRows = await OfferEvent.find({
                    offer_id: offer_id,
                    uid: uid,
                    sid: row.sid
                });

                totalEvents = eventRows.length;
                let revenue = eventRows.reduce((acc, event) => acc + event.pub_payout, 0);

                if (totalEvents > 0) {
                    credits = revenue;
                }

                reportResults.push({
                    date,
                    offer_id,
                    offer_name,
                    status,
                    sid: row.sid,
                    sid2: row.sid2,
                    sid3: row.sid3,
                    sid4: row.sid4,
                    sid5: row.sid5,
                    ip: row.ip,
                    revenue: credits,
                    uid: row.uid,
                    network,
                    eventCount: totalEvents
                });
            }

            const totalPages = Math.ceil(totalNumOfRecords / itemsPerPage);
            msg = 'Get all Conversion Reports successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit: itemsPerPage,
                totalPages,
                totalReports: totalNumOfRecords,
                reports: reportResults,
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    adConversionReports: async (req, res, start_date = null, end_date = null) => {
        try {
            let msg;
            const { app_id, page = 1, itemsPerPage = 10 } = req.body;
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            // const startDate = DateTime.now().minus({ days: 6 }).startOf('day').toJSDate();
            // const endDate = DateTime.now().endOf('day').toJSDate();

            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ days: 6 }).startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                        msg = 'End Date should be less than or equal to today.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'Invalid Start Date or End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            const offset = (page - 1) * itemsPerPage;

            const query = {
                datetime: { $gte: startDate, $lte: endDate },
                pid: uid,
                status: 1,
            };

            if (appId) {
                query.app_id = appId ? appId.toString() : null;
            }

            const totalNumOfRecords = await CampaignProcess.countDocuments(query);
            const reports = await CampaignProcess.find(query)
                .limit(itemsPerPage)
                .skip(offset);

            let reportResults = [];
            for (let row of reports) {
                let payout = row.payout.toString();
                let date = moment(row.datetime).format('YYYY-MM-DD');
                let offer_id = row.camp_id;
                let offer_name = row.title;
                let status = 'Completed';
                // offer_name = offer_name ? require('he').decode(offer_name) : '';

                reportResults.push({
                    date,
                    offer_id,
                    offer_name,
                    status,
                    sid: row.sid,
                    sid2: row.sid2,
                    sid3: row.sid3,
                    sid4: row.sid4,
                    sid5: row.sid5,
                    ip: row.ip,
                    payout,
                    uid: row.uid,
                    network: "ADS",
                });
            }

            const totalPages = Math.ceil(totalNumOfRecords / itemsPerPage);
            msg = 'Get all Ads Conversion Reports successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit: itemsPerPage,
                totalPages,
                totalReports: totalNumOfRecords,
                reports: reportResults,
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    reversalReports: async (req, res, start_date = null, end_date = null) => {
        try {
            let msg;
            const { app_id, page = 1, itemsPerPage = 10 } = req.body;
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            // const startDate = DateTime.now().minus({ days: 6 }).startOf('day').toJSDate();
            // const endDate = DateTime.now().endOf('day').toJSDate();

            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ days: 6 }).startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                        msg = 'End Date should be less than or equal to today.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'Invalid Start Date or End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            const offset = (page - 1) * itemsPerPage;

            const query = {
                reversed_date: { $gte: startDate, $lte: endDate },
                uid: uid,
                status: 2,
            };

            if (appId) {
                query.app_id = appId ? appId.toString() : null;
            }

            const totalNumOfRecords = await OfferProcess.countDocuments(query);

            const reports = await OfferProcess.find(query)
                .limit(itemsPerPage)
                .skip(offset);

            let reportResults = [];
            for (let row of reports) {
                let credits = row.credits;
                let date = moment(row.reversed_date).format('YYYY-MM-DD');
                let offer_id = row.campaign_id;
                let offer_name = row.offer_name;
                let status = 'Reversed';
                let network = row.network;
                let totalEvents = 0;

                if (network === 'Adgatemedia') {
                    credits = row.total_success_credit;
                } else {
                    credits = credits;
                }

                const eventRows = await OfferEvent.find({
                    offer_id: offer_id,
                    uid: uid,
                    sid: row.sid
                });

                totalEvents = eventRows.length;
                let revenue = eventRows.reduce((acc, event) => acc + event.pub_payout, 0);

                if (totalEvents > 0) {
                    credits = revenue;
                }

                reportResults.push({
                    date,
                    offer_id,
                    offer_name,
                    status,
                    sid: row.sid,
                    sid2: row.sid2,
                    sid3: row.sid3,
                    sid4: row.sid4,
                    sid5: row.sid5,
                    ip: row.ip,
                    revenue: credits,
                    uid: row.uid,
                    network,
                    eventCount: totalEvents
                });
            }

            const totalPages = Math.ceil(totalNumOfRecords / itemsPerPage);
            msg = 'Get all Reversal Reports successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit: itemsPerPage,
                totalPages,
                totalReports: totalNumOfRecords,
                reports: reportResults,
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    clickReports: async (req, res, start_date = null, end_date = null, status = null) => {
        try {
            let msg;
            const { app_id, status = 1, page = 1, itemsPerPage = 10 } = req.body;
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            // const startDate = DateTime.now().minus({ months: 1 }).endOf('month').startOf('day').toJSDate();
            // const endDate = DateTime.now().endOf('day').toJSDate();
            // console.log("status:", status);
            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ months: 1 }).endOf('month').startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                             msg = 'End Date should be less than or equal to today.';
                            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                            return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'End Date should be less than or equal to today.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            const offset = (page - 1) * itemsPerPage;

            let dateField;
            if (status === 0) {
                dateField = 'date';
            } else if (status === 2) {
                dateField = 'reversed_date';
            } else if (status === 1) {
                dateField = 'completed_date';
            }
            const query = {
                [dateField]: { $gte: startDate, $lte: endDate },
                uid: uid,
                status: status,
            };
            if (appId) {
                query.app_id = appId ? appId.toString() : null;
            }

            const totalNumOfRecords = await OfferProcess.countDocuments(query);
            const reports = await OfferProcess.find(query)
                .limit(itemsPerPage)
                .skip(offset);

            let reportResults = [];
            for (let row of reports) {
                let id = row._id;
                let credits = row.credits;
                // let date = moment(row.date).format('YYYY-MM-DD hh:mm:ss');
                let date = moment(row[dateField]).format('YYYY-MM-DD HH:mm:ss');
                let offer_id = row.campaign_id;
                let offer_name = row.offer_name;
                let offer_status = row.status;

                let status_msg
                if (offer_status === 1) {
                    status_msg = "Completed";
                } else if (offer_status === 2) {
                    status_msg = "Reversed";
                } else if (offer_status === 0) {
                    status_msg = "Pending";
                } else {
                    status_msg = "Error";
                }

                reportResults.push({
                    id,
                    offer_id,
                    offer_name,
                    date,
                    status: status_msg,
                    payout: credits,
                });
            }

            const totalPages = Math.ceil(totalNumOfRecords / itemsPerPage);
            msg = "Get all Click's Reports successfully";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit: itemsPerPage,
                totalPages,
                totalReports: totalNumOfRecords,
                reports: reportResults,
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    postbackReports: async (req, res, start_date = null, end_date = null) => {
        try {
            let msg;
            const { app_id, page = 1, itemsPerPage = 10 } = req.body;
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            // const startDate = DateTime.now().minus({ months: 1 }).startOf('day').toJSDate();
            // const endDate = DateTime.now().endOf('day').toJSDate();

            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ months: 1 }).startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                        msg = 'End Date should be less than or equal to today.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'Invalid Start Date or End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            const offset = (page - 1) * itemsPerPage;

            // const pbSetting = await PbSettings.findOne({uid: uid});
            // const url = pbSetting.url;

            const query = {
                date: { $gte: startDate, $lte: endDate },
                uid: uid,
            };
            if (appId) {
                query.app_id = appId ? appId.toString() : null;
            }

            const totalNumOfRecords = await Pbsent.countDocuments(query);
            const reports = await Pbsent.find(query)
                .limit(itemsPerPage)
                .skip(offset);

            let reportResults = [];
            for (let row of reports) {
                let id = row._id;
                let url = row.url;
                let date = moment(row.date).format('YYYY-MM-DD hh:mm:ss');
                let offer_id = row.campid;
                let pb_response = row.pb_response;
                if (!pb_response) {
                    pb_response = 'No response found.';
                }
                let pb_status = row.status;
                let status;
                if (pb_status === 1) {
                    status = 'Completed';
                } else if (pb_status === 2) {
                    status = 'Reversed';
                } else {
                    status = 'Error';
                }

                reportResults.push({
                    id,
                    offer_id,
                    url,
                    status,
                    date,
                    response: pb_response,
                });
            }

            const totalPages = Math.ceil(totalNumOfRecords / itemsPerPage);
            msg = 'Get all Postback Reports successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit: itemsPerPage,
                totalPages,
                totalReports: totalNumOfRecords,
                reports: reportResults,
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    userQuestionnaireReports: async (req, res, s_id = null) => {
        try {
            let msg;
            const { app_id, page = 1, itemsPerPage = 10 } = req.body;
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            const offset = (page - 1) * itemsPerPage;

            let querySid = typeof s_id === 'function' ? null : s_id;
            const query = {
                uid: uid
            };
            if (querySid) {
                query.sid = querySid;
            }
            if (appId) {
                query.app_id = appId ? appId.toString() : null;
            }
            const totalNumOfRecords = await QuestionnariesResult.countDocuments(query);
            const reports = await QuestionnariesResult.find(query)
                .limit(itemsPerPage)
                .skip(offset);

            let reportResults = [];
            for (let row of reports) {
                let id = row._id;
                let sid = row.sid;
                let pubId = row.uid;
                let marks = row.marks;
                let result = row.result;

                reportResults.push({
                    id,
                    sid,
                    pubId,
                    marks,
                    result,
                });
            }

            const totalPages = Math.ceil(totalNumOfRecords / itemsPerPage);
            msg = 'Get all User Questionnaire Reports successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit: itemsPerPage,
                totalPages,
                totalReports: totalNumOfRecords,
                reports: reportResults,
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    searchReports: async (req, res) => {
        try {
            let msg;
            const { tab, start_date, end_date, status, s_id } = req.body;
            if (!tab) {
                msg = 'tab is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let data;
            switch (tab) {
                case 'daily':
                    data = await reportsController.dailyReports(req, res, start_date, end_date);
                    break;
                case 'conversion':
                    data = await reportsController.conversionReports(req, res, start_date, end_date);
                    break;
                case 'ads-conversion':
                    data = await reportsController.adConversionReports(req, res, start_date, end_date);
                    break;
                case 'reversal':
                    data = await reportsController.reversalReports(req, res, start_date, end_date);
                    break;
                case 'click':
                    data = await reportsController.clickReports(req, res, start_date, end_date, status);
                    break;
                case 'postback':
                    data = await reportsController.postbackReports(req, res, start_date, end_date);
                    break;
                case 'question':
                    data = await reportsController.userQuestionnaireReports(req, res, s_id);
                    break;
                default:
                    msg = 'Invalid tab value.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    exportDailyReports: async (req, res) => {
        try {
            let msg;
            const { app_id, start_date = null, end_date = null } = req.body;
            const tab = 'daily';
            const uid = req.userId;
            const app = await App.findOne({ uid: uid, _id: app_id });
            const appId = app ? app._id.toString() : null;
            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ days: 37 }).startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                        msg = 'End Date should be less than or equal to today.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'Invalid Start Date or End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            const dateArray = [];
            let currentDate = DateTime.fromJSDate(startDate);
            while (currentDate <= DateTime.fromJSDate(endDate)) {
                dateArray.push(currentDate.toFormat('yyyy-MM-dd'));
                currentDate = currentDate.plus({ days: 1 });
            }
            const reversedDates = dateArray.reverse();


            let totalClicks = 0;
            let totalConversions = 0;
            let totalRevenue = 0;
            const reports = [];

            const totals = await OfferProcess.aggregate([
                {
                    $match: {
                        uid: uid,
                        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                        ...(appId ? { app_id: appId } : {})
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalConversions: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                        totalClicks: { $sum: 1 },
                    }
                }
            ]);

            if (totals.length > 0) {
                totalClicks = totals[0].totalClicks;
                totalConversions = totals[0].totalConversions;
            }

            const totalCredits = await Transaction.aggregate([
                {
                    $match: {
                        uid: uid,
                        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                        type: 'credit',
                        ...(appId ? { app_id: appId } : {})
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$credits" }
                    }
                }
            ]);

            if (totalCredits.length > 0) {
                totalRevenue = Number(totalCredits[0].totalRevenue);
            }

            for (const date of reversedDates) {
                const offerData = await OfferProcess.aggregate([
                    {
                        $match: {
                            uid: uid,
                            ...(appId ? { app_id: appId } : {}),
                            date: {
                                $gte: DateTime.fromFormat(date, 'yyyy-MM-dd').startOf('day').toJSDate(),
                                $lte: DateTime.fromFormat(date, 'yyyy-MM-dd').endOf('day').toJSDate()
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            conversions: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                            clicks: { $sum: 1 }
                        }
                    }
                ]);
                let conversions = 0;
                let clicks = 0;

                if (offerData.length > 0) {
                    conversions = offerData[0].conversions;
                    clicks = offerData[0].clicks;
                }
                const transactionData = await Transaction.aggregate([
                    {
                        $match: {
                            uid: uid,
                            ...(appId ? { app_id: appId } : {}),
                            type: 'credit',
                            date: {
                                $gte: DateTime.fromFormat(date, 'yyyy-MM-dd').startOf('day').toJSDate(),
                                $lte: DateTime.fromFormat(date, 'yyyy-MM-dd').endOf('day').toJSDate()
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            revenue: { $sum: "$credits" }
                        }
                    }
                ]);
                let revenue = 0;

                if (transactionData.length > 0) {
                    revenue = Number(transactionData[0].revenue);
                }
                reports.push({
                    date: date,
                    conversions: conversions,
                    clicks: clicks,
                    revenue: revenue.toFixed(2)
                });

            }
            const data = reports;
            const fields = ['date', 'conversions', 'clicks', 'revenue'];
            const csv = parse(data, { fields });
            const filename = `report_${tab}_${DateTime.now().toFormat('yyyyMMddHHmmss')}.csv`;

            // Set CSV file download headers
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filePath = path.join(__dirname, '..', '..', 'uploads', 'reports', tab, filename);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, csv);
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/reports/${tab}/${filename}`;
            msg = 'CSV file generated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, fileUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    exportConversionReports: async (req, res) => {
        try {
            let msg;
            const { app_id, start_date = null, end_date = null } = req.body;
            const tab = 'conversion';
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ days: 6 }).startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                        msg = 'End Date should be less than or equal to today.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'Invalid Start Date or End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            const query = {
                completed_date: { $gte: startDate, $lte: endDate },
                uid: uid,
                status: 1,
            };
            if (appId) {
                query.app_id = appId ? appId.toString() : null;
            }
            const totalNumOfRecords = await OfferProcess.countDocuments(query);
            const reports = await OfferProcess.find(query);
            let reportResults = [];
            for (let row of reports) {
                let credits = row.credits;
                let date = moment(row.date).format('M/D/YYYY');;
                let offer_id = row.campaign_id;
                let offer_name = row.offer_name;
                let status = 'Completed';
                let network = row.network;
                let totalEvents = 0;

                if (network === 'Hangmyads' || network === 'Adgatemedia' || network === 'Farly') {
                    credits = row.total_success_credit;
                } else {
                    credits = credits;
                }

                const eventRows = await OfferEvent.find({
                    offer_id: offer_id,
                    uid: uid,
                    sid: row.sid
                });

                totalEvents = eventRows.length;
                let revenue = eventRows.reduce((acc, event) => acc + event.pub_payout, 0);

                if (totalEvents > 0) {
                    credits = revenue;
                }

                reportResults.push({
                    date,
                    offer_id,
                    offer_name,
                    status,
                    sid: row.sid,
                    sid2: row.sid2,
                    sid3: row.sid3,
                    sid4: row.sid4,
                    sid5: row.sid5,
                    ip: row.ip,
                    revenue: credits,
                });
            }
            const data = reportResults;
            const fields = ['date', 'offer_id', 'offer_name', 'status', 'sid', 'sid2', 'sid3', 'sid4', 'sid5', 'ip', 'revenue'];
            const csv = parse(data, { fields });
            const filename = `report_${tab}_${DateTime.now().toFormat('yyyyMMddHHmmss')}.csv`;

            // Set CSV file download headers
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filePath = path.join(__dirname, '..', '..', 'uploads', 'reports', tab, filename);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, csv);
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/reports/${tab}/${filename}`;
            msg = 'CSV file generated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, fileUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    exportReversalReports: async (req, res) => {
        try {
            let msg;
            const { app_id, start_date = null, end_date = null } = req.body;
            const tab = 'reversal';
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ days: 6 }).startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                        msg = 'End Date should be less than or equal to today.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'Invalid Start Date or End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            const query = {
                reversed_date: { $gte: startDate, $lte: endDate },
                uid: uid,
                status: 2,
            };

            if (appId) {
                query.app_id = appId ? appId.toString() : null;
            }
            const totalNumOfRecords = await OfferProcess.countDocuments(query);
            const reports = await OfferProcess.find(query);
            let reportResults = [];
            for (let row of reports) {
                let credits = row.credits;
                let date = moment(row.date).format('M/D/YYYY');;
                let offer_id = row.campaign_id;
                let offer_name = row.offer_name;
                let status = 'Completed';
                let network = row.network;
                let totalEvents = 0;

                if (network === 'Adgatemedia') {
                    credits = row.total_success_credit;
                } else {
                    credits = credits;
                }

                const eventRows = await OfferEvent.find({
                    offer_id: offer_id,
                    uid: uid,
                    sid: row.sid
                });

                totalEvents = eventRows.length;
                let revenue = eventRows.reduce((acc, event) => acc + event.pub_payout, 0);

                if (totalEvents > 0) {
                    credits = revenue;
                }

                reportResults.push({
                    date,
                    offer_id,
                    offer_name,
                    status,
                    sid: row.sid,
                    sid2: row.sid2,
                    sid3: row.sid3,
                    sid4: row.sid4,
                    sid5: row.sid5,
                    ip: row.ip,
                    revenue: credits,
                });
            }
            const data = reportResults;
            const fields = ['date', 'offer_id', 'offer_name', 'status', 'sid', 'sid2', 'sid3', 'sid4', 'sid5', 'ip', 'revenue'];
            const csv = parse(data, { fields });
            const filename = `report_${tab}_${DateTime.now().toFormat('yyyyMMddHHmmss')}.csv`;

            // Set CSV file download headers
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filePath = path.join(__dirname, '..', '..', 'uploads', 'reports', tab, filename);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, csv);
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/reports/${tab}/${filename}`;
            msg = 'CSV file generated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, fileUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    exportClickReports: async (req, res) => {
        try {
            let msg;
            const { app_id, status = 1, start_date = null, end_date = null } = req.body;
            const tab = 'click';
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ months: 1 }).endOf('month').startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                        msg = 'End Date should be less than or equal to today.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'Invalid Start Date or End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            let dateField;
            if (status === 0) {
                dateField = 'date';
            } else if (status === 2) {
                dateField = 'reversed_date';
            } else if (status === 1) {
                dateField = 'completed_date';
            }
            const query = {
                [dateField]: { $gte: startDate, $lte: endDate },
                uid: uid,
                status: status,
            };
            if (appId) {
                query.app_id = appId ? appId.toString() : null;
            }

            const totalNumOfRecords = await OfferProcess.countDocuments(query);
            const reports = await OfferProcess.find(query);

            let reportResults = [];
            for (let row of reports) {
                let id = row._id;
                let credits = row.credits;
                let date = moment(row.date).format('M/D/YYYY');;
                let offer_id = row.campaign_id;
                let offer_name = row.offer_name;
                let offer_status = row.status;

                let status_msg
                if (offer_status === 1) {
                    status_msg = "Completed";
                } else if (offer_status === 2) {
                    status_msg = "Reversed";
                } else if (offer_status === 0) {
                    status_msg = "Pending";
                } else {
                    status_msg = "Error";
                }

                reportResults.push({
                    id,
                    offer_id,
                    offer_name,
                    date,
                    status: status_msg,
                    amount: credits,
                });
            }
            const data = reportResults;
            const fields = ['id', 'offer_id', 'offer_name', 'date', 'status', 'amount'];
            const csv = parse(data, { fields });
            const filename = `report_${tab}_${DateTime.now().toFormat('yyyyMMddHHmmss')}.csv`;

            // Set CSV file download headers
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filePath = path.join(__dirname, '..', '..', 'uploads', 'reports', tab, filename);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, csv);
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/reports/${tab}/${filename}`;
            msg = 'CSV file generated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, fileUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    exportPostbackReports: async (req, res) => {
        try {
            let msg;
            const { app_id, start_date = null, end_date = null } = req.body;
            const tab = 'postback';
            const uid = req.userId;
            const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;
            let startDate;
            let endDate;
            if (start_date) {
                startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
            }
            startDate = DateTime.now().minus({ months: 1 }).startOf('day').toJSDate();
            if (end_date) {
                endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
            }
            endDate = DateTime.now().endOf('day').toJSDate();

            if (start_date && end_date) {
                const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
                const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
                if (startDateValidated && endDateValidated) {
                    const today = DateTime.now().toUTC().endOf('day').toJSDate();
                    if (endDateValidated > today) {
                        msg = 'End Date should be less than or equal to today.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    if (startDateValidated > endDateValidated) {
                        msg = 'Start Date should be before End Date.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    startDate = startDateValidated;
                    endDate = endDateValidated;
                } else {
                    msg = 'Invalid Start Date or End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            // const pbSetting = await PbSettings.findOne({uid: uid});
            // const url = pbSetting.url;

            const query = {
                date: { $gte: startDate, $lte: endDate },
                uid: uid,
            };
            if (appId) {
                query.app_id = appId ? appId.toString() : null;
            }
            const totalNumOfRecords = await Pbsent.countDocuments(query);
            const reports = await Pbsent.find(query);
            let reportResults = [];
            for (let row of reports) {
                let id = row._id;
                let url = row.url;
                let date = moment(row.date).format('M/D/YYYY');;
                let offer_id = row.campid;
                let pb_response = row.pb_response;
                if (!pb_response) {
                    pb_response = 'No response found.';
                }
                let pb_status = row.status;
                let status;
                if (pb_status === 1) {
                    status = 'Completed';
                } else if (pb_status === 2) {
                    status = 'Reversed';
                } else {
                    status = 'Error';
                }

                reportResults.push({
                    id,
                    offer_id,
                    url,
                    status,
                    date,
                    response: pb_response,
                });
            }
            const data = reportResults;
            const fields = ['id', 'offer_id', 'url', 'date', 'status', 'response'];
            const csv = parse(data, { fields });
            const filename = `report_${tab}_${DateTime.now().toFormat('yyyyMMddHHmmss')}.csv`;

            // Set CSV file download headers
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filePath = path.join(__dirname, '..', '..', 'uploads', 'reports', tab, filename);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, csv);
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/reports/${tab}/${filename}`;
            msg = 'CSV file generated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, fileUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    exportQuestionReports: async (req, res) => {
        try {
            let msg;
            const { sid } = req.body;
            const tab = 'question';
            const uid = req.userId;
            const userAttemptQuestions = await userQuestionsAttempt.find({ uid: uid, sid: sid });
            if (userAttemptQuestions.length === 0) {
                msg = 'No user attempts found for the given survey ID.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
    
            let reportResults = [];
            
            // Loop through each user attempt question and fetch the related questionnaire details
            for (const userAttemptQuestion of userAttemptQuestions) {
                const liveSurveyQuestionnaire = await LiveSurveyQuestion.findOne({ _id: userAttemptQuestion.qid });
                if (!liveSurveyQuestionnaire) {
                    continue; // Skip if no questionnaire is found for this attempt
                }

            const question = liveSurveyQuestionnaire.question;
            const answer = liveSurveyQuestionnaire.answer;
            const user_answer = userAttemptQuestion.user_answer;
            const date = moment(userAttemptQuestion.datetime).format('M/D/YYYY');
            reportResults.push({
                date,
                question,
                answer,
                user_answer,
            });
        }

            const data = reportResults;
            const fields = ['date', 'question', 'answer', 'user_answer'];
            const csv = parse(data, { fields });
            const filename = `report_${tab}_${DateTime.now().toFormat('yyyyMMddHHmmss')}.csv`;

            // Set CSV file download headers
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filePath = path.join(__dirname, '..', '..', 'uploads', 'reports', tab, filename);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, csv);
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/reports/${tab}/${filename}`;
            msg = 'CSV file generated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, fileUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

};