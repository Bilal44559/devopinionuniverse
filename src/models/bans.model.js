import mongoose from 'mongoose';


const BanSchema = new mongoose.Schema({

  uid: {
    type: String,
    default: null,
  },
    reason: {
      type: String,
      default: null
  },
  date: {
      type: Date,
      default: null
  },
  case: {
    type: String, 
    default: null
  },

}, {
  timestamps: true,
});



const Ban = mongoose.model('bans', BanSchema);

export default Ban;
