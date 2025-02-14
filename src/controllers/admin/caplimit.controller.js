import mongoose from 'mongoose';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import User from '../../models/user.model.js';
import Offer from '../../models/offers.model.js';
import capLimit from "../../models/capLimit.model.js";

export default {
    createCapLimit: async (req, res) => {
        try {
            let msg;
            const {
                email,
                offers,
                limit
            } = req.body;

            if (!email) {
                msg = 'Email is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (!offers) {
                msg = 'At least one offer is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (typeof limit === 'undefined') {
                msg = 'Limit is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const user = await User.findOne({ email_address: email });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            let validOffers;
            let invalidOffers = [];
            if (Array.isArray(offers)) {
                validOffers = await Offer.find({ _id: { $in: offers } });
                const validOfferIds = new Set(validOffers.map(offer => offer._id.toString()));


                for (const offerId of offers) {
                    if (!validOfferIds.has(offerId)) {
                        invalidOffers.push(offerId);
                    }
                }

                if (invalidOffers.length > 0) {
                    msg = `Invalid offer ID(s): ${invalidOffers.join(', ')}`;
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }

                const newCapLimit = new capLimit({
                    uid: user._id,
                    email: user.email_address,
                    offer: offers,
                    limit: limit,
                    datetime: new Date()
                });
                await newCapLimit.save();
            } else if (offers === "All") {
                const newCapLimit = new capLimit({
                    uid: user._id,
                    email: user.email_address,
                    offer: ['All'],
                    limit: limit,
                    datetime: new Date()
                });
                await newCapLimit.save();
            } else {
                msg = 'Offers must be an array of offer IDs or "All".';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'Cap limits created successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllCapLimit: async (req, res) => {
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
            const capLimits = await capLimit.find().skip((page - 1) * limit).limit(limit);
            const totalCapLimit = await capLimit.countDocuments();
            const totalPages = Math.ceil(totalCapLimit / limit);

            msg = 'Get all Cap Limits successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalCapLimit,
                capLimits
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    searchCapLimit: async (req, res) => {
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
                    { offer: { $regex: search, $options: 'i' } }
                ]
            };
            // if (search) {
            //     searchQuery.$or.push({ status: { $regex: search, $options: 'i' } });
            // }
            const capLimits = await capLimit.find(searchQuery).skip((page - 1) * limit).limit(limit);
            const totalCapLimits = await capLimit.countDocuments(searchQuery);
            const totalPages = Math.ceil(totalCapLimits / limit);
    
            msg = 'Cap limit search successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalCapLimits,
                capLimits
            });
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateCapLimit: async (req, res) => {
        try {
            let msg;
            const {
                capLimitId,
                offers,
                limit
            } = req.body;
            if (!capLimitId) {
                msg = 'cap limit id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (!offers) {
                msg = 'email is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (!limit) {
                msg = 'email is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingCapLimit = await capLimit.findOne({ _id: capLimitId });
            if (!existingCapLimit) {
                msg = 'cap limit not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let validOffers;
            let invalidOffers = [];
            if (Array.isArray(offers)) {
                validOffers = await Offer.find({ _id: { $in: offers } });
                const validOfferIds = new Set(validOffers.map(offer => offer._id.toString()));


                for (const offerId of offers) {
                    if (!validOfferIds.has(offerId)) {
                        invalidOffers.push(offerId);
                    }
                }

                if (invalidOffers.length > 0) {
                    msg = `Invalid offer ID(s): ${invalidOffers.join(', ')}`;
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
                existingCapLimit.offer = offers;
                existingCapLimit.limit = limit;
                existingCapLimit.datetime = new Date();
                await existingCapLimit.save();
            } else if (offers === "All") {
                existingCapLimit.offer = ['All'];
                existingCapLimit.limit = limit;
                existingCapLimit.datetime = new Date();
                await existingCapLimit.save();
            } else {
                msg = 'Offers must be an array of offer IDs or "All".';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'Cap limits updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteCapLimit: async (req, res) => {
        try {
            let msg;
            const { capLimitId } = req.body;
            if (!capLimitId) {
                msg = 'cap limit id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingCapLimit = await capLimit.findOneAndDelete({ _id: capLimitId });
            if (!existingCapLimit) {
                msg = 'cap limit not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'cap limit deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
}