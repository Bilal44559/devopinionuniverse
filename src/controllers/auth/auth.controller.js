
import User from '../../models/user.model.js';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import userService from "../../services/user.service.js";
import { checkValidEmail } from '../../lib/utils.js';
import { getEncryptedPassword } from '../../lib/utils.js';
import { getJWTToken } from '../../lib/utils.js';
import { verifyJWTToken } from '../../lib/utils.js';
import path from 'path';
import { sendEmail } from '../../lib/mail.js';
import NodeCache from 'node-cache';
import fs from 'fs';
import bcrypt from 'bcryptjs';


export const sendHtmlEmail = (emailAddress, agreementFilename) => {

    const filePath = path.join("", "", "src", "views", "emails", "email-template.html");

    fs.readFile(filePath, 'utf8', (err, htmlContent) => {
        if (err) {
            console.error('Error reading HTML file:', err);
            return;
        }

        const options = {
            email: emailAddress,
            subject: "Opinion Universe",
            html: htmlContent,
        };
        if (agreementFilename) {
            const attachmentPath = path.join("src", "uploads", "images", "userAgreement", agreementFilename);

            if (!fs.existsSync(attachmentPath)) {
                console.error('Attachment file does not exist:', attachmentPath);
                return;
            }

            options.attachments = [
                {
                    filename: agreementFilename,
                    path: attachmentPath
                }
            ];
        }

        sendEmail(options, function (error, info) {
            if (error) {
                console.log(error);
            }
            console.log("Email with attachment delivered successfully")
        });
    });
};


export default {


    login: async (req, res) => {

        try {

            let msg;
            const { email_address, password } = req.body;
            const { error, value } = userService.validateLoginData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const user = await User.findOne({ email_address });

            if (!user || !(await user.matchPassword(password))) {
                msg = 'Invalid email or password.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (user.email_verified === 0) {
                msg = 'Email is not verified';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            } else {
                const token = await getJWTToken({ user });
                const categories = ['Apps', 'Games', 'Mobile Games', 'Desktop Games', 'Survey', 'Signups', 'Shopping', 'Downloads', 'Credit Card', 'Free Trials', 'Deposits', 'Quizzes', 'Videos', 'Chrome Extenstion', 'Sweepstakes', 'CPA', 'CPI', 'CPV', 'CPE', 'Yuno', 'CCS', 'Home Services', 'Finance', 'Ecommerce', 'Subscription', 'Home Improvement', 'Medicare', 'Nutra', 'Dating', 'Auto Insurance', 'Antivirus', 'Casino', 'Gambling', 'Health', 'Adult', 'Gift Card', 'Leadgen', 'Debt'];
                const devices = ['Windows', 'Mac-OS', 'Android', 'iPhone', 'iPad'];
                msg = 'User login token.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK,{user, categories, devices, token});
                res.status(StatusCodes.OK).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    publisherSignupStepOne: async (req, res) => {
        try {

            let msg;

            const {
                account_type,
                registeration_number,
                company_name,
                password,
                firstname,
                lastname,
                currency_type,
                currency,
                password_confirm,
                email_address,
            } = req.body;

            const { error, value } = userService.validateSignupStepOneData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (password !== password_confirm) {
                msg = 'Password mismatched.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const isValid = await checkValidEmail(email_address);

            if (!isValid) {
                msg = 'Invalid email address.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const user = await User.findOne({ email_address });

            if (user) {
                if(user.email_address !== email_address){
                msg = 'Email address have not change.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
                const hashPassword = await getEncryptedPassword(password);
                const updateUser = new User({
                    password: hashPassword,
                    email_address:user.email_address,
                    firstname,
                    lastname,
                    account_type,
                    registeration_number,
                    company_name,
                    currency_type,
                    currency,
                });

                await updateUser.save();
                msg = 'User has been update successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, newUser);
                res.status(StatusCodes.OK).json(result);
            } else {
                const newUser = new User({
                    password,
                    email_address,
                    firstname,
                    lastname,
                    account_type,
                    registeration_number,
                    company_name,
                    currency_type,
                    currency,
                });

                await newUser.save();
                sendHtmlEmail(newUser.email_address);
                msg = 'User has been created successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, newUser);
                res.status(StatusCodes.OK).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    publisherSignupStepTwo: async (req, res) => {
        try {

            let msg;

            const {
                email_address,
                country,
                state,
                city,
                zip,
                address,
            } = req.body;

            const { error, value } = userService.validateSignupStepTwoData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const existingUser = await User.findOne({ email_address });

            if (!existingUser) {
                msg = 'Email address is not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            } 

            existingUser.country = country;
            existingUser.state = state;
            existingUser.city = city;
            existingUser.zip = zip;
            existingUser.address = address;
            await existingUser.save();
            msg = 'User record has been updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingUser);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    publisherSignupStepThree: async (req, res) => {
        try {

            let msg;

            const {
                email_address,
                website,
                hearby,
                promotional_methods,
                payment_cycle,
            } = req.body;

            const { error, value } = userService.validateSignupStepThreeData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const existingUser = await User.findOne({ email_address });

            if (!existingUser) {
                msg = 'Email address is not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);      
            } 

            existingUser.website = website;
            existingUser.hearby = hearby;
            existingUser.payment_cycle = payment_cycle;
            existingUser.promotional_methods = promotional_methods;
            await existingUser.save();
            msg = 'User record has been updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingUser);
            return res.status(StatusCodes.OK).json(result);   
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    publisherSignupStepFour: async (req, res) => {
        try {
            const emailCache = new NodeCache();
            let msg;
            const {
                email_address
            } = req.body;

            const agreementPath = req.file.filename;

            if (req.file == undefined) {
                agreementPath = '';
            }
          
            if (emailCache.has(email_address)) {
                const msg = 'Agreement email has already been sent.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const existingUser = await User.findOne({ email_address });

            if (!existingUser) {
                msg = 'Email address is not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            } 
              
            sendHtmlEmail(existingUser.email_address, agreementPath);
            emailCache.set(email_address, true);
            msg = 'Agreement send to your Email successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    publisherSignupStepFive: async (req, res) => {
        try {

            let msg;

            const {
                email_address,
                user_designation
            } = req.body;

            const { error, value } = userService.validateSignupStepfourData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const signatureImagePath = req.file.filename;

            if (req.file == undefined) {
                signatureImagePath = '';
            }

            const existingUser = await User.findOne({ email_address });

            if (!existingUser) {
                msg = 'Email address is not exist.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            } 

            existingUser.user_designation = user_designation;
            existingUser.signature_image = signatureImagePath;
            await existingUser.save();
            const name = existingUser.firstname + " " + existingUser.lastname;
            const token = await getJWTToken({ id: existingUser._id });
            const verificationUrl = `http://localhost:3000/auth/verify-email?email=${encodeURIComponent(email_address)}&token=${token}`;
            const filePath = path.join("", "", "src", "views", "emails", "verify-mail.html");

            fs.readFile(filePath, 'utf8', (err, htmlContent) => {
                if (err) {
                    console.error('Error reading HTML file:', err);
                    return;
                }              
                htmlContent = htmlContent.replace('{{name}}', name)
                    .replace('{{email}}', email_address)
                    .replace('{{token}}', token)
                    .replace('{{verificationUrl}}', verificationUrl);

                const options = {
                    email: email_address,
                    subject: 'Email Verification',
                    html: htmlContent,
                };

                sendEmail(options);
            });
            msg = 'User record has been updated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, existingUser);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    verifyEmail: async (req, res) => {
        try {
            let msg;
            const { email, token } = req.query;
    
            if (!email || !token) {
                msg = 'Email and token are required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const decoded = await verifyJWTToken(token);
    
            if (!decoded || !decoded.id) {
                msg = 'Invalid or expired token.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const user = await User.findOne({ email_address: email });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (user._id.toString() !== decoded.id.toString()) {
                msg = 'Token does not match user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            user.email_verified = 1;
            await user.save();
            msg = 'Email verified successfully.';
            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
            return res.status(StatusCodes.BAD_REQUEST).json(result);
        } catch (error) {
            console.error('Error verifying email:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    logout: async (req, res) => {
        try {
            let msg = 'User Logout';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            res.status(StatusCodes.OK).json(result);
        }
        catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getProfile: async (req, res) => {
        try {
            let msg;
            const user = await User.findOne({ _id : req.userId });
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'User Profile.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK,user);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

};

