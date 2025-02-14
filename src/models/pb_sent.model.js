import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PbsentSchema = new Schema({ 
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
    url: {
        type: String,
        default: null
    },
    status: {
        type: Number,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    pb_response: {
        type: String,
        default: null
    },
    offer_id: {
        type: String,
        default: null
    },
    payout: {
        type: Number,
        default: 0
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
    tid: {
        type: String,
        default: null
    },
    event_id: {
        type: String,
        default: null
    },
    event_name: {
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

const Pbsent = mongoose.model('pbsent', PbsentSchema);

export default Pbsent;
