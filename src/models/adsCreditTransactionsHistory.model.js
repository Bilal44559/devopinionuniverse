import mongoose from 'mongoose';


const AdsCreditTransactionsHistorySchema = new mongoose.Schema({
  
    uid: {
        type: String,
        index: true
    },
    response: {
        type: String,
        maxlength: 100,
        default: null
    },
    datetime: {
        type: Date,
        default: null
    },
    type: {
        type: String,
        maxlength: 100,
        default: null
    },
    amount: {
        type: Number,  // Use Number for double (floating-point) values
        default: null
    },

}, {
    timestamps: true,
});



const AdsCreditTransactionsHistory = mongoose.model('adscredittransactionsHistory', AdsCreditTransactionsHistorySchema);

export default AdsCreditTransactionsHistory;
