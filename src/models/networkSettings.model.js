import mongoose from 'mongoose';

const NetworkSettingSchema = new mongoose.Schema({
    adscend_pub_id: {
        type: String,
        default: null
    },
    adscend_key: {
        type: String,
        default: null
    },
    adgate_url: {
        type: String,
        default: null
    },
    adwork_url: {
        type: String,
        default: null
    },
    cpalead_url: {
        type: String,
        default: null
    },
    cpagrip_url: {
        type: String,
        default: null
    },
    bluetrackmedia_url: {
        type: String,
        default: null
    },
    firalmedia_url: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const NetworkSetting = mongoose.model('networksettings', NetworkSettingSchema);

export default NetworkSetting;
