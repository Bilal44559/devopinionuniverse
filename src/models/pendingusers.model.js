import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PbSettingSchema = new Schema({

    email: {
        type: String,
        default: null
    },
    token: {
        type: String,
        default: null
    },

}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const PendingUsers = mongoose.model('pendingusers', PbSettingSchema);

export default PendingUsers;
