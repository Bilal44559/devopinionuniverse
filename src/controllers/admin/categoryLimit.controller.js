import mongoose from 'mongoose';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import adminService from '../../services/admin.service.js';
import User from '../../models/user.model.js';
import categoryLimit from '../../models/categoryLimit.model.js';


export default {

    createCategoryLimit: async (req, res) => {
        try {
            let msg;
            const {
                email,
                category
            } = req.body;
            const { error, value } = adminService.validateCreateCategoryLimitData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const user = await User.findOne({ email_address: email });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const newCategoryLimit = new categoryLimit({
                uid: user._id,
                email: user.email_address,
                category,
                status: 1,
                datetime: new Date()
            });
            await newCategoryLimit.save();
            msg = 'Category Limit create successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newCategoryLimit);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllCategoryLimit: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;

            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const categoryLimits = await categoryLimit.find().skip((page - 1) * limit).limit(limit);
            const totalCategoryLimit = await categoryLimit.countDocuments();
            const totalPages = Math.ceil(totalCategoryLimit / limit);

            msg = 'Get all Category Limits successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalCategoryLimit,
                categoryLimits
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    searchCategoryLimit: async (req, res) => {
        try {
            let msg;
            let { page, limit, search } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            search = search || "";
    
            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let searchQuery = {
                $or: [
                    { uid: search }, 
                    { email: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } }
                ]
            };
            // if (search) {
            //     searchQuery.$or.push({ status: { $regex: search, $options: 'i' } });
            // }
            const categoryLimits = await categoryLimit.find(searchQuery).skip((page - 1) * limit).limit(limit);
            const totalCategoryLimits = await categoryLimit.countDocuments(searchQuery);
            const totalPages = Math.ceil(totalCategoryLimits / limit);
    
            msg = 'Category limit search successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalCategoryLimits,
                categoryLimits
            });
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    
    updateCategoryLimit: async (req, res) => {
        try {
            let msg;
            const {
                categoryLimitId,
                email,
                category,
                status
            } = req.body;
            const { error, value } = adminService.validateUpdateCategoryLimitData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingCategoryLimit = await categoryLimit.findOne({ _id: categoryLimitId });
            if(!existingCategoryLimit){
                msg = 'Category Limit not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const user = await User.findOne({ email_address: email });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            existingCategoryLimit.uid = user._id || existingCategoryLimit.uid;
            existingCategoryLimit.email = user.email_address || existingCategoryLimit.email;
            existingCategoryLimit.category = category || existingCategoryLimit.category;
            existingCategoryLimit.status = status || existingCategoryLimit.status;
            existingCategoryLimit.datetime = new Date();
            await existingCategoryLimit.save();
            msg = 'Category Limit updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingCategoryLimit);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteCategoryLimit: async (req, res) => {
        try {
            let msg;
            const { categoryLimitId } = req.body;
            if (!categoryLimitId) {
                msg = 'category limit id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingCategoryLimit = await categoryLimit.findOneAndDelete({ _id: categoryLimitId });
            if (!existingCategoryLimit) {
                msg = 'category limit not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'category limit deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
};