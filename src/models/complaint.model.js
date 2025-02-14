import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ComplaintSchema = new Schema({
    complaint_name: { type: String, required: true },
    complaint_type: { type: String, required: true },
    complaint_email: { type: String, required: true },
    complaint_subject: { type: String, required: true },
    complaint_message: { type: String, required: true },
    complaint_file: { type: String },
    complaint_date: { type: Date, default: Date.now },
    pub_id: { type: String, required: true },
    sid: { type: String, required: true },
    app_id: { type: String, required: true }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Setting = mongoose.model('complaints', ComplaintSchema);


export default Setting;
