import mongoose from 'mongoose';

const cronjobHistorySchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        index: true,
        autoIncrement: true
    },
    file_name: {
        type: String,
        maxlength: 500,
        default: null
    },
    time: {
        type: String, // Store time as a string in HH:MM:SS format
        default: null
    },
    date: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields
});

const cronjobHistory = mongoose.model('cronjobhistory', cronjobHistorySchema);

export default cronjobHistory;
