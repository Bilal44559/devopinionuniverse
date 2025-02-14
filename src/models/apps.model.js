import mongoose from 'mongoose';

const appSchema = new mongoose.Schema({
    uid: {
        type: Number,
        default: null
    },
    publisher_data: {
        type: Object, // Store the publisher data object directly here
        default: {
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            uid: null
        }
    },
    app_name: {
        type: String,
        maxlength: 255,
        default: null
    },
    unique_id: {
        type: String,
        maxlength: 255,
        default: null
    },
    website_url: {
        type: String, // Using String for long text
        default: null
    },
    datetime: {
        type: Date,
        default: null
    },
    currency: {
        type: String,
        maxlength: 255,
        default: null
    },
    split_currency: {
        type: Number,
        default: null
    },
    ratio: {
        type: Number,
        default: null
    },
    logo: {
        type: String,
        maxlength: 255,
        default: null
    },
    categories: {
        type: String, // Using String for long text
        default: null
    },
    primary_clr: {
        type: String,
        maxlength: 255,
        default: null
    },
    secondary_clr: {
        type: String,
        maxlength: 255,
        default: null
    },
    text_clr: {
        type: String,
        maxlength: 255,
        default: null
    },
    api_key: {
        type: String,
        maxlength: 255,
        default: null
    },
    api_key_status: {
        type: Number,
        default: 0
    },
    postback_url: {
        type: String, // Using String for long text
        default: null
    },
    currency_status: {
        type: Number,
        required: true,
        default: 1
    },
    ip: {
        type: Number,
        required: true,
        default: 0
    },
    decimal_points: {
        type: Number,
        default: 2,
    },
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields
});

const App = mongoose.model('app', appSchema);

export default App;
