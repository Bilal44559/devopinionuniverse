import mongoose from 'mongoose';

const OfferProcessSchema = new mongoose.Schema({  
    default_offer_process_id: {
        type: Number,
        default: null
    },
    campaign_id: {
        type: String,
        // required: true
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
    offer_name: {
        type: String,
        default: null
    },
    offer_description: {
        type: String,
        default: null
    },
    offer_link: {
        type: String,
        default: null
    },
    offer_active: {
        type: Number,
        default: 1
    },
    credits: {
        type: Number,
        default: null
    }, 
    offer_hits: {
        type: Number,
        default: 0
    },
    offer_limit: {
        type: Number,
        default: 0
    },
    country: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    completed_date: {
        type: Date,
        default: null
    },
    reversed_date: {
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
            network_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Network', default: null },
            default_network_id: null,
            network_name: null
        }
    },
    offer_leads: {
        type: Number,
        default: null
    },
    offer_epc: {
        type: Number,
        default: null
    },
    offer_mobile: {
        type: Number,
        default: null
    },
    offer_category: {
        type: String,
        default: null
    },
    offer_cr: {
        type:Number,
        default: null
    },
    offer_views: {
        type: Number,
        default: 0
    },
    offer_conv: {
        type: Number,
        default: null
    },
    offer_browsers: {
        type: String,
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
    offer_preview: {
        type: String,
        default: null
    },
    offer_adgatemedia_events: {
        type: String,
        default: null
    },
    offer_requirements: {
        type: String,
        default: null
    },
    offer_image_url:{
        type: String,
        default: null
    },
    offer_preview_url: {
        type: String,
        default: null
    },
    code: {
        type: String,
        default: null
    },
    status: {
        type: Number,
        default: 0
    },
    ip: {
        type: String,
        required: true
    },
    ref_credits: {
        type: Number,
        default: null
    },
    link_id: {
        type: Number,
        default: null
    },
    gw_id: {
        type: Number,
        default: null
    },
    credit_mode: {
        type: String,
        default: null
    },
    source: {
        type: String,
        default: null
    },
    unique: {
        type: Number,
        default: 0
    },
    user_agent: {
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
    total_success_credit: {
        type: Number,
        default: 0
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
    offer_deleted_bit: {
        type: Number,
        default: 0
    },
    offer_ban_bit: {
        type: Number,
        default: 0
    },
    offer_instal_event_payout: {
        type: String,
        default: null
    },
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const OfferProcess = mongoose.model('offerprocess', OfferProcessSchema);

export default OfferProcess;
