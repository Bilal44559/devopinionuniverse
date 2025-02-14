import { makeApiResponse } from "../../lib/response.js";
import { StatusCodes } from "http-status-codes";
import adminService from '../../services/admin.service.js';
import User from "../../models/user.model.js";
import PbSettings from "../../models/pbsettings.model.js";
import { sendEmail } from '../../lib/mail.js';
import PendingUsers from "../../models/pendingusers.model.js";
import Cashout from "../../models/cashouts.model.js";
import OfferProcess from "../../models/offerprocess.model.js";
import Message from "../../models/messages.model.js";
import Transaction from "../../models/transactions.model.js";
import Ban from "../../models/bans.model.js";
import crypto from 'crypto';

export default {

    affiliateView: async (req, res) => {
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
            const getUsers = await User.find().skip((page - 1) * limit).limit(limit);
            const users = [];
            for (let i = 0; i < getUsers.length; i++) {
                const user = getUsers[i];
    
                let status = "Inactive";
                if (user.active === 1) status = "Active";
                if (user.isBan === 1) {
                    status = "Banned";
                } else if (user.isLocked === 1) {
                    status = "Temporary Locked";
                }
    
                const email_verified = user.email_verified === 1 ? "Verified" : "Unverified";

                users.push({
                    uid: user._id,
                    email_address: user.email_address,
                    email_verified,
                    status,
                    date: user.date_registration
                });
            }
            const totalUsers = await User.countDocuments();
            const totalPages = Math.ceil(totalUsers / limit);
            msg = "Get all affiliates successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalUsers,
                users
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getSingleAffiliate: async (req, res) => {
        try {
            let msg;
            const { affiliate_id } = req.body;
            if (!affiliate_id) {
                msg = 'Affiliate ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const user = await User.findOne({ _id: affiliate_id });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const postbackUrl = await PbSettings.findOne({ uid: affiliate_id });
            const pburl = postbackUrl ? postbackUrl.url : "";
            const getUser = {
                ...user.toObject(),
                url: pburl
            };
            msg = "Get single affiliate successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, getUser);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateAffiliate: async (req, res) => {
        try {
            let msg;
            const {
                affiliate_id,
                status = 0,
                balance,
                country,
                email_address,
                hearby,
                website,
                fname,
                lname,
                state,
                city,
                zip,
                address,
                pburl,
                payment_cycle,
                payment_method,
                payment_method_details
            } = req.body;
            const { error, value } = adminService.validateUpdateAffiliateData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const user = await User.findOne({ _id: affiliate_id });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingUser = await User.findOne({ email_address, _id: { $ne: affiliate_id } });
            if (existingUser) {
                msg = 'This email address is already in use by other user';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
          
            user.firstname = fname || user.firstname;
            user.lastname = lname || user.lastname;
            user.email_address = email_address || user.email_address;
            user.country = country || user.country;
            user.address = address || user.address;
            user.state = state || user.state;
            user.zip = zip || user.zip;
            user.city = city || user.city;
            user.website = website || user.website;
            user.hearby = hearby || user.hearby;
            user.balance = balance || user.balance;
            user.payment_cycle = payment_cycle || user.payment_cycle;
            user.payment_method = payment_method || user.payment_method;
            user.payment_method_details = payment_method_details || user.payment_method_details;
            user.active = status || user.active;
            const updateUser = await user.save();
            const pbSetting = await PbSettings.findOne({ uid: user._id });
            if (pbSetting) {
                pbSetting.url = pburl || pbSetting.url;
                await pbSetting.save();
            } else {
               const newPbSetting = new PbSettings({
                    uid: user._id,
                    pb_type: 'global',
                    url: pburl,
                    check_ip: 0,
                    date: new Date()
                });
                await newPbSetting.save();
            }
            
            if (status === 1) {

                const options = {
                    email: email_address,
                    subject: 'Welcome To Opinion Universe',
                    html: `Dear ${fname},<br />Your signup application has been approved, now you can login to our website using your login user and password <br /><br />Regards,<br />opinionuniverse.com`,
                };

                sendEmail(options);
           
                await PendingUsers.deleteOne({ email: email_address });
            }
            
            msg = "Profile updated successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, updateUser);
            return res.status(StatusCodes.OK).json(result);
    
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteAffiliate: async (req, res) => {
        try {
            let msg;
            const { affiliate_id } = req.body;
            if (!affiliate_id) {
                msg = 'Affiliate ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const user = await User.findOne({ _id: affiliate_id });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const username = user.email_address;
            await User.deleteOne({ _id: affiliate_id });
            await Cashout.deleteMany({ uid: affiliate_id });
            await PendingUsers.deleteOne({ uid: affiliate_id });
            await OfferProcess.deleteMany({ uid: affiliate_id });
            await Transaction.deleteMany({ uid: affiliate_id });
            await Message.deleteMany({ sender: username, receiver: username });
    
            msg = "User deleted successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
    
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateIsBanAffiliate: async (req, res) => {
        try {
            let msg;
            const { affiliate_id, is_ban } = req.body;
            if (!affiliate_id) {
                msg = 'Affiliate ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            if (!['ban', 'unban'].includes(is_ban)) {
                msg = 'Invalid value for is_ban. Use "ban" or "unban".';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const user = await User.findOne({ _id: affiliate_id });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            if (is_ban === 'ban') {
                user.isBan = 1;
                await user.save();
                const randomString = crypto.randomBytes(8).toString('hex');
                const caseValue = `${randomString}${new Date().getDate()}`;
                const newBan = new Ban({
                    uid: affiliate_id,
                    reason: "Banned by Admin",
                    date: new Date(),
                    case: caseValue
                });
                await newBan.save();  
            msg = "User banned successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);

            } else if (is_ban === 'unban') {
                user.isBan = 0;
                await user.save();
                await Ban.deleteOne({ uid: affiliate_id });
                 
            msg = "User unbanned successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateIsLockedAffiliate: async (req, res) => {
        try {
            let msg;
            const { affiliate_id} = req.body;
            if (!affiliate_id) {
                msg = 'Affiliate ID is required';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const user = await User.findOne({ _id: affiliate_id });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            user.isLocked = 0;
            await user.save();

            msg = "User unlocked successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    selectedAffiliateDelete: async (req, res) => {
        try {
            let msg;
            const { affiliate_ids } = req.body;
            if (!affiliate_ids || affiliate_ids.length === 0) {
                msg = 'Affiliate ID(s) are required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const selectedAffiliateIds = [];
            for (let i = 0; i < affiliate_ids.length; i++) {
                selectedAffiliateIds.push(affiliate_ids[i]);
            }
            const users = await User.find({ _id: { $in: selectedAffiliateIds } });
            if (!users || users.length === 0) {
                msg = 'No users found with the given IDs.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const usernames = users.map(user => user.email_address);
            const userDeleted = await User.deleteMany({ _id: { $in: selectedAffiliateIds } });
            if (userDeleted.deletedCount === 0) {
                msg = 'No users found to delete.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            await Cashout.deleteMany({ uid: { $in: selectedAffiliateIds } });
            await PendingUsers.deleteMany({ uid: { $in: selectedAffiliateIds } });
            await OfferProcess.deleteMany({ uid: { $in: selectedAffiliateIds } });
            await Transaction.deleteMany({ uid: { $in: selectedAffiliateIds } });
            await Message.deleteMany({ $or: [{ sender: { $in: usernames } }, { receiver: { $in: usernames } }] });
            msg = 'User(s) have been deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    searchAffiliate: async (req, res) => {
        try {
            let msg;
            let { page, limit, email_address, status } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if (page < 1 || limit < 1) {
                msg = 'page and limit must be positve integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const query = {};
            if (email_address) {
                query.email_address = { $regex: email_address, $options: "i" };
            }
            if (status && status !== "All") {
                if (status === "Active") {
                    query.active = 1;
                    query.isBan = 0;
                } else if (status === "Inactive") {
                    query.active = 0;
                    query.isBan = 0;
                } else if (status === "Banned") {
                    query.isBan = 1;
                }
            }
            const getSearchingUsers = await User.find(query).skip((page - 1) * limit).limit(limit);
            const totalUsers = await User.countDocuments(query);
            const totalPages = Math.ceil(totalUsers / limit);
            msg = "Get searching Users successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalUsers,
                getSearchingUsers
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    
};