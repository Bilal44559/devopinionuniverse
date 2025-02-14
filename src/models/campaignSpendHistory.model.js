import mongoose from 'mongoose';


const CampaignSpendHistorySchema = new mongoose.Schema({
    camp_id: {
        type: String,
        default: null
    },
    amount: {
        type: Number,
        default: null
    },
  uid: {
    type: String,
    default: null,
    index: true
},

datetime: {
    type: Date,
    default: null
},


}, {
  timestamps: true,
});



const CampaignSpendHistory = mongoose.model('campaignspendhistory', CampaignSpendHistorySchema);

export default CampaignSpendHistory;
