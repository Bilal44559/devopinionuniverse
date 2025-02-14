import mongoose from 'mongoose';

const NewsSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        index: true,
        autoIncrement: true
    },
   
    title: {
        type: String,
        default: null
    },
    written_by: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    img: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const News = mongoose.model('news', NewsSchema);

export default News;
