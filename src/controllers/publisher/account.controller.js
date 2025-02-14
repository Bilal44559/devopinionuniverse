
import User from '../../models/user.model.js';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import userService from "../../services/user.service.js";
import { checkValidEmail } from '../../lib/utils.js';
import { getEncryptedPassword } from '../../lib/utils.js';
import bcryptjs from 'bcryptjs';


export default {

    accountDetail: async (req, res) => {
        try {

            let msg;
            const existingUser = await User.findOne({ _id: req.userId });
            if (!existingUser) {
                msg = 'Email address does not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'User Account Detail fetch successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingUser);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    companyDetail: async (req, res) => {
        try {

            let msg;

            const {
                c_first_name,
                c_last_name,
                company_name,
                c_tax_number,
                c_country,
                c_state,
                c_city,
                c_zip,
                c_address,
                c_telegram,
                c_phone,
                c_skype,
                currency,
                currency_type,
            } = req.body;

            const { error, value } = userService.validateAccountCompanyDetailData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const existingUser = await User.findOne({ _id: req.userId });

            if (!existingUser) {
                msg = 'User does not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            existingUser.c_first_name = c_first_name;
            existingUser.c_last_name = c_last_name;
            existingUser.company_name = company_name;
            existingUser.c_tax_number = c_tax_number;
            existingUser.c_country = c_country;
            existingUser.c_state = c_state;
            existingUser.c_city = c_city;
            existingUser.c_zip = c_zip;
            existingUser.c_address = c_address;
            existingUser.c_telegram = c_telegram;
            existingUser.c_phone = c_phone;
            existingUser.c_skype = c_skype;
            existingUser.currency = currency;
            existingUser.currency_type = currency_type;

            await existingUser.save();
            msg = 'User record has been updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingUser);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    updatePassword: async (req, res) => {
        try {

            let msg;

            const {
                password,
                new_password,
                password_confirm
            } = req.body;

            const { error, value } = userService.validateUpdatePasswordData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (new_password !== password_confirm) {
                msg = 'Password mismatched.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const existingUser = await User.findOne({ _id: req.userId });

            if (!existingUser) {
                msg = 'User does not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const isPasswordMatch = await bcryptjs.compare(password, existingUser.password);

            if (!isPasswordMatch) {
                msg = 'Incorrect password';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const hashPassword = await getEncryptedPassword(new_password);
            existingUser.password = hashPassword;
            await existingUser.save();
            msg = 'User password updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    paymentDetail: async (req, res) => {
        try {

            let msg;

            const {
                payment_method,
                payment_cycle,
                payment_method_details,
                pm_bank_owner,
                pm_bank_name,
                pm_bank_address,
                pm_bank_ifsc,
                pm_wire_swift_code,
                pm_wire_iban_no
            } = req.body;

            const { error, value } = userService.validatePaymentDetailData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const existingUser = await User.findOne({ _id: req.userId });

            if (!existingUser) {
                msg = 'User does not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const isEmpty = (value) => !value || value.trim().length === 0;
            const isValid = await checkValidEmail(payment_method_details);

            if (payment_method !== "paypal" && payment_method !== "wire_transfer" && payment_method !== "bank_transfer") 
            {
                msg = 'Please enter your Payment Method Details.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (payment_method == "paypal") {

                if (isEmpty(payment_method_details) || !isValid)
                {
                    msg = 'Please enter correct PayPal Email.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }

                existingUser.payment_method = "PayPal";
                existingUser.payment_method_details = payment_method_details;
                existingUser.payment_cycle = payment_cycle;
                await existingUser.save();
                msg = 'Your Payment Method has been updated successfully!';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, existingUser);
                return res.status(StatusCodes.OK).json(result);
            }

            if (payment_method == "bank_transfer") {

                if (isEmpty(payment_method_details) || isEmpty(pm_bank_owner) || isEmpty(pm_bank_name) || isEmpty(pm_bank_address) || isEmpty(pm_bank_ifsc))
                {
                    msg = 'Please enter your Payment Method Details.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }

                existingUser.payment_method = "Bank Transfer (Only India)";
                existingUser.payment_method_details = payment_method_details;
                existingUser.pm_bank_owner = pm_bank_owner;
                existingUser.pm_bank_name = pm_bank_name;
                existingUser.pm_bank_address = pm_bank_address;
                existingUser.pm_bank_ifsc = pm_bank_ifsc;
                existingUser.payment_cycle = payment_cycle;
                await existingUser.save();
                msg = 'Your Payment Method has been updated successfully!';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, existingUser);
                return res.status(StatusCodes.OK).json(result);
            }

            if (payment_method == "wire_transfer") {

                if (isEmpty(payment_method_details) || isEmpty(pm_bank_owner) || isEmpty(pm_bank_name) || isEmpty(pm_bank_address) || isEmpty(pm_wire_swift_code) || isEmpty(pm_wire_iban_no)) 
                {
                    msg = 'Please enter your Payment Method Details.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }

                existingUser.payment_method = "Wire Transfer WW";
                existingUser.payment_method_details = payment_method_details;
                existingUser.pm_bank_owner = pm_bank_owner;
                existingUser.pm_bank_name = pm_bank_name;
                existingUser.pm_bank_address = pm_bank_address;
                existingUser.pm_wire_swift_code = pm_wire_swift_code;
                existingUser.pm_wire_iban_no = pm_wire_iban_no;
                existingUser.payment_cycle = payment_cycle;
                await existingUser.save();
                msg = 'Your Payment Method has been updated successfully!';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, existingUser);
                return res.status(StatusCodes.OK).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
};

