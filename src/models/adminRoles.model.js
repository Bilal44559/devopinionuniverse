import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AdminPermissionsSchema } from './adminpermissions.model.js';

const AdminRolesSchema = new mongoose.Schema({
  name: {
    type: String,
    maxlength: 100,
  },
  permissions: [AdminPermissionsSchema]

}, {
  timestamps: true,
});



const AdminRoles = mongoose.model('adminroles', AdminRolesSchema);

export default AdminRoles;
export { AdminRolesSchema };
