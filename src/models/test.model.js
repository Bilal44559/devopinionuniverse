import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const TestSchema = new Schema({
    request: {
        type: Schema.Types.Mixed, // Can hold any data type, including objects and arrays
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Test = mongoose.model('test', TestSchema);
export default Test;
