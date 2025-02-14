import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const QuestionnariesResultSchema = new Schema({
    uid: {
        type: String,
        default: null
    },
    sid: {
        type: String,
        default: null
    },
    result: {
        type: String,
        default: null
    },
    marks: {
        type: Number,
        default: null
    },
    datetime: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const QuestionnariesResult = mongoose.model('questionnariesresults', QuestionnariesResultSchema);

export default QuestionnariesResult;
