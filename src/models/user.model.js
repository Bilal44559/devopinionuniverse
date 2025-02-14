import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  uid: {
    type: Number,
    default: 0,
  },
  firstname: {
    type: String,
    maxlength: 100,
    default: null,
  },
  lastname: {
    type: String,
    maxlength: 100,
    default: null,
  },
  password: {
    type: String,
    required: true,
    maxlength: 100,
  },
  salt: {
    type: String,
    maxlength: 6,
    default: null,
  },
  email_address: {
    type: String,
    required: true,
    // maxlength: 50,
    // unique: true,
    // lowercase: true,
  },
  address: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    maxlength: 50,
    default: null,
  },
  state: {
    type: String,
    maxlength: 200,
    default: null,
  },
  zip: {
    type: String,
    maxlength: 20,
    default: null,
  },
  country: {
    type: String,
    maxlength: 100, 
    default: null,
  },
  phone: {
    type: String,
    maxlength: 100,
    default: null,
  },
  websites: {
    type: String,
    default: null,
  },
  gender: {
    type: String,
    default: null,
  },
  referrer_id: {
    type: Number,
    default: 0,
  },
  active: {
    type: Number,
    default: 0,
  },
  ip_address: {
    type: String,
    maxlength: 64,
    default: null,
  },
  date_registration: {
    type: Date,
    default: Date.now,
  },
  offer_rate: {
    type: Number,
    default: 0.00,
  },
  referral_rate: {
    type: Number,
    default: 0.00,
  },
  premium_rate: {
    type: Number,
    default: 0.00,
  },
  isBan: {
    type: Number,
    default: 0,
  },
  isLocked: {
    type: Number,
    default: 0,
  },
  l_hideuser: {
    type: Number,
    default: 0,
  },
  l_hideEarnings: {
    type: Number,
    default: 0,
  },
  balance: {
    type: Number,
    default: 0.0000,
  },
  promotional_methods: {
    type: String,
    maxlength: 255,
    default: null,
  },
  website: {
    type: String,
    maxlength: 255,
    default: null,
  },
  hearby: {
    type: String,
    maxlength: 255,
    default: null,
  },
  email_verified: {
    type: Number,
    default: 0,
  },
  payment_method: {
    type: String,
    maxlength: 30,
    default: null,
  },
  payment_cycle: {
    type: String,
    maxlength: 10,
    default: 'net30',
  },
  payment_method_details: {
    type: String,
    maxlength: 200,
    default: null,
  },
  pm_bank_owner: {
    type: String,
    maxlength: 200,
    default: null,
  },
  pm_bank_name: {
    type: String,
    maxlength: 200,
    default: null,
  },
  pm_bank_address: {
    type: String,
    maxlength: 400,
    default: null,
  },
  pm_bank_ifsc: {
    type: String,
    maxlength: 200,
    default: null,
  },
  pm_wire_swift_code: {
    type: String,
    maxlength: 255,
    default: null,
  },
  pm_wire_iban_no: {
    type: String,
    maxlength: 255,
    default: null,
  },
  offerwall_ratio: {
    type: Number,
    default: 1,
  },
  offerwall_currency: {
    type: String,
    maxlength: 15,
    default: null,
  },
  user_type: {
    type: String,
    maxlength: 500,
    default: 'Publisher',
  },
  logo: {
    type: String,
    maxlength: 255,
    default: 'opinionuniverse.png',
  },
  primary_color: {
    type: String,
    maxlength: 255,
    default: '#262a81',
  },
  secondary_color: {
    type: String,
    maxlength: 255,
    default: '#ff5300',
  },
  text_color: {
    type: String,
    maxlength: 255,
    default: '#ffffff',
  },
  offer_categories: {
    type: String,
    maxlength: 1000,
    default: 'All,Survey,Android,CPE',
  },
  offerwall_iframe_preview: {
    type: String,
    maxlength: 1000,
    default: null,
  },
  split_currency: {
    type: Number,
    default: 100,
  },
  currency_status: {
    type: Number,
    default: 1,
  },
  c_first_name: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_last_name: {
    type: String,
    maxlength: 255,
    default: null,
  },
  company_name: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_tax_number: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_country: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_state: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_city: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_address: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_zip: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_phone: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_skype: {
    type: String,
    maxlength: 255,
    default: null,
  },
  c_telegram: {
    type: String,
    maxlength: 255,
    default: null,
  },
  ads_credit: {
    type: Number,
    default: 0,
  },
  signature_image: {
    type: String,
    default: null,
  },
  account_type: {
    type: String,
    maxlength: 255,
    default: null,
  },
  registeration_number: {
    type: String,
    maxlength: 255,
    default: null,
  },
  registeration_step: {
    type: Number,
    default: 0,
  },
  user_designation: {
    type: String,
    maxlength: 255,
    default: null,
  },
  currency_type: {
    type: String,
    maxlength: 255,
    default: null,
  },
  currency: {
    type: String,
    maxlength: 255,
    default: null,
  },
  funds: {
    type: Number,
    default: 0,
  },
  tracking_link_bit: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
