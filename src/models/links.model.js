import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const LinksSchema = new Schema({
    id: {
        type: Schema.Types.BigInt,
        required: true,
        unique: true
    },
    uid: {
        type: Schema.Types.BigInt,
        required: true
    },
    code: {
        type: String,
        default: null
    },
    hits: {
        type: Schema.Types.BigInt,
        default: 0
    },
    downloads: {
        type: Schema.Types.BigInt,
        default: 0
    },
    dateadded: {
        type: Date,
        default: null
    },
    last_download_date: {
        type: Date,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    url: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Links = mongoose.model('links', LinksSchema);

export default Links;
