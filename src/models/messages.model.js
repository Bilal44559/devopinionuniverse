import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    msg_id: {
        type: Number,  // Mongoose does not support auto-increment natively; use a plugin if needed
        required: true,
        unique: true
    },
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: null
    },
    read: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Message = mongoose.model('messages', MessageSchema);

export default Message;
