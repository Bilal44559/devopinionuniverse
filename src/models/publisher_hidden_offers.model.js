import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PublisherHiddenOffersSchema = new Schema({
    offerid: {
        type: String,
        default: null
    },
    uid: {
        type: String,
        default: null
    },

   
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const PublisherHiddenOffer = mongoose.model('publisherHiddenOffers', PublisherHiddenOffersSchema);

export default PublisherHiddenOffer;
