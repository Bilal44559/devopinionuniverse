import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const GatewaySchema = new Schema({
    gid: {
        type: Schema.Types.BigInt,
        required: true,
        unique: true
    },
    uid: {
        type: Schema.Types.BigInt,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    instructions: {
        type: String,
        default: null
    },
    min_offer_required: {
        type: Schema.Types.BigInt,
        default: null
    },
    countries: {
        type: String,
        default: null
    },
    background_img_url: {
        type: String,
        default: null
    },
    background_color: {
        type: String,
        default: null
    },
    overlay_color: {
        type: String,
        default: null
    },
    overlay_opacity: {
        type: Number,
        default: null
    },
    width: {
        type: Schema.Types.BigInt,
        default: null
    },
    height: {
        type: Schema.Types.BigInt,
        default: null
    },
    title_color: {
        type: String,
        default: null
    },
    title_size: {
        type: Number,
        default: null
    },
    title_font: {
        type: String,
        default: null
    },
    offer_color: {
        type: String,
        default: null
    },
    offer_size: {
        type: Number,
        default: null
    },
    offer_bold: {
        type: Number,
        default: null
    },
    offer_font: {
        type: String,
        default: null
    },
    instructions_color: {
        type: String,
        default: null
    },
    instructions_size: {
        type: Number,
        default: null
    },
    instructions_font: {
        type: String,
        default: null
    },
    border_color: {
        type: String,
        default: null
    },
    border_size: {
        type: Number,
        default: null
    },
    unlock_period: {
        type: Number,
        default: null
    },
    ip_lock: {
        type: Number,
        default: null
    },
    redirect_url: {
        type: String,
        default: null
    },
    start_delay: {
        type: Number,
        default: null
    },
    include_close: {
        type: Number,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    ip: {
        type: String,
        default: null
    },
    wid: {
        type: Schema.Types.BigInt,
        default: null
    },
    offers_show: {
        type: Schema.Types.BigInt,
        default: null
    },
    period_type: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Gateway = mongoose.model('gateways', GatewaySchema);

export default Gateway;
