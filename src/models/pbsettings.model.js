import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PbSettingSchema = new Schema({
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
    pb_type: {
        type: String,
        enum: ['global', 'campaign'],
        default: null
    },
    url: {
        type: String,
        default: null
    },
    check_ip: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const PbSettings = mongoose.model('pbSettings', PbSettingSchema);

export default PbSettings;
