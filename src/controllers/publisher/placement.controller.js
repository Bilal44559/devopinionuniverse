import App from "../../models/apps.model.js";
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import userService from "../../services/user.service.js";
import crypto from 'crypto';
import ValidUrl from 'valid-url';
import axios from "axios";


export default {

    getApp: async (req, res) => {
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
            const apps = await App.find({ uid: req.userId }).skip((page - 1) * limit).limit(limit);
            const totalApps = await App.countDocuments();
            const totalPages = Math.ceil(totalApps / limit);
            msg = 'Get all Apps successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalApps,
                apps
            });
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    createApp: async (req, res) => {
        try {
            let msg;
            const {
                app_name,
                website_url,
            } = req.body;

            const { error, value } = userService.validateAppPlacementData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const prefix = 'ID_';
            const uniqueId = prefix + crypto.randomBytes(16).toString('hex');

            const addApp = new App({
                uid: req.userId,
                app_name,
                unique_id: uniqueId,
                website_url,
                datetime: new Date()
            });

            const newApp = await addApp.save();
            msg = 'App has been created successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newApp);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }

    },

    updateApp: async (req, res) => {
        try {
            let msg;
            const {
                appId,
                app_name,
                website_url
            } = req.body;

            const { error, value } = userService.validateUpdateAppPlacementData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const updateApp = await App.findOne({ uid: req.userId, _id: appId });
            if (updateApp) {
                updateApp.app_name = app_name || updateApp.app_name;
                updateApp.website_url = website_url || updateApp.website_url;
                updateApp.datetime = new Date();

                await updateApp.save();

                msg = 'Your app has been updated successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, updateApp);
                res.status(StatusCodes.OK).json(result);
            } else {
                msg = 'App not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                res.status(StatusCodes.NOT_FOUND).json(result);
            }

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }

    },

    deleteApp: async (req, res) => {
        try {
            let msg;
            const { appId } = req.body;

            const { error, value } = userService.validateDeleteAppData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const deleteApp = await App.findByIdAndDelete({ uid: req.userId, _id: appId });

            if (deleteApp) {
                msg = 'App deleted successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK);
                return res.status(StatusCodes.OK).json(result);
            } else {
                msg = 'App not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    generalSettingApp: async (req, res) => {
        try {
            let msg;
            const { appId, website_url } = req.body;
            const { error, value } = userService.validateGeneralSettingAppData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const updateApp = await App.findOne({ uid: req.userId, _id: appId });
            if (updateApp) {
                updateApp.website_url = website_url || updateApp.website_url;

                await updateApp.save();

                msg = 'Your app setting save successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, updateApp);
                res.status(StatusCodes.OK).json(result);
            } else {
                msg = 'App not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                res.status(StatusCodes.NOT_FOUND).json(result);
            }

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }

    },

    currencySettingApp: async (req, res) => {
        try {
            let msg;
            const {
                appId,
                currency,
                split_currency,
                ratio
            } = req.body;
            const { error, value } = userService.validateCurrencySettingAppData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const updateApp = await App.findOne({ uid: req.userId, _id: appId });
            if (updateApp) {
                updateApp.currency = currency || updateApp.currency;
                updateApp.split_currency = split_currency || updateApp.split_currency;
                updateApp.ratio = ratio || updateApp.ratio;

                await updateApp.save();

                msg = 'Your app setting save successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, updateApp);
                res.status(StatusCodes.OK).json(result);
            } else {
                msg = 'App not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                res.status(StatusCodes.NOT_FOUND).json(result);
            }

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    designSettingApp: async (req, res) => {
        try {
            let msg;
            const {
                appId,
                categories,
                primary_clr,
                secondary_clr,
                text_clr
            } = req.body;
            const { error, value } = userService.validatedesignSettingAppData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let imagePath = '';
            if (req.file) {
                imagePath = req.file.filename;
            } else {
                msg = 'Logo is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const updateApp = await App.findOne({ uid: req.userId, _id: appId });
            if (updateApp) {
                updateApp.logo = imagePath || updateApp.logo;
                updateApp.categories = categories || updateApp.categories;
                updateApp.primary_clr = primary_clr || updateApp.primary_clr;
                updateApp.secondary_clr = secondary_clr || updateApp.secondary_clr;
                updateApp.text_clr = text_clr || updateApp.text_clr;

                await updateApp.save();

                msg = 'Your app setting save successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, updateApp);
                res.status(StatusCodes.OK).json(result);
            } else {
                msg = 'App not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                res.status(StatusCodes.NOT_FOUND).json(result);
            }

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    apiKeySettingApp: async (req, res) => {
        try {
            let msg;
            let {
                appId,
                api_key_status
            } = req.body;
            const { error, value } = userService.validateApiKeySettingAppData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const updateApp = await App.findOne({ uid: req.userId, _id: appId });

            if (updateApp) {

                if (api_key_status === undefined || api_key_status === null) {
                    const apiKeyLength = 64;
                    const apiKey = crypto.randomBytes(apiKeyLength).toString('hex').substring(0, 48);

                    console.log("Generated API Key:", apiKey);

                    updateApp.api_key = apiKey;
                }

                if (api_key_status !== undefined) {
                    updateApp.api_key_status = api_key_status;
                }
                await updateApp.save();

                msg = 'Your app setting saved successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, updateApp);
                return res.status(StatusCodes.OK).json(result);
            } else {
                msg = 'App not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    postBackSettingApp: async (req, res) => {
        try {
            let msg;
            let {
                appId,
                postback_url,
                ip,
                removePostback,
            } = req.body;

            if (removePostback === 'removePB') {
                await App.updateOne({ uid: req.userId, _id: appId }, { $set: { postback_url: null } });
                msg = 'Your postback has been removed successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK);
                return res.status(StatusCodes.OK).json(result);
            }

            if (postback_url && ValidUrl.isUri(postback_url)) {

                const updateApp = await App.findOne({ uid: req.userId, _id: appId });

                if (!updateApp) {
                    msg = 'App not found.';
                    const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                    return res.status(StatusCodes.NOT_FOUND).json(result);
                }
                updateApp.postback_url = postback_url || updateApp.postback_url;
                updateApp.ip = ip || 0;
                await updateApp.save();

                msg = 'Your app setting saved successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, updateApp);
                return res.status(StatusCodes.OK).json(result);
            } else {
                msg = 'Invalid Postback URL.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    //     removePostBackSettingApp: async (req, res) => {
    // try {
    //     let msg;
    //     const { appId } = req.body;
    //     const updateApp = await App.findOne({uid: req.userId, _id: appId});
    //     if(!updateApp){
    //         msg = 'App not found.';
    //         const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
    //         return res.status(StatusCodes.NOT_FOUND).json(result);
    //     }
    //     updateApp.postback_url = null;
    //     await updateApp.save();

    //     msg = 'Your app setting saved successfully.';
    //     const result = makeApiResponse(msg, 1, StatusCodes.OK, updateApp);
    //     return res.status(StatusCodes.OK).json(result);
    // } catch (error) {
    //     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    // }

    //     },

    testPostbackSettingApp: async (req, res) => {
        try {
            let msg;
            const {
                appId,
                offerId,
                sid,
                sid2,
                sid3,
                sid4,
                sid5,
                status,
                payout
            } = req.body;
            const postback = await App.findOne({ uid: req.userId, _id: appId });
            // console.log('postbackUrl: ', postback.postback_url);
            if (!postback) {
                msg = "You haven't set any postback yet. Please set it before testing it.";
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

            if (postback.postback_url && ValidUrl.isUri(postback.postback_url)) {

                let url = postback.postback_url;
                url = url.replace("[OFFERID]", offerId || '');
                url = url.replace("[STATUS]", status || '');
                url = url.replace("[SID]", sid || '');
                url = url.replace("[SID2]", sid2 || '');
                url = url.replace("[SID3]", sid3 || '');
                url = url.replace("[SID4]", sid4 || '');
                url = url.replace("[SID5]", sid5 || '');
                url = url.replace("[PAYOUT]", payout || '');

                const response = await axios.get(url);
                msg = `Postback has been sent to ${url}.`;
                const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                    status: response.status,
                    headers: response.headers,
                    data: response.data
                });
                return res.status(StatusCodes.OK).json(result);

            } else {
                msg = 'Invalid Postback URL.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

};
