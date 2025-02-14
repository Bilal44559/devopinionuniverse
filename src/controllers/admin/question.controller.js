import mongoose from 'mongoose';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import adminService from '../../services/admin.service.js';
import LiveSurveyQuestion from '../../models/liveSurveyQuestionaries.model.js';

export default {

    createQuestion: async (req, res) => {
        try {
            let msg; 
            const {
                question,
                options,
                answer
            } = req.body;

            const { error, value } = adminService.validateQuestionData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newLiveSurveyQuestion = new LiveSurveyQuestion({
                // aid,
                  question,
                  options,
                  answer,
                  status: 1,
                  date: new Date(),
            });
            await newLiveSurveyQuestion.save();
            msg = 'Create Live Survey Question successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newLiveSurveyQuestion);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllQuestions: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if(page < 1 || limit < 1){
                msg = 'Page and limit must be positive integer.';
                const result = makeApiResponse(msg, 1, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const questions = await LiveSurveyQuestion.find().skip((page - 1) * limit).limit(limit);
            const totalQuestions = await LiveSurveyQuestion.countDocuments();
            const totalPages = Math.ceil(totalQuestions / limit);

            msg = 'Get all Live Survey Questions successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalQuestions,
                questions
            });
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    singleQuestion: async (req, res) => {
        try {
            let msg;
            const { questionId } = req.body;
            if(!questionId){
                msg = 'question id is required.';
                const result = makeApiResponse(msg, 1, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingQuestion = await LiveSurveyQuestion.findOne({ _id: questionId });
            if(!existingQuestion){
                msg = 'Question not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'Get Single Question successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingQuestion);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateQuestion: async (req, res) => {
        try {
            let msg;
            const { 
                questionId,
                question,
                options,
                answer
             } = req.body;
            const { error, value } = adminService.validateUpdateQuestionData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingQuestion = await LiveSurveyQuestion.findOne({ _id: questionId });
            if(!existingQuestion){
                msg = 'Question not found.';
                const result = makeApiResponse(msg, 1, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            existingQuestion.question = question;
            existingQuestion.options = options;
            existingQuestion.answer = answer;
            await existingQuestion.save();
            msg = 'update Live Survey Question successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingQuestion);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteQuestion: async (req, res) => {
        try {
            let msg;
            const { questionId } = req.body;
            if(!questionId){
                msg = 'question id is required.';
                const result = makeApiResponse(msg, 1, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingQuestion = await LiveSurveyQuestion.findOneAndDelete({ _id: questionId });
            if(!existingQuestion){
                msg = 'question not found.';
                const result = makeApiResponse(msg, 1, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'Live Survey Question deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateQuestionStatus: async (req, res) => {
        try {
            let msg;
            const { questionId, status } = req.body;
            const { error, value } = adminService.validateUpdateQuestionStatusData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingQuestion  = await LiveSurveyQuestion.findOne({ _id: questionId });
            if(!existingQuestion){
                msg = 'question not found.';
                const result = makeApiResponse(msg, 1, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            existingQuestion.status = status;
            await existingQuestion.save();
            msg = 'Question status change  successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingQuestion);
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

}