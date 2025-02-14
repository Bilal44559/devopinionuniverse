import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import Offer from "../../models/offers.model.js";
import adminService from "../../services/admin.service.js";
import BannedOffer from "../../models/bannedOffers.model.js";

export default {
    
    getAllCampaigns: async (req, res) => {
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
            const offers = await Offer.find({ deleted_bit: 0 }).skip((page - 1) * limit).limit(limit);
            const totalOffers = await Offer.countDocuments({ deleted_bit: 0 });
            const totalPages = Math.ceil(totalOffers / limit);
            msg = 'Get All Campaigns successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalOffers,
                offers
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    addCampaign: async (req, res) => {
        try {
            let msg;
            let {
                offer_name,
                description,
                link,
                limit,
                payout,
                countries,
                network,
                campaign_id,
                status,
                ua_target,
                mobile,
                categories,
                epc,
                hits,
                preview,
                leads,
                preview_url,
                requirement
            } = req.body;
            const { error, value } = adminService.validateCreateCampaignData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let ua = Array.isArray(ua_target) ? ua_target.join('|') : 'All';
            let countriesArr = Array.isArray(countries) ? countries.join('|') : 'All';
            if (!mobile) mobile = 0;
            if (!status) status = 0;
            if (!limit) limit = 0;
            if (network !== 'BigBangAds') {
                const existingOffer = await Offer.findOne({ campaign_id, network });
                if (existingOffer) {
                    msg = 'Campaign id is already in database.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            if (network == 'User') {
                campaign_id = Math.floor(Math.random() * (99999 - 22222 + 1)) + 22222;
            }
            const newOffer = new Offer({
                name: offer_name,
                description,
                link,
                active: status,
                credits: payout,
                hits,
                limit,
                countries: countriesArr,
                network,
                campaign_id,
                leads,
                epc,
                mobile,
                categories,
                cr: 0,
                views: 0,
                conv: 0,
                browsers: ua,
                preview,
                offer_requirements: requirement,
                offer_preview_url: preview_url,
                date: new Date()
            });

            await newOffer.save();
            msg = 'Offer create successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newOffer);
            return res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateCampaign: async (req, res) => {
        try {
            let msg;
            let {
                offer_id,
                offer_name,
                description,
                link,
                limit,
                payout,
                countries,
                network,
                campaign_id,
                status,
                ua_target,
                mobile,
                categories,
                epc,
                hits,
                preview,
                leads,
                preview_url,
                requirement
            } = req.body;
            const { error, value } = adminService.validateUpdateCampaignData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const updateOffer = await Offer.findOne({ _id: offer_id });
            if (!updateOffer) {
                msg = 'offer id not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            let ua = Array.isArray(ua_target) ? ua_target.join('|') : 'All';
            let countriesArr = Array.isArray(countries) ? countries.join('|') : 'All';
            if (!mobile) mobile = 0;
            if (!status) status = 0;
            if (!limit) limit = 0;
            if (network !== 'BigBangAds' && campaign_id !== updateOffer.campaign_id) {
                const existingOffer = await Offer.findOne({ campaign_id, network });
                if (existingOffer) {
                    msg = 'Campaign id is already in database.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            if (network == 'User') {
                campaign_id = Math.floor(Math.random() * (99999 - 22222 + 1)) + 22222;
            }
            updateOffer.name = offer_name || updateOffer.name;
            updateOffer.description = description || updateOffer.description;
            updateOffer.link = link || updateOffer.link;
            updateOffer.active = status || updateOffer.active;
            updateOffer.credits = payout || updateOffer.credits;
            updateOffer.hits = hits || updateOffer.hits;
            updateOffer.limit = limit || updateOffer.limit;
            updateOffer.countries = countriesArr || updateOffer.countries;
            updateOffer.network = network || updateOffer.network;
            updateOffer.campaign_id = campaign_id || updateOffer.campaign_id;
            updateOffer.leads = leads || updateOffer.leads;
            updateOffer.epc = epc || updateOffer.epc;
            updateOffer.mobile = mobile || updateOffer.mobile;
            updateOffer.categories = categories || updateOffer.categories;
            updateOffer.categories = categories || updateOffer.categories;
            updateOffer.browsers = ua || updateOffer.browsers;
            updateOffer.preview = preview || updateOffer.preview;
            updateOffer.offer_requirements = requirement || updateOffer.offer_requirements;
            updateOffer.offer_preview_url = preview_url || updateOffer.offer_preview_url;
            updateOffer.date = new Date();
            await updateOffer.save();
            msg = 'Offer updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, updateOffer);
            return res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteCampaign: async (req, res) => {
        try {
            let msg;
            const { offer_id } = req.body;
            if (!offer_id) {
                msg = 'Offer id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingOffer = await Offer.findOneAndDelete({ _id: offer_id });
            if (!existingOffer) {
                msg = 'Offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'Offer deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllBannedOffers: async (req, res) => {
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
            const bannedOffers = await BannedOffer.find().skip((page - 1) * limit).limit(limit);
            const totalBannedOffers = await BannedOffer.countDocuments();
            const totalPages = Math.ceil(totalBannedOffers / limit);
            msg = 'Get All Banned Offers successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalBannedOffers,
                bannedOffers
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    addBannedOffer: async (req, res) => {
        try {
            let msg;
            const {
                campaign_id,
                network
            } = req.body;
            const { error, value } = adminService.validateAddBannedOfferData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingOffer = await Offer.findOne({ campaign_id, network });
            if (!existingOffer) {
                msg = 'Offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingBannedOffer = await BannedOffer.findOne({ camp_id: campaign_id, network });
            if (existingBannedOffer) {
                msg = 'This offer is already in banned list.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newBannedOffer = new BannedOffer({
                camp_id: campaign_id,
                network,
                date: new Date()
            });
            await newBannedOffer.save();
            msg = 'Offer added to banned list successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newBannedOffer);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    unBannedOffer: async (req, res) => {
        try {
            let msg;
            const {
                banOfferId,
            } = req.body;
            if (!banOfferId) {
                msg = 'ban_offer id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingBannedOffer = await BannedOffer.findOneAndDelete({ _id: banOfferId });
            if (!existingBannedOffer) {
                msg = 'Ban Offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'Offer deleted from banned list successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    selectedBannedOfferDelete: async (req, res) => {
        try {
            let msg;
            const { banOfferIds } = req.body;
            if (!banOfferIds || banOfferIds.length === 0) {
                msg = 'ban_offer id(s) are required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const selectedbannedOfferIds = [];
            for (let i = 0; i < banOfferIds.length; i++) {
                selectedbannedOfferIds.push(banOfferIds[i]);
            }
            const bannedOffersDeleted = await BannedOffer.deleteMany({ _id: { $in: selectedbannedOfferIds } });
            if (bannedOffersDeleted.deletedCount === 0) {
                msg = 'No offers found to delete.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'Offer(s) have been deleted from the banned list.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllAffiliateCampaigns: async (req, res) => {
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
            const userOffers = await Offer.find({ uid: 0 }).skip((page - 1) * limit).limit(limit);
            const totaluserOffers = await Offer.countDocuments({ uid: 0 });
            const totalPages = Math.ceil(totaluserOffers / limit);
            msg = 'Get All Banned Offers successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totaluserOffers,
                userOffers
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllDeletedOffers: async (req, res) => {
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
            const deletedOffers = await Offer.find({ deleted_bit: 1 }).skip((page - 1) * limit).limit(limit);
            const totaldeletedOffers = await Offer.countDocuments({ deleted_bit: 1 });
            const totalPages = Math.ceil(totaldeletedOffers / limit);
            msg = 'Get All deleted Offers successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totaldeletedOffers,
                deletedOffers
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateDeletedOffer: async (req, res) => {
        try {
            let msg;
            const { deletedOfferId } = req.body;
            if(!deletedOfferId){
                msg = 'deleted offer id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingDeletedOffer = await Offer.findOne({ _id: deletedOfferId, deleted_bit: 1 });
            if(!existingDeletedOffer){
                msg = 'deleted offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            existingDeletedOffer.deleted_bit = 0;
            existingDeletedOffer.deleted_date = new Date();
            await existingDeletedOffer.save();
            msg = 'Offer restored successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingDeletedOffer);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },



}