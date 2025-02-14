import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const SettingsSchema = new Schema({
    option: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Setting = mongoose.model('settings', SettingsSchema);


export default Setting;
