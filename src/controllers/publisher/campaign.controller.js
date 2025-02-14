import mongoose from 'mongoose';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import userService from "../../services/user.service.js";
import Campaign from '../../models/campaigns.model.js';
import { format } from 'date-fns';
import User from '../../models/user.model.js';
import CampaignSpendHistory from '../../models/campaignSpendHistory.model.js';
import  paypal from '../../config/paypalConfig.js';
import AdsCreditTransactionsHistory from '../../models/adsCreditTransactionsHistory.model.js';
// import { payout } from 'paypal-rest-sdk';
import {devConfig} from '../../config/config.js';
import path from 'path';

export default {

    getCampaign: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page, 10) || 1;
            limit = parseInt(limit, 10) || 10;

            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const campaigns = await Campaign.find({ pid: req.userId }).skip((page - 1) * limit).limit(limit);
            const totalCampaigns = await Campaign.countDocuments({ pid: req.userId });
            const totalPages = Math.ceil(totalCampaigns / limit);
            const totalViews = campaigns.reduce((acc, campaign) => acc + (campaign.views || 0), 0); 
            const user = await User.findOne({ _id: req.userId});
            const remainingCredits = user.ads_credit;
            const adsCreditTransactionHistory = await AdsCreditTransactionsHistory.findOne({ uid: req.userId });
            const totalCredits = adsCreditTransactionHistory ? adsCreditTransactionHistory.amount : 0;
            res.status(StatusCodes.OK).json({
                totalCredits,
                totalViews,
                remainingCredits,
                page,
                limit,
                totalPages,
                totalCampaigns,
                campaigns
            });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    addCampaign: async (req, res) => {
        try {
            let msg;
           
            const {
                title,
                description,
                ads_url,
                no_of_views,
                duration
            } = req.body;

            const { error, value } = userService.validateCampaignData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let imagePath = '';
            if (req.file) {
              const  filename = req.file.filename;
                imagePath =   path.join('uploads', 'images', 'campaignImage', filename);
            } else {
                msg = 'Image is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let per_click_value = null;
            if (duration === "8") {
                per_click_value = 0.005;
            } else if (duration === "15") {
                per_click_value = 0.007;
            } else if (duration === "25") {
                per_click_value = 0.009;
            } else if (duration === "30") {
                per_click_value = 0.012;
            }
            const date = new Date();
            const formattedDate = format(date, 'yyyy-MM-dd');
            const payout = (per_click_value !== null && no_of_views) ? per_click_value * no_of_views : 0;

        const newCampaign = new Campaign({
            title,
            description,
            ads_url,
            image: imagePath,
            no_of_views,
            duration,
            pid: req.userId,
            per_click_value: per_click_value,
            country: "All",
            datetime: formattedDate,
            payout
        });


        const user = await User.findOne({ _id: req.userId });
        if (!user) {
            msg = 'User not found.';
            const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
            return res.status(StatusCodes.NOT_FOUND).json(result);
        }

      
        if (user.ads_credit >= payout) {
            const campaignSpentHistory = new CampaignSpendHistory({
                uid : req.userId,
                camp_id : newCampaign._id,
                amount : payout,
                datetime : new Date() 
            });
            await campaignSpentHistory.save();
            user.ads_credit = user.ads_credit - payout; 
            await user.save(); 

           
            await newCampaign.save();

            msg = 'Your campaign has been added successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newCampaign);
            return res.status(StatusCodes.OK).json(result);
        } else {
            msg = "You don't have enough balance.";
            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
            return res.status(StatusCodes.BAD_REQUEST).json(result);
        }

          
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateCampaign: async (req, res) => {
        try {
            let msg;

            const {
                campaignId,
                title,
                description,
                ads_url,
                no_of_views,
                duration
            } = req.body;

            const { error, value } = userService.validateUpdateCampaignData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let imagePath = '';
            if (req.file) {
                imagePath = req.file.filename;
            } else {
                msg = 'Image is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const updateCampaign = await Campaign.findOne({ pid: req.userId, _id: campaignId });

            if (updateCampaign) {
                let per_click_value = null;
                if (duration === "8") {
                    per_click_value = 0.005;
                } else if (duration === "15") {
                    per_click_value = 0.007;
                } else if (duration === "25") {
                    per_click_value = 0.009;
                } else if (duration === "30") {
                    per_click_value = 0.012;
                }
                const date = new Date();
                const formattedDate = format(date, 'yyyy-MM-dd');

                updateCampaign.title = title || updateCampaign.title;
                updateCampaign.description = description || updateCampaign.description;
                updateCampaign.ads_url = ads_url || updateCampaign.ads_url;
                updateCampaign.no_of_views = no_of_views || updateCampaign.no_of_views;
                updateCampaign.duration = duration || updateCampaign.duration;
                updateCampaign.image = imagePath || updateCampaign.image;
                updateCampaign.per_click_value = per_click_value || updateCampaign.per_click_value;
                updateCampaign.country = "all";
                updateCampaign.datetime = formattedDate
                let maxPayout;
                let minPayout;
                let payout;
                if (per_click_value !== null && no_of_views) {
                    payout = per_click_value * no_of_views;
                    maxPayout = 0; 
                    minPayout = 0;
                    if(payout > updateCampaign.payout){
                        maxPayout = payout - updateCampaign.payout;
                       
                    } else{
                        minPayout = updateCampaign.payout - payout;
                    }
                    updateCampaign.payout = payout;
                }
                const user = await User.findOne({ _id: req.userId });
                if (!user) {
                    msg = 'User not found.';
                    const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                    return res.status(StatusCodes.NOT_FOUND).json(result);
                }
              
                if (user.ads_credit >= maxPayout) {
                    // const campaignSpentHistory = new CampaignSpendHistory({
                    //     uid : req.userId,
                    //     camp_id : newCampaign._id,
                    //     amount : payout,
                    //     datetime : new Date() 
                    // });
                    const updateCampaignSpentHistory = await CampaignSpendHistory.findOne({uid: req.userId, camp_id: updateCampaign._id});
                    updateCampaignSpentHistory.amount = payout;
                    updateCampaignSpentHistory.datetime = new Date();

                    await updateCampaignSpentHistory.save();
                    user.ads_credit = user.ads_credit - maxPayout; 
                    await user.save(); 
        
                   
                    await updateCampaign.save();
        
                    msg = 'Your campaign has been added successfully.';
                    const result = makeApiResponse(msg, 1, StatusCodes.OK, updateCampaign);
                    return res.status(StatusCodes.OK).json(result);
                } else {
                    msg = "You don't have enough balance.";
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            } else {
                msg = 'Campaign not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                res.status(StatusCodes.NOT_FOUND).json(result);
            }

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteCampaign: async (req, res) => {
        try {
            let msg;
            const {
                campaignId
            } = req.body;

            const { error, value } = userService.validateDeleteCampaignData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const deleteCampaign = await Campaign.findOneAndDelete({ pid: req.userId, _id: campaignId });

            if (deleteCampaign) {
                msg = 'Campaign deleted successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK);
                return res.status(StatusCodes.OK).json(result);
            } else {
                msg = 'Campaign not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }

    },

    createPayment: async (req, res) => {
    try {
        let msg;
        const { ads_credit, currency } = req.body;
        if (!ads_credit || !currency) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'ads_credit and currency are required' });
        }

        const payment = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal'
            },
            redirect_urls: {
                return_url: 'http://localhost:3000/publisher/executePayment',
                cancel_url: 'http://localhost:3000/cancel-payment'
            },
            transactions: [{
                amount: {
                    total: ads_credit, 
                    currency: currency
                },
                description: 'Your payment description here'
            }]
        };

        const createPaymentAsync = () => {
            return new Promise((resolve, reject) => {
                paypal.payment.create(payment, (error, payment) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(payment);
                    }
                });
            });
        };

        const paymentResponse = await createPaymentAsync();
        const approvalUrl = paymentResponse.links.find(link => link.rel === 'approval_url').href;

        const response = JSON.stringify({
            status: 1,
            msg: 'Transaction completed!',
            ref_id: paymentResponse.id
        });

        const adsCreditTransactionHistory = new AdsCreditTransactionsHistory({
            uid: req.userId,
            datetime: new Date(),
            response: response,
            type: 'paypal',
            amount: ads_credit
        });
        await adsCreditTransactionHistory.save();
        msg = 'Your payment creation was successful.';
        const result = makeApiResponse(msg, 1, StatusCodes.OK, { approvalUrl });
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
    },

    executePayment: async(req, res) => {
        try {
            const { paymentId, PayerID } = req.query;
            if (!paymentId || !PayerID) {
                return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Payment ID and Payer ID are required' });
            }
            paypal.payment.execute(paymentId, { payer_id: PayerID }, (error, payment) => {
                if (error) {
                    console.error('PayPal Error:', error.response ? error.response : error);
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Payment execution failed', details: error });
                }
                res.json({ message: 'Payment completed successfully', payment });
            });
    
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
};