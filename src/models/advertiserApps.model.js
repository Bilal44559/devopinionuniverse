import mongoose from 'mongoose';


const AdvertiserAppsSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        maxlength: 1000, // Adjust as needed; text type in SQL can be long
        default: null
    },
    image: {
        type: String,
        maxlength: 1000, // Adjust as needed; text type in SQL can be long
        default: null
    },
    description: {
        type: String,
        maxlength: 1000, // Adjust as needed; text type in SQL can be long
        default: null
    },
    app_id: {
        type: String,
        maxlength: 255,
        default: null
    },
    url: {
        type: String,
        maxlength: 1000, // Adjust as needed; text type in SQL can be long
        default: null
    },
    store: {
        type: String,
        maxlength: 255,
        default: null
    },
    country_code: {
        type: String,
        maxlength: 255,
        default: null
    },
    language: {
        type: String,
        maxlength: 255,
        default: null
    },
    status: {
        type: Number,
        required: true,
        default: 1
    },
    uid: {
        type: Number,
        default: null
    },
    events: {
        type: String, // Use String for long text; MongoDB doesn't have a long text type like SQL
        default: null
    },
    attribution: {
        type: String,
        required: true,
        default: 'appsFlyer'
    },
    attribution_link: {
        type: String,
        maxlength: 1000, // Adjust as needed; text type in SQL can be long
        default: null
    },
    datetime: {
        type: Date,
        default: null
    }

}, {
    timestamps: true,
});



const AdvertiserApp = mongoose.model('advertiserapp', AdvertiserAppsSchema);

export default AdvertiserApp;
