import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
    default_campaign_id: {
        type: Number,
        default: null
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
        maxlength: 255,
        default: null
    },
    image: {
        type: String,
        maxlength: 255,
        default: null
    },
    no_of_views: {
        type: Number,
        default: null
    },
    duration: {
        type: String,
        maxlength: 255,
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
        default: 1
    },
    datetime: {
        type: Date,
        default: null
    },
    country: {
        type: String,
        maxlength: 255,
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
        default: 0
    },
    views_amount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields
});

const Campaign = mongoose.model('campaigns', campaignSchema);

export default Campaign;
