import mongoose from 'mongoose';

const campaignProcessSchema = new mongoose.Schema({
    default_camp_id: {
        type: Number,
        default: null
    },
    camp_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    campaign_data: {
        type: Object, // Store the offer data object directly here
        default: {
            camp_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
            default_camp_id: null,
            camp_name: null
        }
    },
    title: {
        type: String, // Using String for long text
        default: null
    },
    description: {
        type: String, // Using String for long text
        default: null
    },
    ads_url: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },
    no_of_views: {
        type: Number,
        default: null
    },
    duration: {
        type: String,
        default: null
    },
    pid: {
        type: Number,
        default: null
    },
    publisher_data: {
        type: Object, // Store the publisher data object directly here
        default: {
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            pid: null
        }
    },
    status: {
        type: Number,
        default: null
    },
    datetime: {
        type: Date,
        default: null
    },
    completed_datetime: {
        type: Date,
        default: null
    },
    reversed_datetime: {
        type: Date,
        default: null
    },
    country: {
        type: String,
        default: null
    },
    payout: {
        type: Number,
        default: 0
    },
    per_click_value: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: null
    },
    views_amount: {
        type: Number,
        default: null
    },
    code: {
        type: String,
        default: null
    },
    sid: {
        type: String,
        default: null
    },
    sid2: {
        type: String,
        default: null
    },
    sid3: {
        type: String,
        default: null
    },
    sid4: {
        type: String,
        default: null
    },
    sid5: {
        type: String,
        default: null
    },
    ip: {
        type: String,
        default: null
    },
    source: {
        type: String,
        default: null
    },
    user_agent: {
        type: String, // Using String for long text
        default: null
    },
    default_app_id: {
        type: Number,
        default: null
    },
    app_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    app_data: {
        type: Object, // Store the app data object directly here
        default: {
            app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', default: null },
            default_app_id: null,
            app_name: null
        }
    },
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields
});

const CampaignProcess = mongoose.model('campaignProcess', campaignProcessSchema);

export default CampaignProcess;
