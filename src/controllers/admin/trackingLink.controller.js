import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import OverallBlockedIp from "../../models/overall_blocked_ip.model.js";
import User from "../../models/user.model.js";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OfferProcess from '../../models/offerprocess.model.js';

export default {

    // addTrackingLink: async (req, res) => {
    //     try {
    //         let msg;
    //         const { publisherId } = req.body;
    //         if (!publisherId) {
    //             msg = 'Publisher Id is required.';
    //             const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
    //             return res.status(StatusCodes.NOT_FOUND).json(result);
    //         }
    //         const existingOverallBlockedIp = await User.findOne({ _id: publisherId });
    //         if (existingOverallBlockedIp) {
    //             msg = 'Overall Blocked IP is already exist.';
    //             const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
    //             return res.status(StatusCodes.BAD_REQUEST).json(result);
    //         }
    //         const newOverallBlockedIp = new OverallBlockedIp({
    //             ip,
    //             status: 1,
    //             datetime: new Date()
    //         });
    //         await newOverallBlockedIp.save();
    //         msg = 'Create Overall Blocked IP successfully.';
    //         const result = makeApiResponse(msg, 1, StatusCodes.OK, newOverallBlockedIp);
    //         return res.status(StatusCodes.OK).json(result);
    //     } catch (error) {
    //         res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    //     }
    // },

    getAllTrackingLinks: async (req, res) => {
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
            const getBlockedUser = await User.find({'tracking_link_bit': 1 }).skip((page - 1) * limit).limit(limit);
            const totalBlockedUser = await User.countDocuments();
            const totalPages = Math.ceil(totalBlockedUser / limit);
            msg = "Get all Blocked Users successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalBlockedUser,
                getBlockedUser
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateTrackingLink: async (req, res) => {
        try {
            let msg;
            if (!req.params.id) {
                msg = 'publisherId id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingPublisherData = await User.findOne({ _id: req.params.id });
            // console.log(existingPublisherData);
            // return false;
            if (!existingPublisherData) {
                msg = 'Publisher data not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

            existingPublisherData.tracking_link_bit = 1;
            // console.log("existingPublisherData", existingPublisherData);
            // return false;
            await existingPublisherData.save();
            msg = 'Publisher updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, []);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteTrackingLink: async (req, res) => {
        try {
            let msg;
            if (!req.params.id) {
                msg = 'publisherId id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingPublisherData = await User.findOne({ _id: req.params.id });
            if (!existingPublisherData) {
                msg = 'Publisher data not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            
            existingPublisherData.tracking_link_bit = 0;
            await existingPublisherData.save();
            msg = 'Publisher deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    selectedTrackingLinkDelete: async (req, res) => {
        try {
            let msg;
            const { publisherIds } = req.body;
    
            // Check if publisherIds and updateData are provided
            if (!publisherIds || publisherIds.length === 0) {
                msg = 'publisherIds not selected.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
    
            // Perform the update operation
            const updateResult = await User.updateMany(
                { _id: { $in: publisherIds } }, // Filter
                { $set: { tracking_link_bit: 0 } } // Update operation
            );
    
            // Check if any documents were updated
            if (updateResult.modifiedCount === 0) {
                msg = 'No Publsher found to update.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
    
            // Success response
            msg = 'publisher have been updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },


};