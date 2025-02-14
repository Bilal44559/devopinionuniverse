import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
    offer_id: {
        type: Number,
        default: null
    },
    name: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    link: {
        type: String,
        default: null
    },
    active: {
        type: Number,
        default: 1
    },
    credits: {
        type: Number,
        default: 0.00
    },
    hits: {
        type: Number,
        default: 0
    },
    limit: {
        type: Number,
        default: 0
    },
    countries: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    network: {
        type: String,
        default: null
    },
    network_data: {
        type: Object, // Store the network data object directly here
        default: {
            network_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Network' },
            default_network_id: null,
            network_name: null
        }
    },
    campaign_id: {
        type: String,
        default: null
    },
    leads: {
        type: Number,
        default: null
    },
    epc: {
        type: Number,
        default: null
    },
    mobile: {
        type: Number,
        default: null
    },
    categories: {
        type: String,
        default: null
    },
    cr: {
        type:Number,
        default: null
    },
    views: {
        type: Number,
        default: 0
    },
    conv: {
        type: Number,
        default: null
    },
    browsers: {
        type: String,
        default: null
    },
    uid: {
        type: Number,
        ref: 'User',
        default: null
    },
    preview: {
        type: String,
        default: null
    },
    adgatemedia_events: {
        type: String,
        default: null
    },
    offer_requirements: {
        type: String,
        default: null
    },
    image_url:{
        type: String,
        default: null
    },
    offer_preview_url: {
        type: String,
        default: null
    },
    deleted_bit: {
        type: Number,
        default: 0
    },
    deleted_date: {
        type: Date,
        default: null
    },
    ban_offer_bit: {
        type: Number,
        default: 0
    },
    ban_offer_date: {
        type: Date,
        default: null
    },
    instal_event_payout: {
        type: String,
        default: null
    },
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Offer = mongoose.model('offers', OfferSchema);

export default Offer;
