import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminRolePermissionScheam = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  admin_permission_id: {
    type: Number,
    maxlength: 100,

    index: true
  },
  admin_role_id: {
    type: Number,
    maxlength: 100,

    index: true
  },


}, {
  timestamps: true,
});



const AdminRolePermissions = mongoose.model('adminpermissionroles', AdminRolePermissionScheam);

export default AdminRolePermissions;
