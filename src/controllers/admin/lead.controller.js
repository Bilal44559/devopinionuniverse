import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import User from "../../models/user.model.js";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OfferProcess from '../../models/offerprocess.model.js';
import App from '../../models/apps.model.js';
import Offer from "../../models/offers.model.js";
import GwStats from "../../models/gw_stats.model.js";
import AdminEarnings from "../../models/adminearnings.model.js";
import Transaction from "../../models/transactions.model.js";
import ReadyDownloads from "../../models/ready_downloads.model.js";
import GwSession from "../../models/gw_sessions.model.js";
import Campaigns from "../../models/campaigns.model.js";

const getReferrerId = async (uid) => {
    try {
        const user = await User.findOne({ _id: uid }).select('referrer_id').lean();
        if (!user) {
            return false;
        }
        if (!user.referrer_id) {
            return false;
        }
        return user.referrer_id;
    } catch (error) {
        console.error('Error retrieving referrer ID:', error);
        return false;
    }
};
const getOfferPayout = async (campaignId, network) => {
    try {
        const offer = await Offer.findOne({ campaign_id: campaignId, network }).exec();
        if (!offer) {
            return false;
        }
        return offer.credits;
    } catch (error) {
        console.error('Error fetching offer payout:', error);
        return false;
    }
};

const setEpc = async (campaignId, network) => {
    try {
        const offer = await Offer.findOne({ campaign_id: campaignId, network }).exec();
        if (!offer) {
            return false;
        }
        const { hits, leads } = offer;
        if (hits && hits > 0) {
            
            const epc = (leads / hits).toFixed(2);
            offer.epc = epc;
            await offer.save();

            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error calculating EPC:', error);
        return false;
    }
};



export default {
    getAllLeads: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if (page < 1 || limit < 1) {
                msg = 'page and limit must be positve integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getOfferProcess = await OfferProcess.find({}).skip((page - 1) * limit).limit(limit);
            const totalOfferProcess = await OfferProcess.countDocuments();
            const totalPages = Math.ceil(totalOfferProcess / limit);
            msg = "Get all Leads successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalOfferProcess,
                getOfferProcess
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getCompleteLeads: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if (page < 1 || limit < 1) {
                msg = 'page and limit must be positve integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getCompleteLeads = await OfferProcess.find({'status': 1 }).skip((page - 1) * limit).limit(limit);
            const totalCompleteLeads = await OfferProcess.countDocuments();
            const totalPages = Math.ceil(totalCompleteLeads / limit);
            msg = "Get all Complete leads successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalCompleteLeads,
                getCompleteLeads
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getReversedLeads: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if (page < 1 || limit < 1) {
                msg = 'page and limit must be positve integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getReversedLeads = await OfferProcess.find({'status': 2 }).skip((page - 1) * limit).limit(limit);
            const totalReversedLeads = await OfferProcess.countDocuments();
            const totalPages = Math.ceil(totalReversedLeads / limit);
            msg = "Get all Reversed leads successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalReversedLeads,
                getReversedLeads
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getSingleLeadDetail: async (req, res) => {
        try {
            let msg;
            if(!req.params.id){
                msg = 'Lead id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getOfferProcessDetail = await OfferProcess.findOne({ _id: req.params.id });
            if (!getOfferProcessDetail) {
                msg = 'lead  not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

         msg = 'Get Single lead successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, getOfferProcessDetail);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    reversedLead: async (req, res) => {
        try {
            let msg;
            const { lead_id } = req.body;
            if (!lead_id) {
                msg = 'Lead ID is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const offer = await OfferProcess.findOne({ _id: lead_id, status: 1 });
            if (!offer) {
                msg = 'offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const { credits: points, ref_credits: refPoints,campaign_id, app_id: placement_id, uid, offer_id, network, code, gw_id, sid, sid2, sid3, sid4, sid5 } = offer;
            let oratio;
            let split_currency;
            let reversed_points;
            // const app = await App.findOne({ _id: placement_id });
            // if (app) {
            //     oratio = app.ratio;
            //     split_currency = app.split_currency;
            // } else {
            //     const user = await User.findOne({ _id: uid });
            //     if (!user) {
            //         msg = 'user not found.';
            //         const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
            //         return res.status(StatusCodes.NOT_FOUND).json(result);
            //     }
            //     oratio = user.offerwall_ratio;
            //     split_currency = user.split_currency;
            // }
            // reversed_points = points * oratio * (split_currency / 100);
            // await Transaction.updateMany(
            //     { uid, offer_id: campaign_id, network, hash: code, type: 'credit' },
            //     { $set: { credits: 0.00, type: 'Reversed', date: new Date() } }
            // );
            // await User.updateOne({ _id: uid }, { $inc: { balance: -points } });
            // await Offer.updateOne({ campaign_id, network }, { $inc: { leads: -1 } });
            // if (gw_id) {
            //     await GwStats.deleteMany({ gid: gw_id, offer_camp_id: campaign_id, network, hash: code });
            // }
            // await AdminEarnings.deleteMany({ hash: code, network, campaign_id });
            // const referrerId = await getReferrerId(uid);
            // if (referrerId && refPoints >= 0.01) {
            //     await User.updateOne({ _id: referrerId }, { $inc: { balance: -refPoints } });
            //     await Transaction.deleteMany({ uid: referrerId, referral_id: uid, offer_id: campaign_id, network, hash: code, type: 'credit' });
            // }
            await OfferProcess.updateOne(
                // { campaign_id, code, network, status: { $ne: 2 }, uid },
                { _id: lead_id },
                { $set: { status: 2, date: new Date() } }
            );
    
            // Send postback
            // await sendPostback(uid, offer_id, 2, camp_id, network, reversed_points, sid, sid2, sid3, sid4, sid5, code, placement_id);
            msg = "Lead has been reversed successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    selectedLeadsApprove: async (req, res) => {
        try {
            let msg;
            const { leads } = req.body;
            if (!leads || leads.length === 0) {
                msg = 'No leads selected.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            for (const lead of leads) {
                if (!lead) continue;
    
                const offer = await OfferProcess.findOne({ _id: lead, status: 0 });
    
                if (offer) {
                    const {
                        credits: points,
                        ref_credits: refPoints,
                        link_id: fileId,
                        offer_id: offerId,
                        country,
                        offer_name: offerName,
                        ip,
                        network,
                        sid, sid2, sid3, sid4, sid5,
                        code: hash,
                        gw_id: gwId,
                        uid,
                        campaign_id: campaignId,
                        app_id: placementId
                    } = offer;
    
                    // Get referrer ID
                    const refId = await getReferrerId(uid) || 0;
    
                    // Get the original payout for the offer
                    const originalPayout = await getOfferPayout(offerId, network);
                    let paidCredits = 0;
    
                    let sendPoints = points;
                    let oratio, splitCurrency;
                    const app = await App.findOne({ _id: placementId });
    
                    if (app) {
                        oratio = app.ratio;
                        splitCurrency = app.split_currency;
                    } else {
                        const user = await User.findOne({ _id: uid });
                        oratio = user.offerwall_ratio;
                        splitCurrency = user.split_currency;
                    }
    
                    sendPoints *= oratio * (splitCurrency / 100);
                    offer.status = 1;
                    offer.date = new Date();
                    await offer.save();
    
                    await User.updateOne({ _id: uid }, { $inc: { balance: points } });
    
                    await Transaction.create({
                        uid,
                        link_id: fileId,
                        gid: gwId,
                        campaign_id: campaignId,
                        offer_name: offerName,
                        credits: points,
                        type: 'credit',
                        date: new Date(),
                        network,
                        hash,
                        ip,
                        country,
                        placement_id: placementId
                    });
    
                    await Offer.updateOne({ campaign_id: campaignId, network }, { $inc: { leads: 1 } });
    
                    if (fileId) {
                        await ReadyDownloads.create({ token: hash, file_id: fileId, type: 'regular' });
                    }
    
                    if (gwId) {
                        await GwSession.updateOne({ session_id: hash, gid: gwId }, { complete: 1 });
                        await GwStats.create({
                            gid: gwId,
                            offer_id: offerId,
                            credits: points,
                            date: new Date(),
                            hash,
                            network
                        });
                    }
    
                    // Update EPC (Earnings per Click)
                    await setEpc(campaignId, network);
    
                    // Send postback to user
                    // await sendPostback(uid, offerId, 1, campaignId, network, sendPoints, sid, sid2, sid3, sid4, sid5, hash, placementId);
    
                    paidCredits = points;
    
                    // Add referral commission if applicable
                    if (refId && refPoints > 0) {
                        await User.updateOne({ _id: refId }, { $inc: { balance: refPoints } });
    
                        await Transaction.create({
                            uid: refId,
                            link_id: 0,
                            gid: 0,
                            referrer_id: uid,
                            campaign_id: campaignId,
                            offer_name: offerName,
                            credits: refPoints,
                            type: 'credit',
                            date: new Date(),
                            network,
                            hash,
                            ip,
                            country,
                            placement_id: placementId
                        });
    
                        paidCredits += refPoints;
                    }
    
                    // Admin earnings
                    const adminCredits = originalPayout ? originalPayout - paidCredits : 0;
    
                    if (!country) country = 'Unknown';
    
                    await AdminEarnings.create({
                        credits: adminCredits,
                        campaign_id: campaignId,
                        network,
                        offer_name: offerName,
                        uid,
                        date: new Date(),
                        hash,
                        offer_id: offerId,
                        country
                    });
    
                }
            }
    
            msg = "Leads approved successfully";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    selectedLeadReverse: async (req, res) => {
        try {
            let msg; 
            const { leads } = req.body;
            for (const lead of leads) {
                if (!lead) continue;
                const offer = await OfferProcess.findOne({ _id: lead, status: 1 });
                if (offer) {
                    const {
                        code: hash,
                        uid,
                        offer_id,
                        credits: points,
                        ref_credits: refPoints,
                        file_id,
                        offer_name,
                        campaign_id: oid,
                        network,
                        sid, sid2, sid3, sid4, sid5,
                        gw_id: gid,
                        app_id: placement_id
                    } = offer;
                    const refId = await getReferrerId(uid);
                    let mulReservePoints = points;
                    let oratio, splitCurrency;
                    const app = await App.findOne({ _id: placement_id });
                    if (app) {
                        oratio = app.ratio;
                        splitCurrency = app.split_currency;
                    } else {
                        const user = await User.findOne({ _id: uid });
                        oratio = user.offerwall_ratio;
                        splitCurrency = user.split_currency;
                    }
                    mulReservePoints *= oratio * (splitCurrency / 100);
                    // await EarningsLog.deleteMany({ uid, src_offer_id: oid, network, hash, notes: /Offer/ });
                    await Transaction.updateMany({ uid, offer_id: oid, network, hash, type: 'credit' }, { credits: 0, type: 'Reversed', date: new Date() });
                    await User.updateOne({ _id: uid }, { $inc: { balance: -points } });
                    await Offer.updateOne({ campaign_id: oid, network }, { $inc: { leads: -1 } });
    
                    if (gid > 0) {
                        await GwStats.deleteMany({ gid, offer_camp_id: oid, network, hash });
                    }
                    await AdminEarnings.deleteMany({ hash, network, campaign_id: oid });

                    // Send postback to user
                    // await sendPostback(uid, offer_id, 1, oid, network, mulReservePoints, sid, sid2, sid3, sid4, sid5, hash, placement_id);

                    if (refId && refPoints >= 0.01) {
                        await User.updateOne({ _id: refId }, { $inc: { balance: -refPoints } });
                        await Transaction.deleteMany({ uid: refId, referral_id: uid, offer_id: oid, network, hash, type: 'credit' });
                    }
    
                    await OfferProcess.updateOne(
                        // { campaign_id: oid, code: hash, network, status: { $ne: 2 }, uid },
                        { _id: lead },
                        { $set: { status: 2, date: new Date() } }
                    );
                }
            }

            msg = "Leads has been reversed successfully";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllLiveLeads: async (req, res) => {
        try {
            let msg;
            let { page, limit, category = 'innovativeLiveSurvey' } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if (page < 1 || limit < 1) {
                msg = 'page and limit must be positve integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getOfferProcess = await OfferProcess.find({ network: category }).skip((page - 1) * limit).limit(limit);
            const totalOfferProcess = await OfferProcess.countDocuments({ network: category });
            const totalPages = Math.ceil(totalOfferProcess / limit);
            msg = "Get all Live Leads successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalOfferProcess,
                getOfferProcess
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    searchLeads: async (req, res) => {
        try {
            let msg;
            let { page, limit, by, search } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if (page < 1 || limit < 1) {
                msg = 'page and limit must be positve integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const query = {};
            if (by && search) {
                if (by === 'user') {
                    const user = await User.findOne({ email_address: search });
                    if (!user) {
                        msg = 'User not found.';
                        const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                        return res.status(StatusCodes.NOT_FOUND).json(result);
                    }
                    query['uid'] = user._id;
                } else if (by === 'date') {
                
                    const searchDate = new Date(search);
                    if (isNaN(searchDate.getTime())) {
                        msg = 'Invalid date format.';
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
            
                    query['date'] = { $gte: startOfDay, $lte: endOfDay };
                } else {
                    query[by] = { $regex: search, $options: 'i' };
                }
            }
            
            const getOfferProcess = await OfferProcess.find(query).skip((page - 1) * limit).limit(limit);
            const totalOfferProcess = await OfferProcess.countDocuments(query);
            const totalPages = Math.ceil(totalOfferProcess / limit);
            msg = "Get searching Leads successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalOfferProcess,
                getOfferProcess
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

};