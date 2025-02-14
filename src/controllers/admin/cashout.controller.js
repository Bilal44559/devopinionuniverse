import { makeApiResponse } from "../../lib/response.js";
import { StatusCodes } from "http-status-codes";
import Cashout from "../../models/cashouts.model.js";
import User from "../../models/user.model.js";
import cashout from "../../models/cashouts.model.js";
import CashoutLog from "../../models/cashoutlogs.model.js";

export default {

    getAllCashout: async (req, res) => {
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
            const getCashouts = await Cashout.find().skip((page - 1) * limit).limit(limit);
            const cashouts = [];
            for (let i = 0; i < getCashouts.length; i++) {
                const cashout = getCashouts[i];
                // const user = await User.find({ _id: cashout.uid });

                cashouts.push({
                    id: cashout._id,
                    uid: cashout.uid,
                    // username: user.email_address,
                    amount: cashout.amount,
                    method: cashout.method,
                    status: cashout.status,
                    priority: cashout.priority,
                    date: cashout.request_date
                });
            }
            const totalCashouts = await Cashout.countDocuments();
            const totalPages = Math.ceil(totalCashouts / limit);
            msg = "Get all Cashouts successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalCashouts,
                cashouts
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getSingleCashout: async (req, res) => {
        try {
            let msg;
            const { cashout_id } = req.body;
            if (!cashout_id) {
                msg = 'Cashout ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const cashout = await Cashout.findOne({ _id: cashout_id });
            if (!cashout) {
                msg = 'Cashout not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            // const cashoutUser = await User.findOne({ _id: cashout.uid });
            const amount = cashout.amount;
            let feeDeductionPercentage = 0;    
    
            if(amount < 1000){
                feeDeductionPercentage = 3; // 3 percent
            }
            if(amount >= 1000){
                feeDeductionPercentage = 2; // 2 percent
            }
    
            const feeDeductionAmount = (feeDeductionPercentage / 100) * amount;
            const subAmount = amount - feeDeductionAmount;
            const getCashout = {
                ...cashout.toObject(),
                // user: cashoutUser.email_address,
                sub_amount: subAmount,
                fee: feeDeductionAmount
            };
        
            msg = "Get single cashout successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, getCashout);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateCashout: async (req, res) => {
        try {
            let msg;
            const { cashout_id, status = 'Pending' } = req.body;
            if (!cashout_id) {
                msg = 'Cashout ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const cashout = await Cashout.findOne({ _id: cashout_id });
            if (!cashout) {
                msg = 'Cashout not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            cashout.status = status || cashout.status;
            await cashout.save();
            if (status === 'Complete') {
                const cashoutLog = new CashoutLog({
                    uid: cashout.uid,
                    amount: `Cash Withdrawn - $${cashout.amount}`,
                    date: new Date()
                });
                await cashoutLog.save();
                cashout.payment_date = new Date();
                await cashout.save();
            } else if (status === 'Cancelled') {
                const user = await User.findOne({ _id: cashout.uid });
                if (user) {
                    user.balance += cashout.amount;
                    await user.save();
                }
            }

            msg = "Cashout request updated successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteCashout: async (req, res) => {
        try {
            let msg;
            const { cashout_id } = req.body;
            if (!cashout_id) {
                msg = 'Cashout ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const cashout = await Cashout.deleteOne({ _id: cashout_id });
            if (cashout.deletedCount === 0) {
                msg = 'Cashout not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = "Cashout request deleted successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    selectedCashoutDelete: async (req, res) => {
        try {
            let msg;
            const { cashout_ids } = req.body;
            if (!cashout_ids || cashout_ids.length === 0) {
                msg = 'Affiliate ID(s) are required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const selectedCashoutIds = [];
            for (let i = 0; i < cashout_ids.length; i++) {
                selectedCashoutIds.push(cashout_ids[i]);
            }
            const cashouts = await Cashout.find({ _id: { $in: selectedCashoutIds } });
            if (!cashouts || cashouts.length === 0) {
                msg = 'No cashouts found with the given IDs.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const cashoutDeleted = await User.deleteMany({ _id: { $in: selectedCashoutIds } });
            if (cashoutDeleted.deletedCount === 0) {
                msg = 'No cashout request found to delete.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'Cashout(s) requests have been deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    searchCashout: async (req, res) => {
        try {
            let msg;
            let { page, limit, username, status } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
    
            const query = {};
            if (status && status !== "All") {
                query.status = status;
            }
    
            const lookupStage = {
                $lookup: {
                    from: "users",
                    localField: "uid",
                    foreignField: "_id",
                    as: "user"
                }
            };
    
            const unwindStage = {
                $unwind: "$user"
            };
    
            if (username) {
                query["user.email_address"] = { $regex: username, $options: "i" };
            }
    
            const skipStage = {
                $skip: (page - 1) * limit
            };
    
            const limitStage = {
                $limit: limit
            };

            const totalCashouts = await Cashout.aggregate([
                lookupStage,
                unwindStage,
                { $match: query },
                { $count: "count" }
            ]);
    
            const totalRecords = totalCashouts[0]?.count || 0;
            const totalPages = Math.ceil(totalRecords / limit);
    
            const getSearchingCashouts = await Cashout.aggregate([
                lookupStage,
                unwindStage,
                { $match: query },
                skipStage,
                limitStage
            ]);
    
            msg = "Cashout search completed successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalRecords,
                cashouts: getSearchingCashouts
            });
            return res.status(StatusCodes.OK).json(result);
    
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    
};