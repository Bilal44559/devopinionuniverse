import mongoose from 'mongoose';

const EmailQueuesSchema = new mongoose.Schema({
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



const EmailQueues = mongoose.model('emailqueues', EmailQueuesSchema);

export default EmailQueues;
