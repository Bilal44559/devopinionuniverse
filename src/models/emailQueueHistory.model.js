import mongoose from 'mongoose';

const EmailQueuesHistorySchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        index: true,
        autoIncrement: true
    },
    recipient: {
        type: String,
      
        default: null
    },
    subject: {
        type: String,
        default:null,
        
    },
    body: {
        type: String,
        default:null,
        
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending',
    
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields
});



const EmailQueuesHistory = mongoose.model('emailqueueshistory', EmailQueuesHistorySchema);

export default EmailQueuesHistory;
