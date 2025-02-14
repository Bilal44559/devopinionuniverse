import mongoose from 'mongoose';


const ApiKeySchema = new mongoose.Schema({
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
apikey: {
    type: String,  // Use Number for double (floating-point) values
    default: null
},
status: {
    type: String,
    maxlength: 60,
    default: 'inactive'
},
requestBit: {
    type: String,
    maxlength: 60,
    default: 'pending'
},


}, {
  timestamps: true,
});



const ApiKey = mongoose.model('apikey', ApiKeySchema);

export default ApiKey;
