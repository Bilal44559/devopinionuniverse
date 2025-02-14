import mongoose from 'mongoose';

const OfferEventSchema = new mongoose.Schema({
    default_offer_event_id: {
        type: Number,
        default: null
    },
    uid: {
        type: Number,
        default: null
    },
    publisher_data: {
        type: Object, // Store the publisher data object directly here
        default: {
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            uid: null
        }
    },
    event_id: {
        type: String,
        default: null
    },
    event_name: {
        type: String,
        default: null
    },
    offer_data: {
        type: Object, // Store the offer data object directly here
        default: {
            offer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
            default_offer_id: null,
            offer_name: null
        }
    },
    default_offer_id: {
        type: Number,
        default: null
    },
    offer_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    pub_payout: {
        type: Number,
        default: null
    },
    user_payout: {
        type: Number,
        default: null
    },
    sid: {
        type: String,
        default: null
    },
    datetime: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const OfferEvents = mongoose.model('offerevents', OfferEventSchema);

export default OfferEvents;
