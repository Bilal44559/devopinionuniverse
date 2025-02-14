import mongoose from 'mongoose';
import Cashout from "../../models/cashouts.model.js";
import User from "../../models/user.model.js";
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import moment from 'moment';
import { fileURLToPath } from 'url';


export default {

    getAllPayment: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;

            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const user = await User.findOne({ _id: req.userId});
            if (!user) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const currency_type = user.currency_type;
            const currency = user.currency;

            // $PUBDSIGN = 'https://opinionuniverse.com/new_theme_assets/assets/signatures/'.$r -> signature_image;

            // $currency_icon = SITE_URL. 'new_theme_assets/currencies-icons/USD.png';

            const currencies = ['EUR', 'GBP', 'AUD', 'CAD', 'HKD', 'CHF', 'SGD', 'SAR', 'AED', 'JPY', 'SEK', 'NZD', 'DKK', 'THB', 'ZAR', 'INR'];
            let currency_value;
            if (currency === 'USD') {
                currency_value = 1;
            } else {
                currency_value = 0;
            }
            const cashout = await Cashout.find({ uid: req.userId }).skip((page - 1) * limit).limit(limit);
            const totalRecord = await Cashout.countDocuments({ uid: req.userId });
            const totalPages = Math.ceil(totalRecord / limit);
            const record = [];
            for (let row of cashout) {
                let id = row._id;
                let amount = row.amount;
                let status = row.status;
                let method = row.method;
                let priority = row.priority.replace('net', 'NET ');
                let date = new Date(row.request_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                // $paymentIds[] = $id;
                // $amounts[] = $amount;


                let feeDeductionPercentage = 0;

                if (amount < 1000) {
                    feeDeductionPercentage = 3; // 3 percent
                }
                if (amount >= 1000) {
                    feeDeductionPercentage = 2; // 2 percent
                }


                let feeDeductionAmount = (feeDeductionPercentage / 100) * amount;


                let subAmount = amount - feeDeductionAmount;

                record.push({
                    id,
                    date,
                    amount,
                    feeDeductionAmount,
                    method,
                    status,
                    cycle: priority
                });
            }

            msg = 'Get all payments successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalRecord,
                record
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getPdfFile: async (req, res) => {
        try {
            let msg;
            const { currencySymbol, cashoutId } = req.body;
            if (!cashoutId) {
                msg = 'cashoutId are required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const cashout = await Cashout.findOne({ _id: cashoutId });
            if (!cashout) {
                msg = 'Cashout record not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const { request_date, id: invoice_id, priority: payment_term, amount } = cashout;
            const user = await User.findOne({ _id: req.userId });
            if (!user) {
                msg = 'User record not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const company_name = user.company_name || `${user.firstname} ${user.lastname}`;
            const company_address = user.c_address || user.address;
            const sac_no = user.c_tax_number || 'NA';
            const payment_method = user.payment_method;
            const payment_method_details = user.payment_method_details;
            let due_date;
            switch (payment_term) {
                case 'net30':
                    due_date = moment(request_date).add(30, 'days').format('D-M-Y');
                    break;
                case 'net15':
                    due_date = moment(request_date).add(15, 'days').format('D-M-Y');
                    break;
                case 'weekly':
                    due_date = moment(request_date).add(7, 'days').format('D-M-Y');
                    break;
                default:
                    due_date = moment(request_date).add(30, 'days').format('D-M-Y');
                    break;
            }
            const feeDeductionPercentage = amount < 1000 ? 3 : 2;
            const feeDeductionAmount = (feeDeductionPercentage / 100) * amount;
            const subAmount = amount - feeDeductionAmount;
            const currency_value = currencySymbol === 'USD' ? 1 : 0;
            const amountWithUserCurrency = (amount * currency_value).toFixed(2);

            // Total Conversions
            // const [conversionRows] = await connection.promise().query(
            //     'SELECT COUNT(id) as total_conversions FROM offer_process WHERE uid = ? AND status = "1" AND DATE(date) >= ? AND DATE(date) <= ?',
            //     [req.userId, moment(request_date).startOf('month').format('YYYY-MM-DD'), moment(request_date).format('YYYY-MM-DD')]
            // );
            // const total_conversions = conversionRows[0].total_conversions;

            const doc = new PDFDocument();
            const fileName = `OpinionUniverse-statement-${cashoutId}.pdf`;
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filePath = path.join(__dirname, '..', '..', 'uploads', 'payment', fileName);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            doc.pipe(fs.createWriteStream(filePath));

            doc.fontSize(12).text('INVOICE', { align: 'center' });
            doc.text(`INVOICE NO: ${invoice_id}`);
            doc.text(`INVOICE DATE: ${moment(request_date).format('D-M-Y')}`);
            doc.text(`DUE ON: ${due_date}`);

            let paymentDetails = '';
            if (payment_method === 'Wire Transfer WW') {
                paymentDetails = `
                BANK ACCOUNT NUMBER: ${payment_method_details}
                ACCOUNT NAME: ${user.pm_bank_owner}
                BANK NAME: ${user.pm_bank_name}
                BANK ADDRESS: ${user.pm_bank_address}
                SWIFT CODE: ${user.pm_wire_swift_code}
                IBAN NO: ${user.pm_wire_iban_no}
                PAYMENT CYCLE: ${payment_term}
            `;
            } else if (payment_method === 'PayPal') {
                paymentDetails = `
                PAYPAL EMAIL: ${payment_method_details}
                PAYMENT CYCLE: ${payment_term}
            `;
            } else if (payment_method === 'Bank Transfer (Only India)') {
                paymentDetails = `
                BANK ACCOUNT NUMBER: ${payment_method_details}
                ACCOUNT NAME: ${user.pm_bank_owner}
                BANK NAME: ${user.pm_bank_name}
                BANK ADDRESS: ${user.pm_bank_address}
                BANK IFSC CODE: ${user.pm_bank_ifsc}
                PAYMENT CYCLE: ${payment_term}
            `;
            }
            doc.text(paymentDetails);
            // doc.text(`Total Conversions: ${total_conversions}`);
            doc.text(`Fee Deduction: ${feeDeductionAmount.toFixed(2)}`);
            doc.text(`Sub Amount: ${amountWithUserCurrency}`);
            doc.end();
            // res.download(fileName, () => fs.unlinkSync(fileName)); 
            const pdfUrl = `${req.protocol}://${req.get('host')}/uploads/payment/pdfs/${fileName}`;

            msg = 'PDF file generated successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, pdfUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }

    }

};