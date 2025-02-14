import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PbLogSchema = new Schema({
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
    default_camp_id: {
        type: String,
        default: null
    },
    camp_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    offer_data: {
        type: Object, // Store the offer data object directly here
        default: {
            camp_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
            default_camp_id: null,
            camp_name: null
        }
    },
    sid1: {
        type: String,
        default: null
    },
    sid2: {
        type: String,
        default: null
    },
    status: {
        type: Number,
        default: null
    },
    ip: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    request_uri: {
        type: String,
        default: null
    },
    type: {
        type: String,
        default: null
    },
    user_payout: {
        type: Number,
        default: 0
    },
    pub_payout: {
        type: Number,
        default: 0
    },
    response: {
        type: String,
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
    timestamps: true // Adds createdAt and updatedAt fields
});

const PbLog = mongoose.model('pbLog', PbLogSchema);

export default PbLog;
