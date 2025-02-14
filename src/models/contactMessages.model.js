import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
    contact_name: {
        type: String,
        maxlength: 255,
        default: null
    },
    contact_email: {
        type: String,
        maxlength: 255,
        default: null
    },
    contact_subject: {
        type: String,
        maxlength: 255,
        default: null
    },
    contact_message: {
        type: String,
        maxlength: 255,
        default: null
    },
    contact_date: {
        type: Date,
        default: null
    },
    reply: {
        type: Number,
        default: null
    },
    reply_id: {
        type: Number,
        default: null
    }
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields
});

const ContactMessage = mongoose.model('contactmessages', contactMessageSchema);

export default ContactMessage;
