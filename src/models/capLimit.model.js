import mongoose from 'mongoose';

const capLimitSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    offer: {
        type: [String],
        required: true
    },
    limit: {
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

const capLimit = mongoose.model('capLimit', capLimitSchema);

export default capLimit;
