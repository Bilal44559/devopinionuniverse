import { makeApiResponse } from "../../lib/response.js";
import { StatusCodes } from "http-status-codes";
import Adminpermissions from "../../models/adminpermissions.model.js";
import AdminRoles from "../../models/adminRoles.model.js";

export default {

    createRole: async (req, res) => {
        try {
            let msg;
            const { name, permissionIds } = req.body;
            if (!name || !permissionIds || !Array.isArray(permissionIds)) {
                msg = 'All fields are required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const permissions = await Adminpermissions.find({ _id: { $in: permissionIds } });
            if (permissions.length !== permissionIds.length) {
                msg = 'Some permissions are invalid.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
        
            const newRole = new AdminRoles({
                name,
                permissions,
            });
            await newRole.save();
    
            msg = 'Role created successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newRole);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
          console.error(error);
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    
    updateRole: async (req, res) => {
        try {
            let msg;
            const { roleId, name, permissionIds } = req.body;
            
            if (!roleId) {
                msg = 'role ID is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
    
            if (!name || !permissionIds || !Array.isArray(permissionIds)) {
                msg = 'All fields are required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        
            const permissions = await Adminpermissions.find({ _id: { $in: permissionIds } });
            if (permissions.length !== permissionIds.length) {
                msg = 'Some permissions are invalid.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
        
            const updatedRole = await AdminRoles.findByIdAndUpdate(
                roleId,
                { name, permissions },
                { new: true }
            );
        
            if (!updatedRole) {
                msg = 'Role not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        
            msg = 'Role updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, updatedRole);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    
    deleteRole: async (req, res) => {
        try {
            let msg;
            const { roleId } = req.body;
            if (!roleId) {
                msg = 'role ID is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
    
          const deletedRole = await AdminRoles.findByIdAndDelete(roleId);
    
            if (!deletedRole) {
                msg = 'Role not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        
            msg = 'Role deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    
    getAllRoles: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            if(page < 1 || limit < 1){
                msg = 'page and limit must be positive integers.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const allRoles = await AdminRoles.find().populate('permissions').skip((page - 1) * limit).limit(limit);
            const totalRoles = await AdminRoles.countDocuments();
            const totalPages = Math.ceil(totalRoles / limit);;
            msg = 'Get All Roles successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalRoles,
                allRoles
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    getSingleRole: async (req, res) => {
        try {
            let msg;
            const { roleId } = req.body;
            if (!roleId) {
                msg = 'role ID is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
            const role = await AdminRoles.findById(roleId).populate('permissions');
        
            if (!role) {
                msg = 'Role not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        
            msg = 'Get single role successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, role);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
};