import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AdminRolesSchema } from './adminRoles.model.js';

const adminSchema = new mongoose.Schema({
    admin_user: {
        type: String,
        maxlength: 50,
        required: true
    },
    admin_password: {
        type: String,
        required: true
    },
    active: {
        type: Number,
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    admin_role_id: [AdminRolesSchema]
});

// Pre-save hook to hash the password before saving
adminSchema.pre('save', async function(next) {
    if (!this.isModified('admin_password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.admin_password = await bcrypt.hash(this.admin_password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare the password for login
adminSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.admin_password);
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
