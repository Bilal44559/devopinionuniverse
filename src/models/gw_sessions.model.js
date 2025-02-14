import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const GWSessionSchema = new Schema({
    uid: {
        type: Schema.Types.BigInt,
        default: null
    },
    gid: {
        type: Schema.Types.BigInt,
        default: null
    },
    session_id: {
        type: String,
        default: null
    },
    complete: {
        type: Number,
        default: 0
    },
    ip: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const GwSession = mongoose.model('gwSessions', GWSessionSchema);

export default GwSession;
