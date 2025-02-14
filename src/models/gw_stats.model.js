import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const CreditsSchema = new Schema({
    gid: {
        type: Schema.Types.BigInt,
        default: null
    },
    offer_camp_id: {
        type: String,
        default: null
    },
    credits: {
        type: Schema.Types.Decimal128,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    hash: {
        type: String,
        default: null
    },
    network: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const GwStats = mongoose.model('gwstats', CreditsSchema);

export default GwStats;
