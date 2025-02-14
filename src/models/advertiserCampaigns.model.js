import mongoose from 'mongoose';

const AdvertiserCampaignSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    advertiser_app_id: {
        type: Number,
        default: null
    },
    campaign_name: {
        type: String,
        maxlength: 255,
        default: null
    },
    start_date: {
        type: Date,
        default: null
    },
    end_date: {
        type: Date,
        default: null
    },
    daily_budget: {
        type: Number,
        default: 0
    },
    total_budget: {
        type: Number,
        default: 0
    },
    operation_system: {
        type: String,
        maxlength: 255,
        default: null
    },
    min_version: {
        type: Number,
        default: null
    },
    max_version: {
        type: Number,
        default: null
    },
    platforms: {
        type: String, 
        default: null
    },
    countries: {
        type: String, 
        default: null
    },
    paid_event_id: {
        type: String,
        maxlength: 255,
        default: null
    },
    event_paid_value: {
        type: String, 
        default: null
    },
    campaign_description: {
        type: String, 
        default: null
    },
    campaign_requirements: {
        type: String, 
        default: null
    },
    status: {
        type: Number,
        required: true,
        default: 0
    },
    uid: {
        type: Number,
        default: null
    },
    datetime: {
        type: Date,
        default: null
    }
}, {
    timestamps: true, 
});

const AdvertiserCampaign = mongoose.model('advertisercampaign', AdvertiserCampaignSchema);

export default AdvertiserCampaign;
