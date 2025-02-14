import mongoose from 'mongoose';


const CashoutLogSchema = new mongoose.Schema({
    uid: {
        type: String,
        default: null,
    },
    amount: {
        type: Number,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
}, {
  timestamps: true,
});

const CashoutLog = mongoose.model('cashoutlog', CashoutLogSchema);

export default CashoutLog;
