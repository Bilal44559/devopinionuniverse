import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const IsPbRecievedSchema = new Schema({
    id: {
        type: Schema.Types.BigInt,
        required: true,
        unique: true
    },
    network: {
        type: String,
        default: null
    },
    time: {
        type: Date,
        default: null
    },
 
  
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const IsPbRecieveds = mongoose.model('isPbRecieveds', IsPbRecievedSchema);

export default IsPbRecieveds;


