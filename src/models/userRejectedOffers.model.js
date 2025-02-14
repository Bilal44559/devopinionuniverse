import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const UserRejectedOfferSchema = new Schema({
    id: {
        type: Schema.Types.BigInt,
        required: true,
        unique: true,
        index: true,
        autoIncrement: true
    },
    uid: {
        type: Schema.Types.BigInt,
        default: null
    },
    country_code: {
        type: String,
        default: null
    },
    campid: {
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

const UserRejectedOffer = mongoose.model('userRejectedOffer', UserRejectedOfferSchema);
export default UserRejectedOffer;
