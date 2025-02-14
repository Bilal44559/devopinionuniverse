import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminPermissionsSchema = new mongoose.Schema({
  permission_name: { type: String, required: true },
  permission_route: { type: String, required: true },
}, {
  timestamps: true,
});



const Adminpermissions = mongoose.model('adminpermissions', AdminPermissionsSchema);

export default Adminpermissions;
export { AdminPermissionsSchema };
