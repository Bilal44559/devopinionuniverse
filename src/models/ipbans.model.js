import mongoose from 'mongoose';

const ipbanSchema = new mongoose.Schema({
    ip: {
        type: String,
        default: null
    },
    scope: {
        type: String,
        maxlength: 100,
        default: null
    },
    

    date: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields
});

const Ipban = mongoose.model('ipban', ipbanSchema);

export default Ipban;
