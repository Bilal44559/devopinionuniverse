import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const OverallIpBlockedSchema = new Schema({
    ip: {
        type: String,
        default: null
    },
    status: {
        type: Number,
        default: null
    },
    datetime: {
        type: Date,
        default: null
    },

}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const OverallBlockedIp = mongoose.model('OverallBlockedIp', OverallIpBlockedSchema);

export default OverallBlockedIp;
