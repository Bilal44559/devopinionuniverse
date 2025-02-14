import mongoose from 'mongoose';


const BannedOfferSchema = new mongoose.Schema({
  camp_id: {
    type: String,
    default: null
},
network: {
    type: String,  // Use Number for double (floating-point) values
    default: null
},

date: {
    type: Date,
    default: null
},

}, {
  timestamps: true,
});



const BannedOffer = mongoose.model('bannedoffer', BannedOfferSchema);

export default BannedOffer;
