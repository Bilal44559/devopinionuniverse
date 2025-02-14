import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import Complaint from '../../models/complaint.model.js';


export default {


    getComplaints: async (req, res) => {
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
            const getComplaints = await Complaint.find().skip((page - 1) * limit).limit(limit);
            const totalComplaints = await Complaint.countDocuments();
            const totalPages = Math.ceil(totalComplaints / limit);
            msg = 'Get All Api keys successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalComplaints,
                getComplaints
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getSingleComplaint: async (req, res) => {
        try {
            let msg;
            const { complaint_id } = req.body;
            if(!complaint_id){
                msg = 'complaint_id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getComplaint = await Complaint.findOne({ _id: complaint_id });
            if (!getComplaint) {
                msg = 'Complaint id not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

         msg = 'Get Single Complaint successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, getComplaint);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },


};