import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import OverallBlockedIp from "../../models/overall_blocked_ip.model.js";
import User from "../../models/user.model.js";
import  fs  from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OfferProcess from '../../models/offerprocess.model.js';
import csvParser from "csv-parser";
import { isIP } from "net";

export default {

    addOverallBlockedIp: async (req, res) => {
        try {
            let msg;
            const { ip } = req.body;
            if (!ip) {
                msg = 'IP is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingOverallBlockedIp = await OverallBlockedIp.findOne({ ip: ip });
            if (existingOverallBlockedIp) {
                msg = 'Overall Blocked IP is already exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newOverallBlockedIp = new OverallBlockedIp({
                ip,
                status: 1,
                datetime: new Date()
            });
            await newOverallBlockedIp.save();
            msg = 'Create Overall Blocked IP successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newOverallBlockedIp);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllOverallBlockedIp: async (req, res) => {
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
            const overallBlockedIps = await OverallBlockedIp.find().skip((page - 1) * limit).limit(limit);
            const totalOverallBlockedIp = await OverallBlockedIp.countDocuments();
            const totalPages = Math.ceil(totalOverallBlockedIp / limit);
            msg = "Get all Overall Blocked IP's successfully.";
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalOverallBlockedIp,
                overallBlockedIps
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateOverallBlockedIp: async (req, res) => {
        try {
            let msg;
            const { overallBlockedIp_id, status } = req.body;
            if (!overallBlockedIp_id) {
                msg = 'Overall-Blocked_IP id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingOverallBlockedIp = await OverallBlockedIp.findOne({ _id: overallBlockedIp_id });
            if (!existingOverallBlockedIp) {
                msg = 'Overall Blocked IP not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            if (status != undefined) {
                existingOverallBlockedIp.status = status;
            }
            await existingOverallBlockedIp.save();
            msg = 'Overall Blocked IP updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingOverallBlockedIp);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteOverallBlockedIp: async (req, res) => {
        try {
            let msg;
            const { overallBlockedIp_id } = req.body;
            if (!overallBlockedIp_id) {
                msg = 'Overall-Blocked-IP id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const existingOverallBlockedIp = await OverallBlockedIp.findOneAndDelete({ _id: overallBlockedIp_id });
            if (!existingOverallBlockedIp) {
                msg = 'Overall Blocked IP not found';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'Overall Blocked IP deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    selectedOverallBlockedIpDelete: async (req, res) => {
        try {
            let msg;
            const { OverallBlockedIpIds } = req.body;
            if (!OverallBlockedIpIds || OverallBlockedIpIds.length === 0) {
                msg = 'Overall-Blocked-IP not selected.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const selectedOverallBlockedIpIds = [];
            for (let i = 0; i < OverallBlockedIpIds.length; i++) {
                selectedOverallBlockedIpIds.push(OverallBlockedIpIds[i]);
            }
            const OverallBlockedIpDeleted = await OverallBlockedIp.deleteMany({ _id: { $in: selectedOverallBlockedIpIds } });
            if (OverallBlockedIpDeleted.deletedCount === 0) {
                msg = 'No Overall-Blocked-IP found to delete.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            msg = 'Overall-Blocked-IP(s) have been deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    uploadExcel: async (req, res) => {
        try {
            let msg;
            if (!req.file) {
                msg = 'File upload failed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const filePath = req.file.path;
            if (!fs.existsSync(filePath)) {
                msg = 'File not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            let ips = new Set();
            let skippedIps = [];
    
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', async (row) => {
                  
                    const ip = row.ip;
                    if (isIP(ip) && !ips.has(ip)) {
                        ips.add(ip);
                        let ipRecord = await OverallBlockedIp.findOne({ ip });
                        if (ipRecord) {
                            if (ipRecord.status === 0) {
                                ipRecord.status = 1;
                                ipRecord.datetime = new Date();
                                await ipRecord.save();
                            }
                        } else {
                            await OverallBlockedIp.create({ ip, status: 1, datetime: new Date() });
                        }
                    } else {
                        skippedIps.push(ip || 'Invalid IP');
                    }
                })
            .on('end', () => {
                msg = 'CSV file processed successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, {  skippedIps,
                    totalProcessed: ips.size,});
                return res.status(StatusCodes.OK).json(result);
            })
            .on('error', (err) => {
                console.error('Error while reading CSV file:', err);
                return res.status(500).json({ message: 'Error processing file' });
            });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    allUsersSaveAndDelete: async (req, res) => {
        try {
            let msg;
            const allUsers = await User.find();
            const usersJson = JSON.stringify(allUsers, null, 2);
            const filename = `all-users-${Date.now()}.json`;
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const dirPath = path.join(__dirname, '..', '..', 'uploads', 'all-users');
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            const filePath = path.join(dirPath, filename);
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/all-users/${filename}`;
            fs.writeFile(filePath, usersJson, (err) => {
                if (err) {
                    msg = 'Failed to save users to JSON file.';
                    const result = makeApiResponse(err, 0, StatusCodes.INTERNAL_SERVER_ERROR);
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
                }
                // User.deleteMany({}, (deleteErr) => {
                //     if (deleteErr) {
                //         msg = 'Failed to delete users from the database.';
                //         const result = makeApiResponse(deleteErr, 0, StatusCodes.INTERNAL_SERVER_ERROR);
                //         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
                //     }
                msg = 'All users saved to json file.';
                const result = makeApiResponse(msg, 0, StatusCodes.OK, { fileUrl });
                return res.status(StatusCodes.OK).json(result);
                // });
            });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    changeFileName: async (req, res) => {
        try {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const dirPath = path.join(__dirname, '..', '..', 'controllers', 'admin');
            console.log("currentDir: ", dirPath);
            const oldPath = path.join(dirPath, "network.controller.js");
            const newPath = path.join(dirPath, "networkcontroller.js");

            console.log('Old Path:', oldPath);
            console.log('New Path:', newPath);

            try {
                await fs.access(oldPath);
                console.log('Source file exists.');
            } catch (err) {
                console.error('Source file does not exist:', err);
                return res.status(404).send({ error: 'Source file does not exist' });
            }
            await fs.rename(oldPath, newPath);
            console.log('File renamed successfully');
            res.status(200).send({ message: 'File renamed successfully' });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    reversedOfferProcess: async (req, res) => {
        try {
            let msg;
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0); 
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);

            console.log('start day: ', startOfDay);
            console.log('end day: ', endOfDay);

            const startOfDayUTC = new Date(startOfDay.toISOString());
            const endOfDayUTC = new Date(endOfDay.toISOString());

            console.log('start day UTC: ', startOfDayUTC);
            console.log('end day UTC: ', endOfDayUTC);

            const offerProcesses = await OfferProcess.find({
                date: { $gte: startOfDay, $lte: endOfDay },
            });


            if (offerProcesses.length === 0) {
                msg = 'No offer processes found for today.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

            // const updatedOfferProcesses = await OfferProcess.updateMany(
            //     {
            //         date: { $gte: startOfDay, $lte: endOfDay },
            //         status: { $ne: 0 }
            //     },
            //     { $set: { status: 0 } }
            // );

            msg = 'Offer Process reversed succfully.';
            const result = makeApiResponse(msg, 0, StatusCodes.OK, offerProcesses);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }


};