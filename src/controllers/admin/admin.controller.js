import mongoose from 'mongoose';
import express from "express";
import Adminpermissions from "../../models/adminpermissions.model.js";
import { makeApiResponse } from "../../lib/response.js";
import { StatusCodes } from "http-status-codes";
import adminService from '../../services/admin.service.js';
import Admin from "../../models/admin.model.js";
import { getEncryptedPassword } from '../../lib/utils.js';
import { parse } from "path";
import { getJWTToken } from '../../lib/utils.js';
import AdminRoles from "../../models/adminRoles.model.js";

export default {
    login: async (req, res) => {
        try {

            let msg;
            const { admin_user, admin_password } = req.body;
            // const { error, value } = adminService.validateLoginData(req.body);

            // if (error) {
            //     const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
            //     return res.status(StatusCodes.BAD_REQUEST).json(result);
            // }
            const adminUser = await Admin.findOne({ admin_user });

            if (!adminUser || !(await adminUser.comparePassword(admin_password))) {
                msg = 'Invalid usernam or password.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

                const token = await getJWTToken({ adminUser });
                msg = 'Admin login.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK,{adminUser, token});
                res.status(StatusCodes.OK).json(result);
            
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getProfile: async (req, res) => {
        try {
            let msg;
            const adminUser = await Admin.findOne({ _id : req.userId });
            if (!adminUser) {
                msg = 'Record not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'Admin Profile.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK,adminUser);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    createAdmin: async (req, res) => {
        try {
            let msg;
             const {
                admin_user,
                admin_password,
                admin_role_id
            } = req.body;
            const { error, value } = adminService.validateCreateAdminData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const role = await AdminRoles.findById(admin_role_id);
            if (!role) {
                msg = 'Invalid role ID.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingAdmin = await Admin.findOne({ admin_user });
        if (existingAdmin) {
                msg = 'Admin username already exists.';
                const result = makeApiResponse(msg, 0, StatusCodes.CONFLICT);
                return res.status(StatusCodes.CONFLICT).json(result);
        }
            const hashPassword = await getEncryptedPassword(admin_password);
            const newAdmin = new Admin({
                admin_user,
                admin_password: hashPassword,
                admin_role_id: [role],
                active: 1,
                date: new Date()
            });
            await newAdmin.save();
            msg = 'Admin created successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, newAdmin);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllAdmin: async (req, res) => {
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
            const allAdmins = await Admin.find().skip((page - 1) * limit).limit(limit);
            const totalAdmins = await Admin.countDocuments();
            const totalPages = Math.ceil(totalAdmins / limit);;
            msg = 'Get All Admins successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalAdmins,
                allAdmins
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updateAdmin: async (req, res) => {
        try {
            let msg;
            const { 
                adminId,
                admin_user,
                admin_role_id
            } = req.body;
            const { error, value } = adminService.validateUpdateAdminData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingAdmin = await Admin.findOne({ _id: adminId });
            if(!existingAdmin){
                msg = 'Admin not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (admin_role_id) {
                const role = await AdminRoles.findById(admin_role_id);
                if (!role) {
                    msg = 'Invalid role ID.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
                existingAdmin.admin_role_id = [role];
            }
            existingAdmin.admin_user = admin_user || existingAdmin.admin_user;
            await existingAdmin.save();
            msg = 'Admin update successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, { existingAdmin });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
           res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }    
    },

    changeAdminPassword: async ( req, res ) => {
        try {
            let msg;
            const { adminId, admin_password } = req.body;
            const { error, value } = adminService.validateChangeAdminPasswordData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingAdmin = await Admin.findOne({ _id: adminId });
            if(!existingAdmin){
                msg = 'Admin not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const hashPassword = await getEncryptedPassword(admin_password);
            existingAdmin.admin_password = hashPassword || existingAdmin.admin_password;
            await existingAdmin.save();
            msg = 'Admin password update successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, { existingAdmin });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    deleteAdmin: async ( req, res) => {
        try {
            let msg;
            const { adminId } = req.body;
            if(!adminId){
                msg = 'adminId is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingAdmin = await Admin.findOneAndDelete({ _id: adminId });
            if(!existingAdmin){
                msg = 'Admin not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'Admin deleted successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });      
        }
    },

    adminPermission: async (req, res) => {
        try {
            let msg;
            const permissions = [
                { permission_name: 'statistics_list', permission_route: 'manage_statistics' },
                { permission_name: 'admins_list', permission_route: 'manage_admins'},
                { permission_name: 'admin_create', permission_route: 'manage_admins'},
                { permission_name: 'admin_view', permission_route: 'manage_admins'},
                { permission_name: 'admin_update', permission_route: 'manage_admins'},
                { permission_name: 'admin_delete', permission_route: 'manage_admins'},
                { permission_name: 'roles_list', permission_route: 'manage_roles'},
                { permission_name: 'roles_create', permission_route: 'manage_roles'},
                { permission_name: 'roles_view', permission_route: 'manage_roles'},
                { permission_name: 'roles_update', permission_route: 'manage_roles'},
                { permission_name: 'roles_delete', permission_route: 'manage_roles'},
                { permission_name: 'campaign_list', permission_route: 'manage_campaigns'},
                { permission_name: 'campaign_edit', permission_route: 'manage_campaigns'},
                { permission_name: 'campaign_ban', permission_route: 'manage_campaigns'},
                { permission_name: 'affiliate_campaigns_list', permission_route: 'manage_affiliate_campaigns'},
                { permission_name: 'banned_offers_list', permission_route: 'manage_banned_offers'},
                { permission_name: 'ban_offer', permission_route: 'manage_banned_offers'},
                { permission_name: 'delete_banned_offers', permission_route: 'manage_banned_offers'},
                { permission_name: 'unban_offer', permission_route: 'manage_banned_offers'},
                { permission_name: 'affiliates_list', permission_route: 'manage_affiliates'},
                { permission_name: 'affiliates_view', permission_route: 'manage_affiliates'},
                { permission_name: 'affiliates_delete', permission_route: 'manage_affiliates'},
                { permission_name: 'affiliates_transactions', permission_route: 'manage_affiliates'},
                { permission_name: 'affiliates_ban', permission_route: 'manage_affiliates'},
                { permission_name: 'affiliates_access_account', permission_route: 'manage_affiliates'},
                { permission_name: 'affiliates_clicks_leads', permission_route: 'manage_affiliates'},
                { permission_name: 'change_settings_password', permission_route: 'manage_settings'},
                { permission_name: 'update_settings', permission_route: 'manage_settings'},
                { permission_name: 'process_paypal_masspay_payments', permission_route: 'manage_cashouts'},
                { permission_name: 'cashouts_view', permission_route: 'manage_cashouts'},
                { permission_name: 'cashouts_delete', permission_route: 'manage_cashouts'},
                { permission_name: 'complete_cashouts', permission_route: 'manage_cashouts'},
                { permission_name: 'news_list', permission_route: 'manage_news'},
                { permission_name: 'create_news', permission_route: 'manage_news'},
                { permission_name: 'create_network', permission_route: 'manage_networks'},
                { permission_name: 'offer_feed_settings', permission_route: 'manage_networks'},
                { permission_name: 'network_view', permission_route: 'manage_networks'},
                { permission_name: 'network_delete', permission_route: 'manage_networks'},
                { permission_name: 'messages_list', permission_route: 'manage_messages'},
                { permission_name: 'user_private_messages', permission_route: 'manage_messages'},
                { permission_name: 'send_message', permission_route: 'manage_messages'},
                { permission_name: 'send_message_to_all', permission_route: 'manage_messages'},
                { permission_name: 'reverse_leads', permission_route: 'manage_leads'},
                { permission_name: 'completed_leads', permission_route: 'manage_leads'},
                { permission_name: 'all_leads', permission_route: 'manage_leads'},
                { permission_name: 'approve_lead', permission_route: 'manage_leads'},
                { permission_name: 'postbacks_list', permission_route: 'manage_postbacks'},
                { permission_name: 'links_list', permission_route: 'manage_links'},
                { permission_name: 'gateways_list', permission_route: 'manage_gateways'},
                { permission_name: 'ips_list', permission_route: 'manage_ips'},
                { permission_name: 'add_iP_to_banList', permission_route: 'manage_ips'},
                { permission_name: 'supports_list', permission_route: 'manage_supports'},
                { permission_name: 'send_message', permission_route: 'manage_supports'},
                { permission_name: 'send_message_to_all', permission_route: 'manage_supports'},
                { permission_name: 'view_message', permission_route: 'manage_supports'},
                { permission_name: 'delete_message', permission_route: 'manage_supports'},
                { permission_name: 'deleted_offers_list', permission_route: 'manage_deleted_offers'},
                { permission_name: 'delete_deleted_offers', permission_route: 'manage_deleted_offers'},
                { permission_name: 'restore_deleted_offers', permission_route: 'manage_deleted_offers'},
                { permission_name: 'mass_delete_deleted_offers', permission_route: 'manage_deleted_offers'},
                { permission_name: 'download_excel_offers_list', permission_route: 'manage_download_excel_offers'},
                { permission_name: 'mass_download_excel_offers', permission_route: 'manage_download_excel_offers'},
                { permission_name: 'cap_limit_create', permission_route: 'manage_cap_limit'},
                { permission_name: 'cap_limit_update', permission_route: 'manage_cap_limit'},
                { permission_name: 'cap_limit_view', permission_route: 'manage_cap_limit'},
                { permission_name: 'cap_limit_delete', permission_route: 'manage_cap_limit'},
                { permission_name: 'category_limit_create', permission_route: 'manage_category_limit'},
                { permission_name: 'category_limit_view', permission_route: 'manage_category_limit'},
                { permission_name: 'category_limit_delete', permission_route: 'manage_category_limit' },
                { permission_name: 'publisher_tracking_link_blocked_create', permission_route: 'manage_publisher_tracking_link_blocked' },
                { permission_name: 'publisher_tracking_link_blocked_view', permission_route: 'manage_publisher_tracking_link_blocked'},
                { permission_name: 'publisher_tracking_link_blocked_delete', permission_route: 'manage_publisher_tracking_link_blocked'},
                { permission_name: 'overall_blocked_ip_create', permission_route: 'manage_overall_blocked_ip'},
                { permission_name: 'overall_blocked_ip_view', permission_route: 'manage_overall_blocked_ip'},
                { permission_name: 'overall_blocked_ip_delete', permission_route: 'manage_overall_blocked_ip'},
                { permission_name: 'vpn_setting_view', permission_route: 'manage_vpn_setting'},
                { permission_name: 'complain_section_create', permission_route: 'manage_complain_section'},
                { permission_name: 'complain_section_view', permission_route: 'manage_complain_section'},
                { permission_name: 'complain_section_delete', permission_route: 'manage_complain_section'},
            ];
            const adminPermissions = await Adminpermissions.insertMany(permissions);
            msg = 'Admin permissions save successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, adminPermissions);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

};