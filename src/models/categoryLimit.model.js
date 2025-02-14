import mongoose from 'mongoose';

const categoryLimitSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        required: true
    },
    datetime: {
        type: Date,
        default: null
    },
}, {
    timestamps: true 
});

const categoryLimit = mongoose.model('categoryLimit', categoryLimitSchema);

export default categoryLimit;
