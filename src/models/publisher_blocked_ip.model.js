import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PublisherIpBlockedSchema = new Schema({
    uid: {
        type: String,
        default: null
    },
    email: {
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

const publisherBlockedIp = mongoose.model('publisherBlockedIp', PublisherIpBlockedSchema);

export default publisherBlockedIp;
