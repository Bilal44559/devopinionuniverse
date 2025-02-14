import mongoose from 'mongoose';
import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import Campaigns from "../../models/campaigns.model.js";
import User from "../../models/user.model.js";
import CampaignProcess from '../../models/campaignProcess.model.js';

export default {

    getAllAdsLeads: async (req, res) => {
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
            const campaigns = await Campaigns.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'pid',
                        foreignField: 'uid',
                        as: 'userDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$userDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                { 
                    $skip: (page - 1) * limit
                },
                { 
                    $limit: limit
                }
            ]);
            const transformedCampaigns = [];
            for (let i = 0; i < campaigns.length; i++) {
                const row = campaigns[i];
                const id = row._id;
                const title = row.title;
                const user_name = row.userDetails ? `${row.userDetails.firstname} ${row.userDetails.lastname}` : 'Unknown';
                const publisher_id = row.pid;
                const duration = row.duration;
                const payout = row.payout;
                const views = row.views;
                const no_of_views = row.no_of_views;
                const datetime = row.date_time;
                const status = row.status;
                const per_click_value = row.per_click_value;

                let statusMsg;
                if (status === 1) {
                    statusMsg = "Active";
                } else if (status === 2) {
                    statusMsg = "Blocked";
                } else if (status === 3) {
                    statusMsg = "Deleted";
                } else {
                    statusMsg = status;
                }
                
                transformedCampaigns.push({
                    id,
                    title,
                    user_name,
                    publisher_id,
                    duration,
                    payout,
                    views,
                    no_of_views,
                    datetime,
                    status: statusMsg,
                    per_click_value
                });
            }
            const totalCampaigns = await Campaigns.countDocuments();
            const totalPages = Math.ceil(totalCampaigns / limit);
            msg = "Get all Ads Leads successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalCampaigns,
                getCampaigns: transformedCampaigns
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteAdsLead: async (req, res) => {
        try {
            let msg;
            const { campaign_id } = req.body;
            if (!campaign_id) {
                msg = 'Campaign ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const campaign = await Campaigns.findOne({ _id: campaign_id });
            if (!campaign) {
                msg = 'Campaign not found';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const remaining = campaign.payout - campaign.views_amount; 
            campaign.status = 3;
            await campaign.save();
            if (campaign.payout > campaign.views_amount) {
                const user = await User.findOne({ _id: campaign.pid });
                if (user) {
                    const updatedAdsCredit = user.ads_credit - remaining;
                    await User.updateOne(
                        { _id: campaign.pid },
                        { $set: { ads_credit: updatedAdsCredit } }
                    );
                }
            }
            msg = "Campaign has been deleted successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }, 

    updateStatusAdsLead: async (req, res) => {
        try {
            let msg;
            let { campaign_id } = req.body;
            if (!campaign_id) {
                msg = 'Campaign ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const campaign = await Campaigns.findOne({ _id: campaign_id });
            if (!campaign) {
                msg = 'Campaign not found';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const { status, payout, pid } = campaign;
            if (status === 1) {
                campaign.status = 2; 
            } else {
                campaign.status = 1;  
            }
            await campaign.save();
            if (status === 3) {
                const user = await User.findOne({ _id: pid });
                if (user) {
                    const updatedAdsCredit = user.ads_credit - payout;
                    await User.updateOne(
                        { _id: pid },
                        { $set: { ads_credit: updatedAdsCredit } }
                    );
                }
            }
            msg = "Campaign has been updated successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    detailAdsLeads: async (req, res) => {
        try {
            let msg;
            const { campaign_id } = req.body;
            if (!campaign_id) {
                msg = 'Campaign ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const campaigns = await Campaigns.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(campaign_id),
                    },      
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'pid',
                        foreignField: 'uid',
                        as: 'userDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$userDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
            ]);
            if (campaigns.length === 0) {
                msg = 'Campaign not found';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

            const campaign = campaigns[0];
            const id = campaign._id;
            const title = campaign.title;
            const user_name = campaign.userDetails ? `${campaign.userDetails.firstname} ${campaign.userDetails.lastname}` : 'Unknown';
            const publisher_id = campaign.pid;
            const duration = campaign.duration;
            const payout = campaign.payout;
            const views = campaign.views;
            const no_of_views = campaign.no_of_views;
            const datetime = campaign.date_time;
            const status = campaign.status;
            const per_click_value = campaign.per_click_value;
            const country = campaign.country;
            const totalClicks = campaign.views;
            const totalSpent = campaign.views_amount;
            const transformedCampaigns = {
                id,
                title,
                user_name,
                publisher_id,
                duration,
                payout,
                datetime,
                status,
                country,
                per_click_value
            };
            const campaignProcessDetails = await CampaignProcess.aggregate([
                {
                    $match: {
                        camp_id: new mongoose.Types.ObjectId(campaign_id),
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'pid',
                        foreignField: 'uid',
                        as: 'processUserDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$processUserDetails',
                        preserveNullAndEmptyArrays: true
                    }
                }
            ]);
    
            const processDetails = [];

            for (let i = 0; i < campaignProcessDetails.length; i++) {
                const row = campaignProcessDetails[i];
                const sid = row.sid;
                const pid = row.pid;
                const user_name = row.processUserDetails ? `${row.processUserDetails.firstname} ${row.processUserDetails.lastname}` : 'Unknown';
                const code = row.code;
                const datetime = row.datetime ? new Date(row.datetime).toLocaleString('en-US', { hour12: true }) : '';
                
                processDetails.push({
                    sid,
                    pid,
                    user_name,
                    code,
                    datetime
                });
               
            };

            msg = "Get campaign detail successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                CampaignDetail: transformedCampaigns,
                totalClicks,
                totalSpent,
                ProcessDetails: processDetails
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    
};