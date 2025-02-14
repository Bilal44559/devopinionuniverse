import { makeApiResponse } from "../../lib/response.js";
import { StatusCodes } from "http-status-codes";
import OfferProcess from "../../models/offerprocess.model.js";
import dashboardController from './dashboard.controller.js';
import AdminEarnings from "../../models/adminearnings.model.js";

export default {

    dashboard: async (req, res) => {
        try {
            let msg;
            let dateFilter = {};
            const { days, startDate, endDate } = req.body;
            if (days) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(days));
                dateFilter.date = { $gte: startDate };
            } else if (startDate && endDate) {
                dateFilter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                dateFilter.date = { $gte: today, $lt: tomorrow };
            }
            const dashboardStats = await dashboardController.stats(dateFilter);
            const countryStats = await dashboardController.countryStats(dateFilter);
            const adminEarnings = await dashboardController.adminEarnings(dateFilter);
            const adminEarningsDetail = await dashboardController.adminEarningsDetail(dateFilter);

            msg = 'Dashboard';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                dashboardStats,
                countryStats,
                adminEarnings,
                adminEarningsDetail
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    stats: async (dateFilter) => {
            let totalClicks = 0;
            let totalLeads = 0;
            let totalEarnings = 0;
            let totalNonEventEarnings = 0;
            let totalEventEarnings = 0;
        
            const results1 = await OfferProcess.aggregate([
                { $match: { ...dateFilter } },
                {
                    $group: {
                        _id: null,
                        leads: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                        credits: { $sum: { $cond: [{ $eq: ["$status", 1] }, "$credits", 0] } },
                        eventEarnings: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ["$status", 1] },
                                            { $in: ["$network", ["Adgatemedia", "Hangmyads", "Farly"]] },
                                        ],
                                    },
                                    "$total_success_credit",
                                    0,
                                ],
                            },
                        },
                        nonEventEarnings: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ["$status", 1] },
                                            { $not: { $in: ["$network", ["Adgatemedia", "Hangmyads", "Farly"]] } },
                                        ],
                                    },
                                    "$credits",
                                    0,
                                ],
                            },
                        },
                        clicks: { $sum: 1 },
                        hits: { $addToSet: "$code" },
                    },
                },
            ]);

            const leads = [];
            if (results1.length > 0) {
                const record = results1[0];
                const clicks = record.clicks;
                const downloads = record.leads;
                const earnings = record.credits;
                const nonEventEarnings = record.nonEventEarnings;
                const eventEarnings = record.eventEarnings;
    
                const epc = (earnings / clicks).toFixed(2);
                const cr = ((downloads / clicks) * 100).toFixed(2);
    
                leads.push({
                    clicks,
                    leads: downloads,
                    earnings,
                    epc,
                    cr,
                });
    
                totalClicks += clicks;
                totalLeads += downloads;
                totalEarnings += earnings;
                totalNonEventEarnings += nonEventEarnings;
                totalEventEarnings += eventEarnings;
        }
        const totalCR = ((totalLeads / totalClicks) * 100).toFixed(2);
        const totalEPC = (totalEarnings / totalClicks).toFixed(2);
        const avgCPA = (totalEarnings / totalLeads).toFixed(2);

            const data = {
                totalClicks,
                totalLeads,
                totalEarnings,
                totalNonEventEarnings,
                totalEventEarnings,
                leads,
                totalCR,
                totalEPC,
                avgCPA
            };
            return data;
    },

    countryStats: async (dateFilter) => {
            const results2 = await OfferProcess.aggregate([
                { $match: { ...dateFilter, status: 1 } },
                {
                    $group: {
                        _id: "$country",
                        clicks: { $sum: 1 },
                    },
                },
                { $sort: { clicks: -1 } },
                { $limit: 5 },
            ]);
    
            const topCountries = [];
            let countriesCountSum = 0;
            let countrieNames = "";
            let countrieClicks = "";
    
            results2.forEach((country) => {
                topCountries.push({ country: country._id, clicks: country.clicks });
                countriesCountSum += country.clicks;
                countrieNames += `'${country._id}',`;
                countrieClicks += `${country.clicks},`;
            });
            const data = {
                topCountries,
                countriesCountSum,
                countrieNames,
                countrieClicks,
            };
            return data;
    },

    adminEarnings: async (dateFilter) => {
        let adminData = [['Date', 'Earnings']];
        let adminDates = '';
        let adminEarnings = '';
        let noData = false;

        const results = await AdminEarnings.aggregate([
            { $match: { ...dateFilter } },
            { $group: { 
                _id: null,
                earnings: { $sum: "$credits" }
            }},
            { $sort: { "_id": 1 } }
        ]);

        if (results.length > 0) {
            results.forEach(result => {
                const date = new Date(result._id);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
                const earnings = result.earnings;

                adminData.push([formattedDate, earnings]);
                adminDates += `'${formattedDate}',`;
                adminEarnings += `${earnings},`;
            });

            adminDates = adminDates.slice(0, -1);
            adminEarnings = adminEarnings.slice(0, -1);
        } else {
            const currentDate = new Date();
            const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;
            adminData.push([formattedDate, 0]);
            adminDates += `'${formattedDate}',`;
            adminEarnings += `'0',`;
            noData = true;
        }

        const data = {
            adminData,
            adminDates,
            adminEarnings,
            noData
        };
        return data;
    },

    adminEarningsDetail: async (dateFilter) => {
        const adminEarnings = await AdminEarnings.find(dateFilter);
        const data = {
            adminEarnings
        };
        return data

    }
    
};