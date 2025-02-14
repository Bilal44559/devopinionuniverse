import mongoose from 'mongoose';

const cashoutSchema = new mongoose.Schema({
    uid: {
        type: String, // Using mongoose-long for BigInt support
       default: null
    },
    amount: {
        type: mongoose.Types.Decimal128,
        required: true
    },
    status: {
        type: String,
        maxlength: 20,
        default: 'Unpaid',
        index: true
    },
    method: {
        type: String,
        maxlength: 30,
        default: 'paypal'
    },
    user_notes: {
        type: String,
        default: null
    },
    pm_bank_owner: {
        type: String,
        maxlength: 200,
        default: null
    },
    pm_bank_name: {
        type: String,
        maxlength: 200,
        default: null
    },
    pm_bank_address: {
        type: String,
        maxlength: 400,
        default: null
    },
    pm_bank_ifsc: {
        type: String,
        maxlength: 200,
        default: null
    },
    admin_notes: {
        type: String,
        default: null
    },
    request_date: {
        type: Date,
        default: null
    },
    payment_date: {
        type: Date,
        default: null
    },
    email_address: {
        type: String,
        maxlength: 120,
        default: null
    },
    priority: {
        type: String,
        maxlength: 50,
        default: 'normal'
    },
    fee: {
        type: mongoose.Types.Decimal128,
        required: true,
        default: 0.00
    },
    type: {
        type: String,
        maxlength: 10,
        default: null
    },
    check_payto: {
        type: String,
        maxlength: 255,
        default: null
    },
    check_address: {
        type: String,
        default: null
    },
    check_address2: {
        type: String,
        default: null
    },
    check_country: {
        type: String,
        maxlength: 100,
        default: null
    },
    first_name: {
        type: String,
        maxlength: 255,
        default: null
    },
    last_name: {
        type: String,
        maxlength: 255,
        default: null
    },
    dd_address: {
        type: String,
        maxlength: 255,
        default: null
    },
    city: {
        type: String,
        maxlength: 255,
        default: null
    },
    state: {
        type: String,
        maxlength: 100,
        default: null
    },
    zip: {
        type: String,
        maxlength: 30,
        default: null
    },
    routing_number: {
        type: String,
        maxlength: 100,
        default: null
    },
    account_number: {
        type: String,
        maxlength: 100,
        default: null
    },
    bank_name: {
        type: String,
        maxlength: 255,
        default: null
    },
    bank_address: {
        type: String,
        maxlength: 255,
        default: null
    },
    bank_city: {
        type: String,
        maxlength: 255,
        default: null
    },
    bank_state: {
        type: String,
        maxlength: 50,
        default: null
    },
    bank_zip: {
        type: String,
        maxlength: 50,
        default: null
    },
    bank_country: {
        type: String,
        maxlength: 50,
        default: null
    },
    bank_routing: {
        type: String,
        maxlength: 50,
        default: null
    },
    bank_account_number: {
        type: String,
        maxlength: 50,
        default: null
    },
    benef_bank_name: {
        type: String,
        maxlength: 255,
        default: null
    },
    benef_bank_address: {
        type: String,
        maxlength: 255,
        default: null
    },
    benef_account_number: {
        type: String,
        maxlength: 50,
        default: null
    },
    benef_swift: {
        type: String,
        maxlength: 50,
        default: null
    },
    correspondent_bank: {
        type: String,
        maxlength: 255,
        default: null
    }
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields
});

const cashout = mongoose.model('cashout', cashoutSchema);

export default cashout;
