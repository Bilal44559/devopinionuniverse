import mongoose from 'mongoose';

const deleteofferSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        index: true,
        autoIncrement: true
    },
    offer_id: {
        type: Number,
        required: true
    },
    name: {
        type: String, // Using String for long text
        default: null
    },
    description: {
        type: String, // Using String for long text
        default: null
    },
    link: {
        type: String, // Using String for long text
        default: null
    },
    active: {
        type: Number,
        default: 1
    },
    credits: {
        type: mongoose.Types.Decimal128,
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
        type: String, // Using String for long text
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    network: {
        type: String,
        maxlength: 20,
        default: null
    },
    campaign_id: {
        type: String,
        maxlength: 100,
        default: null
    },
    leads: {
        type: Number,
        default: null
    },
    epc: {
        type: mongoose.Types.Decimal128,
        default: null
    },
    mobile: {
        type: Number,
        default: null
    },
    categories: {
        type: String,
        maxlength: 255,
        default: null
    },
    cr: {
        type: mongoose.Types.Decimal128,
        default: null
    },
    views: {
        type: Number,
        default: 0
    },
    conv: {
        type: mongoose.Types.Decimal128,
        default: null
    },
    browsers: {
        type: String, // Using String for long text
        default: null
    },
    uid: {
        type: Number,
        default: null
    },
    preview: {
        type: String,
        maxlength: 200,
        default: null
    },
    adgatemedia_events: {
        type: String, // Using String for long text
        default: null
    },
    offer_requirements: {
        type: String, // Using String for long text
        default: null
    },
    offer_preview_url: {
        type: String, // Using String for long text
        default: null
    },
    deleted_date: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields
});

const DeleteOffer = mongoose.model('deleteoffers', deleteofferSchema);

export default DeleteOffer;
