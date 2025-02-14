import mongoose from 'mongoose';


const AdvertiserFundsHistorySchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  uid: {
    type: Number,
    index: true,
    default: null
},
amount: {
    type: Number,  // Use Number for double (floating-point) values
    default: null
},
type: {
    type: String,
    maxlength: 100,
    default: null
},
datetime: {
    type: Date,
    default: null
},

}, {
  timestamps: true,
});



const AdvertiserFundsHistory = mongoose.model('advertiserfundshistory', AdvertiserFundsHistorySchema);

export default AdvertiserFundsHistory;
