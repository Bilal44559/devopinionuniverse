import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UserQuestionAttemptsSchema = new Schema({
    uid: {
        type: String,
        default: null
    },
    sid: {
        type: String,
        default: null
    },
    qid: {
        type: String,
        default: null
    },
    answer_status: {
        type: String,
        default: null
    },
    datetime: {
        type: Date,
        default: null
    },
    answer: {
        type: String,
        default: null
    },
    user_answer: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const userQuestionsAttempt = mongoose.model('userQuestionsAttempts', UserQuestionAttemptsSchema);
export  default userQuestionsAttempt;
