import { StatusCodes } from "http-status-codes";
import { makeApiResponse } from "../../lib/response.js";
import adminService from "../../services/admin.service.js";
import News from "../../models/news.model.js";
import Admin from "../../models/admin.model.js";

export default {

    addNews: async (req, res) => {
        try {
            let msg;
            const { title, description } = req.body;
            const { error, value } = adminService.validateAddNewsData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            // const admin = await Admin.findOne({ _id: req.adminId });
            let imagePath = '';
            if (req.file) {
              const  filename = req.file.filename;
              imagePath = `${req.protocol}://${req.get("host")}/uploads/images/admin/news/${filename}`;
            }
            const newNews = await News({
                title,
                // written_by: admin._id,
                description,
                img: imagePath,
                date: new Date()
            });
            await newNews.save();
            msg = 'Create News successfully.';
                const result = makeApiResponse(msg, 0, StatusCodes.OK, newNews);
                return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllNews: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if(page < 1 || limit < 1){
                msg = 'page and  limit must be postive integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const news = await News.find().skip((page - 1) * limit).limit(limit);
            const totalNews = await News.countDocuments();
            const totalPages = Math.ceil(totalNews / limit);
            msg = 'Get all news successully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalNews,
                news
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }
};