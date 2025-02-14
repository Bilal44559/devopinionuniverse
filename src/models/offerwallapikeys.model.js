import mongoose from 'mongoose';

const OfferWallApiKeySchema = new mongoose.Schema({
    uid: {
        type: String,
        default: null
    },
    api_key: {
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
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const OfferWallApiKey = mongoose.model('offerwallapiKey', OfferWallApiKeySchema);

export default OfferWallApiKey;
