import mongoose from 'mongoose';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import User from '../../models/user.model.js';
import publisherBlockedIp from '../../models/publisher_blocked_ip.model.js';

export default {

    addPublisherBlockedIp: async (req, res) => {
        try {
            let msg;
            const {
              email,
            } = req.body;
            if (!email) {
                msg = 'Email is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const user = await User.findOne({ email_address: email });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingPublisherBlockedIp = await publisherBlockedIp.findOne({email: user.email_address});
            if(existingPublisherBlockedIp){
                msg = 'Publisher Blocked IP is already exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newPublisherBlockedIp = new publisherBlockedIp({
                uid: user._id,
                email: user.email_address,
                status: 1,
                datetime: new Date(),
            });
            await newPublisherBlockedIp.save()
            msg = 'Create Publisher Blocked IP successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newPublisherBlockedIp);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllPublisherBlockedIp: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if(page < 1 || limit < 1){
                msg = 'page and limit must be positive integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const publisherBlockedIps = await publisherBlockedIp.find().skip((page - 1) * limit).limit(limit);
            const totalPublisherBlockedIps = await publisherBlockedIp.countDocuments();
            const totalPages = Math.ceil(totalPublisherBlockedIps / limit);
            msg = 'Get all Publisher Blocked IPs successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalPublisherBlockedIps,
                publisherBlockedIps
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updatePublisherBlockedIp: async (req, res) => {
        try {
            let msg;
            const {
                publisherBlockedIp_id,
                status
            } = req.body;
            const existingPublisherBlockedIp = await publisherBlockedIp.findOne({ _id: publisherBlockedIp_id });
            if(!existingPublisherBlockedIp){
                msg = 'Publisher Blocked Ip not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            if (status !== undefined) {
                existingPublisherBlockedIp.status = status;
            }
            await existingPublisherBlockedIp.save();
            msg = 'Publisher Blocked Ip updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingPublisherBlockedIp);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deletePublisherBlockedIp: async (req, res) => {
        try {
            let msg;
            const { publisherBlockedIp_id } = req.body;
            if(!publisherBlockedIp_id){
                msg = 'Publisher Blocked IP id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingPublisherBlockedIp = await publisherBlockedIp.findOneAndDelete({ _id: publisherBlockedIp_id });
            if(!existingPublisherBlockedIp){
                msg = 'Publisher Blocked IP is not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'Publisher Blocked IP is deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    selectedPublisherBlockedIpDelete: async (req, res) => {
        try {
            let msg;
            const { publisherBlockedIp_ids } = req.body;
            if (!publisherBlockedIp_ids || publisherBlockedIp_ids.length === 0) {
                msg = 'Publisher-Blocked-IP id(s) are required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const selectedpublisherBlockedIpIds = [];
            for (let i = 0; i < publisherBlockedIp_ids.length; i++) {
                selectedpublisherBlockedIpIds.push(publisherBlockedIp_ids[i]);
            }
            const selectedpublisherBlockedIpDeleted = await publisherBlockedIp.deleteMany({ _id: { $in: selectedpublisherBlockedIpIds } });
            if (selectedpublisherBlockedIpDeleted.deletedCount === 0) {
                msg = 'No Publisher Blocked IP found to delete.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'Publisher-Blocked-IP(s) have been deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
};