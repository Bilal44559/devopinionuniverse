import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const LiveSurveyQuestionlibrarySchema = new Schema({
    question_id: {
        type: Number,
        default: null
    },
    question_text: {
        type: String,
        default: null
    },
    question_type: {
        type: String,
        default: null
    },
    question_response: {
        type: String,  // Use String for longtext as Mongoose does not differentiate
        default: null
    },
    country_code: {
        type: String,
        default: null
    },
    language: {
        type: String,
        default: null
    },
    question_key: {
        type: String,
        default: null
    },
    option_response: {
        type: String,  // Use String for longtext
        default: null
    },
    status: {
        type: Number,
        required: true,
        default: 0
    },
    survey_platform: {
        type: String,
        required: true,
        default: 'innovateLiveSurvey'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const LiveSurveyQuestionlibrary = mongoose.model('liveSurveyQuestionlibrary', LiveSurveyQuestionlibrarySchema);

export default LiveSurveyQuestionlibrary;
