import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ReadyDownloadsSchema = new Schema({
    hash: {
        type: String,
        default: null
    },
    file_id: {
        type: Schema.Types.BigInt,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    download_type: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const ReadyDownloads = mongoose.model('readydownload', ReadyDownloadsSchema);

export default ReadyDownloads;
