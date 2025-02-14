import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import Network from "../../models/networks.model.js";
import Offer from "../../models/offers.model.js";
import OfferProcess from "../../models/offerprocess.model.js";
import adminService from "../../services/admin.service.js";

export default {

    getAllNetworks: async (req, res) => {
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
            const networks = await Network.find().skip(page - 1).limit(limit);
            const networkDetails = [];
            for (let i = 0; i < networks.length; i++) {
                const network = networks[i];
                const countOffers = await Offer.countDocuments({ network: network.name });
                const countLeads = await OfferProcess.countDocuments({ network: network.name, status: 1 });

                networkDetails.push({
                    id: network._id,
                    name: network.name,
                    offers: countOffers,
                    leads: countLeads,
                    status: network.active,
                    hashVariable: network.parameter,
                });
            }
            const totalNetworks = await Network.countDocuments();
            const totalPages = Math.ceil(totalNetworks / limit);
            msg = 'Get All Campaigns successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalNetworks,
                networks: networkDetails
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    addNetwork: async (req, res) => {
        try {
            let msg;
            const {
                name,
                status,
                param,
                complete,
                reversal,
                ips
            } = req.body;
            const { error, value } = adminService.validateCreateNetworkData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingNetwork = await Network.findOne({ name });
            if (existingNetwork) {
                msg = 'network with given name is already in the database.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newNetwork = new Network({
                name,
                active: status,
                parameter: param,
                complete,
                reversal,
                ips
            });
            await newNetwork.save();
            msg = 'network added successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newNetwork);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateNetwork: async (req, res) => {
        try {
            let msg;
            const {
                networkId,
                name,
                status,
                param,
                complete,
                reversal,
                ips
            } = req.body;
            const { error, value } = adminService.validateupdateNetworkData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const updateNetwork = await Network.findOne({ _id: networkId });
            if (!updateNetwork) {
                msg = 'network not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (name !== updateNetwork.name) {
                const existingNetwork = await Network.findOne({ name });
                if(existingNetwork){
                msg = 'network with given name is already in the database.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
            updateNetwork.name = name || updateNetwork.name;
            updateNetwork.active = status || updateNetwork.active;
            updateNetwork.parameter = param || updateNetwork.parameter;
            updateNetwork.complete = complete || updateNetwork.complete;
            updateNetwork.reversal = reversal || updateNetwork.reversal;
            updateNetwork.ips = ips || updateNetwork.ips;
            await updateNetwork.save();
            msg = 'network updateed successully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, updateNetwork);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteNetwork: async (req, res) => {
        try {
            let msg;
            const { networkId } = req.body;
            if(!networkId){
                msg = 'network id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingNetwork = await Network.findOneAndDelete({ _id: networkId });
            if(!existingNetwork){
                msg = 'network not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'network deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    selectedNetworkDelete: async (req, res) => {
        try {
            let msg;
            const { networkIds } = req.body;
            if (!networkIds || networkIds.length === 0) {
                msg = 'network id(s) are required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const selectedNetworkIds = [];
            for (let i = 0; i < networkIds.length; i++) {
                selectedNetworkIds.push(networkIds[i]);
            }
            const networkDeleted = await Network.deleteMany({ _id: { $in: selectedNetworkIds } });
            if (networkDeleted.deletedCount === 0) {
                msg = 'No network found to delete.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'Network(s) have been deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
};