import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import adminService from "../../services/admin.service.js";
import ApiKey from "../../models/apiKeys.model.js";
import User from "../../models/user.model.js";
import crypto from 'crypto';


export default {

    createApiKey: async (req, res) => {
        try {
            let msg;
            const {
                affiliate_name,
                api_key
            } = req.body;
            const { error, value } = adminService.validateCreateApiKeyData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const user = await User.findOne({ _id: affiliate_name });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            let apiKey = '';
            if(api_key == 'generateApiKey'){
                const apiKeyLength = 64;
                apiKey = crypto.randomBytes(apiKeyLength).toString('hex').substring(0, 48);
            }
            const newApiKey = new ApiKey({
                uid: user._id,
                apikey: apiKey,
                status: 'active',
                requestBit: 'accepted'
            });
            await newApiKey.save();
            msg = 'Api Key generated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newApiKey);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getApiKey: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if (page < 1 || limit < 1) {
                msg = 'page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const apiKeys = await ApiKey.find().skip((page - 1) * limit).limit(limit);
            const totalApiKeys = await ApiKey.countDocuments();
            const totalPages = Math.ceil(totalApiKeys / limit);
            msg = 'Get All Api keys successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalApiKeys,
                apiKeys
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getSingleApiKey: async (req, res) => {
        try {
            let msg;
            const { api_key_id } = req.body;
            if(!api_key_id){
                msg = 'Api_key_id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getApiKey = await ApiKey.findOne({ _id: api_key_id });
            if (!getApiKey) {
                msg = 'Api_key id not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

         msg = 'Get Single Api Key successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, getApiKey);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateApiKey: async (req, res) => {
        try {
            let msg;
            const { 
                api_key_id,
                affiliate_name,
                api_key,
            } = req.body;
            const { error, value } = adminService.validateupdateApiKeyData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const updateApiKey = await ApiKey.findOne({ _id: api_key_id });
            if (!updateApiKey) {
                msg = 'Api_key id not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const user = await User.findOne({ _id: affiliate_name });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            let apiKey = '';
            if(api_key == 'generateApiKey'){
                const apiKeyLength = 64;
                apiKey = crypto.randomBytes(apiKeyLength).toString('hex').substring(0, 48);
            }
            updateApiKey.uid = affiliate_name || updateApiKey.uid;
            updateApiKey.apikey = apiKey || updateApiKey.apikey;
            await updateApiKey.save();
            msg = 'Api Key updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, updateApiKey);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    changeApiKeyStatus: async (req, res) => {
        try {
            let msg;
            const { api_key_id } = req.body;

        if(!api_key_id){
                msg = 'Api_key_id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const updateApiKey = await ApiKey.findOne({ _id: api_key_id });
            if (!updateApiKey) {
                msg = 'Api_key id not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            if(updateApiKey.status === 'inactive'){
                updateApiKey.status = 'active';
            }else{
                updateApiKey.status = 'inactive';
            }
            await updateApiKey.save();

            msg = `API Key is ${updateApiKey.status}.`;
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    generateApiKey: async (req, res) => {
        try {
            let msg;
            const { api_key_id } = req.body;
            if(!api_key_id){
                msg = 'Api_key_id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const updateApiKey = await ApiKey.findOne({ _id: api_key_id });
            if (!updateApiKey) {
                msg = 'Api_key id not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
          
                const apiKeyLength = 64;
                const apiKey = crypto.randomBytes(apiKeyLength).toString('hex').substring(0, 48);

            updateApiKey.apikey = apiKey;
            updateApiKey.status = 'active';
            await updateApiKey.save();
            msg = 'Api Key generate successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

};