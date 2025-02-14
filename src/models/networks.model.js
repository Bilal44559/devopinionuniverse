import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const NetworkSchema = new Schema({
    default_network_id: {
        type: Number,
        default: 0,
    },
    name: {
        type: String,
        required: true
    },
    active: {
        type: Number,
        default: 1
    },
    parameter: {
        type: String,
        default: null
    },
    ips: {
        type: String,
        default: null
    },
    complete: {
        type: Number,
        default: 1
    },
    reversal: {
        type: Number,
        default: null
    }
}, {
    timestamps: true ,
});

const Network = mongoose.model('network', NetworkSchema);

export default Network;
