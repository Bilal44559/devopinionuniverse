import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const LiveSurveyQuestionSchema = new Schema({
    uid: {
        type: String,
        default: null
    },
    question: {
        type: String,
        default: null
    },
    options: {
        type: String,  // Use String for text fields as Mongoose does not have a separate text type
        default: null
    },
    answer: {
        type: String,
        default: null
    },
    status: {
        type: Number,
        default: 1
    },
    date: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const LiveSurveyQuestion = mongoose.model('liveSurveyQuestion', LiveSurveyQuestionSchema);

export default LiveSurveyQuestion;
