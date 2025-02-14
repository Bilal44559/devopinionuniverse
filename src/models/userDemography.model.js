import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UserDemographySchema = new Schema({
    pubid: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    status: {
        type: Number,
        default: 1
    },
    sid: {
        type: String,
        default: null
    },
    question: {
        type: String,
        default: null
    },
    answer: {
        type: String,
        default: null
    },
    question_key: {
        type: String,
        default: null
    },
    survey_platform: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const UserDemography = mongoose.model('userDemography', UserDemographySchema);
export default UserDemography;
