import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import PbLog from '../../models/pblog.model.js';


export default {


    getPostbackList: async (req, res) => {
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
            const getPostback = await PbLog.find().skip((page - 1) * limit).limit(limit);
            const totalPostbacks = await PbLog.countDocuments();
            const totalPages = Math.ceil(totalPostbacks / limit);
            msg = 'Get All Api keys successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalPostbacks,
                getPostback
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getSinglePostbackDetail: async (req, res) => {
        try {
            let msg;
            if(!req.params.id){
                msg = 'postback_id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getPostback = await PbLog.findOne({ _id: req.params.id });
            if (!getPostback) {
                msg = 'Postback id not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

         msg = 'Get Single Postback successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, getPostback);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },


};