import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
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
    link_id: {
        type: String,  // Same note as above
        required: true
    },
    gw_id: {
        type: String,  // Same note as above
        required: true
    },
    referral_id: {
        type: String,  // Same note as above
        required: true
    },
    default_offer_id: {
        type: Number,
        default: null
    },
    offer_id: {
        type: mongoose.Schema.Types.ObjectId,
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
    offer_name: {
        type: String,
        default: null
    },
    credits: {
        type: Schema.Types.Decimal128,  // Use Decimal128 for decimal types
        default: 0.00
    },
    type: {
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
            network_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Network', default: null },
            default_network_id: null,
            network_name: null
        }
    },
    hash: {
        type: String,
        default: null
    },
    ip: {
        type: String,
        default: null
    },
    country: {
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

const Transaction = mongoose.model('transaction', TransactionSchema);
export default Transaction;

