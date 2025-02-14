import mongoose from 'mongoose';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import adminService from '../../services/admin.service.js';
import QuestionnariesResult from '../../models/questionnaire_results.model.js';
import User from '../../models/user.model.js';
import userQuestionsAttempt from '../../models/userQuestionAttempts.model.js';
import LiveSurveyQuestion from '../../models/liveSurveyQuestionaries.model.js';

export default {

    userDataManage: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if (page < 1 || limit < 1) {
                msg = 'page and limit must be positive integer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const questionResults = await QuestionnariesResult.find().skip((page - 1) * limit).limit(limit);
            const userIds = [];
            for (const result of questionResults) {
                if (result.uid) {
                    userIds.push(result.uid);
                }
            }
            const userMap = {};
            if (userIds.length > 0) {
                const users = await User.find({ _id: { $in: userIds } });
                for (const user of users) {
                    userMap[user._id] = `${user.firstname} ${user.lastname}`;
                }
            }
            for (const result of questionResults) {
                result.userName = userMap[result.uid] || 'Unknown User';
            }

            const totalQuestionResults = await QuestionnariesResult.countDocuments();
            const totalPages = Math.ceil(totalQuestionResults / limit);

            msg = 'Get all user questions result successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalQuestionResults,
                questionResults
            });
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getSingleUserDataManage: async (req, res) => {
        try {
            let msg;
            const { userDataManageId } = req.body;
            if (!userDataManageId) {
                msg = 'userDataManageId is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getSingleUserQuestionResult = await QuestionnariesResult.findOne({ _id: userDataManageId });
            if (!getSingleUserQuestionResult) {
                msg = 'user question result not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const userQuestionAttempts = await userQuestionsAttempt.find({ uid: getSingleUserQuestionResult.uid, sid: getSingleUserQuestionResult.sid });
            if (!userQuestionAttempts) {
                msg = 'user question attempt not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            for (let userQuestionAttempt of userQuestionAttempts) {
                const qid = userQuestionAttempt.qid;
                const liveSurveyQuestion = await LiveSurveyQuestion.find({ _id: qid });
                if (!liveSurveyQuestion) {
                    msg = 'live survey question not found.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
                msg = 'get single user data successfully';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                    getSingleUserQuestionResult,
                    userQuestionAttempt,
                    liveSurveyQuestion,
                });
                return res.status(StatusCodes.OK).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateUserDataManage: async (req, res) => {
        try {
            let msg;
            const { userDataManageId } = req.body;
            if (!userDataManageId) {
                msg = 'userDataManageId is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const getSingleUserQuestionResult = await QuestionnariesResult.findOne({ _id: userDataManageId });
            if (!getSingleUserQuestionResult) {
                msg = 'user question result not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const userQuestionAttempt = await userQuestionsAttempt.find({ uid: getSingleUserQuestionResult.uid, sid: getSingleUserQuestionResult.sid });
            if (!userQuestionAttempt) {
                msg = 'user question attempt not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const liveSurveyQuestion = await LiveSurveyQuestion.find({ _id: userQuestionAttempt.qid });
            if (!liveSurveyQuestion) {
                msg = 'live survey question not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            msg = 'get single user data successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                getSingleUserQuestionResult,
                userQuestionAttempt,
                liveSurveyQuestion,
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

}