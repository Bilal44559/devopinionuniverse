
import mongoose from 'mongoose';


const adminEarningSchema = new mongoose.Schema({
    credits: {
        type: String,
        default: null
    },
    default_campaign_id: {
        type: Number,
        default: null
    },
    campaign_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    offer_data: {
        type: Object, // Store the offer data object directly here
        default: {
            campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
            default_campaign_id: null,
            campaign_name: null
        }
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
    offer_name: {
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
    date: {
        type: Date,
        default: null,
    },
    hash: {
        type: String,
        default: null
    },
    offer_id: {
        type: Number,
        default: null
    },
    country: {
        type: String,
        default: null
    }
});

const AdminEarnings = mongoose.model('adminearnings', adminEarningSchema);

export default AdminEarnings;
