import Joi from 'joi';

// Define the schema for user signup
const signupSchema = Joi.object({
  firstname: Joi.string().max(100).required(),
  lastname: Joi.string().max(100).required(),
  email_address: Joi.string().email().max(50).required(),
  password: Joi.string().min(8).max(42).required(),
  salt: Joi.string().max(6).required(),
  address: Joi.string().allow(null, ''),
  city: Joi.string().allow(null, ''),
  state: Joi.string().allow(null, ''),
  zip: Joi.string().allow(null, ''),
  country: Joi.string().allow(null, ''),
  phone: Joi.string().allow(null, ''),  // Changed to string to match mongoose schema
  websites: Joi.string().allow(null, ''),
  gender: Joi.string().valid('Male', 'Female', 'Other').allow(null, ''),
  referrer_id: Joi.string().hex().length(24).allow(null, ''), // ObjectId
  active: Joi.number().valid(0, 1).required(),
  ip_address: Joi.string().ip().required(),
  date_registration: Joi.date().iso().required(),
  offer_rate: Joi.number().min(0).allow(null, ''),
  referral_rate: Joi.number().min(0).allow(null, ''),
  premium_rate: Joi.number().min(0).allow(null, ''),
  isBan: Joi.number().valid(0, 1).allow(null, ''),
  isLocked: Joi.number().valid(0, 1).allow(null, ''),
  l_hideuser: Joi.number().valid(0, 1).allow(null, ''),
  l_hideEarnings: Joi.number().valid(0, 1).allow(null, ''),
  balance: Joi.number().min(0).allow(null, ''),
  promotional_methods: Joi.string().allow(null, ''),
  website: Joi.string().allow(null, ''),
  hearby: Joi.string().allow(null, ''),
  email_verified: Joi.number().valid(0, 1).allow(null, ''),
  payment_method: Joi.string().allow(null, ''),
  payment_cycle: Joi.string().allow(null, ''),
  payment_method_details: Joi.string().allow(null, ''),
  pm_bank_owner: Joi.string().allow(null, ''),
  pm_bank_name: Joi.string().allow(null, ''),
  pm_bank_address: Joi.string().allow(null, ''),
  pm_bank_ifsc: Joi.string().allow(null, ''),
  pm_wire_swift_code: Joi.string().allow(null, ''),
  pm_wire_iban_no: Joi.string().allow(null, ''),
  offerwall_ratio: Joi.number().default(1),
  offerwall_currency: Joi.string().allow(null, ''),
  user_type: Joi.string().allow(null, ''),
  logo: Joi.string().allow(null, ''),
  primary_color: Joi.string().allow(null, ''),
  secondary_color: Joi.string().allow(null, ''),
  text_color: Joi.string().allow(null, ''),
  offer_categories: Joi.string().allow(null, ''),
  offerwall_iframe_preview: Joi.string().allow(null, ''),
  split_currency: Joi.number().min(1).required(),
  currency_status: Joi.number().valid(0, 1).allow(null, ''),
  c_first_name: Joi.string().allow(null, ''),
  c_last_name: Joi.string().allow(null, ''),
  company_name: Joi.string().allow(null, ''),
  c_tax_number: Joi.string().allow(null, ''),
  c_country: Joi.string().allow(null, ''),
  c_city: Joi.string().allow(null, ''),
  c_address: Joi.string().allow(null, ''),
  c_zip: Joi.string().allow(null, ''),
  c_phone: Joi.string().allow(null, ''),
  c_skype: Joi.string().allow(null, ''),
  c_telegram: Joi.string().allow(null, ''),
  ads_credit: Joi.number().min(0).allow(null, ''),
  signature_image: Joi.string().allow(null, ''),
  account_type: Joi.string().allow(null, ''),
  registeration_number: Joi.string().allow(null, ''),
  registeration_step: Joi.number().allow(null, ''),
  user_designation: Joi.string().allow(null, ''),
  currency_type: Joi.string().allow(null, ''),
  currency: Joi.string().allow(null, ''),
  funds: Joi.number().min(0).required()
});

const LoginSchema = Joi.object({
  email_address: Joi.string().max(50).required(),
  password: Joi.string().min(8).max(42).required(),
});

const signupStepOneSchema = Joi.object({
  firstname: Joi.string().max(100).required(),
  lastname: Joi.string().max(100).required(),
  email_address: Joi.string().max(50).required(),
  password: Joi.string().min(8).max(42).required(),
  password_confirm: Joi.string().min(8).max(42).required(),
  account_type: Joi.string().allow(null, ''),
  registeration_number: Joi.string().allow(null, ''),
  currency_type: Joi.string().allow(null, ''),
  currency: Joi.string().allow(null, ''),
  company_name: Joi.string().allow(null, ''),
});

const signupStepTwoSchema = Joi.object({
  email_address: Joi.string().max(50).required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip: Joi.string().required(),
  country: Joi.string().required(),
});

const signupStepThreeSchema = Joi.object({
  email_address: Joi.string().max(50).required(),
  website: Joi.string().required(),
  hearby: Joi.string().required(),
  payment_cycle: Joi.string().required(),
  promotional_methods: Joi.string().required(),
});

const signupStepFourSchema = Joi.object({
  email_address: Joi.string().max(50).required(),
  signature_image: Joi.string().allow(null, ''), 
  user_designation: Joi.string().required(),
});

const CompanyDetailSchema = Joi.object({
  c_first_name: Joi.string().allow(null, ''),
  c_last_name: Joi.string().allow(null, ''),
  company_name: Joi.string().allow(null, ''),
  c_tax_number: Joi.string().allow(null, ''),
  c_country: Joi.string().allow(null, ''),
  c_state: Joi.string().allow(null, ''),
  c_city: Joi.string().allow(null, ''),
  c_address: Joi.string().allow(null, ''),
  c_zip: Joi.string().allow(null, ''),
  c_phone: Joi.string().allow(null, ''),
  c_skype: Joi.string().allow(null, ''),
  c_telegram: Joi.string().allow(null, ''),
  currency_type: Joi.string().allow(null, ''),
  currency: Joi.string().allow(null, ''),
});

const AccountDetailSchema = Joi.object({
  email_address: Joi.string().max(50).required(),
  // firstname: Joi.string().max(100).required(),
  // lastname: Joi.string().max(100).required(),
  // address: Joi.string().required(),
  // city: Joi.string().required(),
  // state: Joi.string().required(),
  // zip: Joi.string().required(),
  // country: Joi.string().required(),
  // website: Joi.string().required(),
  // hearby: Joi.string().required(),
  // promotional_methods: Joi.string().required(),
});

const UpdatePasswordSchema = Joi.object({
  password: Joi.string().min(8).max(42).required(),
  new_password: Joi.string().min(8).max(42).required(),
  password_confirm: Joi.string().min(8).max(42).required(),
});

const PaymentDetailSchema = Joi.object({
  payment_method: Joi.string().required(),
  payment_cycle: Joi.string().required(),
  payment_method_details: Joi.string().required(),
  pm_bank_owner: Joi.string().allow(null, ''),
  pm_bank_name: Joi.string().allow(null, ''),
  pm_bank_address: Joi.string().allow(null, ''),
  pm_bank_ifsc: Joi.string().allow(null, ''),
  pm_wire_swift_code: Joi.string().allow(null, ''),
  pm_wire_iban_no: Joi.string().allow(null, ''),
});

const updateCampaignSchema = Joi.object({
  campaignId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  ads_url: Joi.string().required(),
  image: Joi.string().allow(null, ''),
  no_of_views: Joi.number().min(0).required(),
  duration: Joi.string().required(),
  datetime:Joi.date().iso().allow(null, ''),
});

const addCampaignSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  ads_url: Joi.string().required(),
  image: Joi.string().allow(null, ''),
  no_of_views: Joi.number().min(0).required(),
  duration: Joi.string().required(),
  datetime:Joi.date().iso().allow(null, ''),
});

const deleteCampaignSchema = Joi.object({
  campaignId: Joi.string().required()
});

const appPlacementSchema = Joi.object({
  app_name: Joi.string().required(),
  website_url: Joi.string().required(),
});

const updateAppPlacementSchema = Joi.object({
  appId: Joi.string().required(),
  app_name: Joi.string().required(),
  website_url: Joi.string().required(),
});

const deleteAppPlacementSchema = Joi.object({
  appId: Joi.string().required()
});

const generalSettingAppSchema = Joi.object({
  appId: Joi.string().required(),
  website_url: Joi.string().required(),
});

const currencySettingAppSchema = Joi.object({
  appId: Joi.string().required(),
  currency: Joi.string().required(),
  split_currency: Joi.number().required(),
  ratio: Joi.number().required(),
});

const designSettingAppSchema = Joi.object({
  appId: Joi.string().required(),
  logo: Joi.string().allow(null, ''),
  categories: Joi.string().required(),
  primary_clr: Joi.string().required(),
  secondary_clr: Joi.string().required(),
  text_clr: Joi.string().required(),
});

const apiKeySettingAppSchema = Joi.object({
  appId: Joi.string().required(),
  api_key_status: Joi.number().allow(null,''),
});

const offerWallSchema = Joi.object({
  offerwall_ratio: Joi.string().required(),
  offerwall_currency: Joi.string().required(),
  primary_color: Joi.string().required(),
  secondary_color: Joi.string().required(),
  text_color: Joi.string().required(),
  offer_categories: Joi.string().required(),
  split_currency: Joi.number().required(),
  currency_status: Joi.number().required(),
  offerwall_logo: Joi.string().allow(null, ''),
});

const contactSchema = Joi.object({
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  email: Joi.string().max(50).required(),
  subject: Joi.string().required(),
  message: Joi.string().required(),
});

export default  {

    validateSignupData(data) {
        const { error, value } = signupSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateLoginData(data) {
        const { error, value } = LoginSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateSignupStepOneData(data) {
        const { error, value } = signupStepOneSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateSignupStepTwoData(data) {
        const { error, value } = signupStepTwoSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateSignupStepThreeData(data) {
        const { error, value } = signupStepThreeSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateSignupStepfourData(data) {
        const { error, value } = signupStepFourSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateAccountCompanyDetailData(data) {
        const { error, value } = CompanyDetailSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateAccountDetailData(data) {
        const { error, value } = AccountDetailSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateUpdatePasswordData(data) {
        const { error, value } = UpdatePasswordSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validatePaymentDetailData(data) {
        const { error, value } = PaymentDetailSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateCampaignData(data) {
        const { error, value } = addCampaignSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },
      
      validateUpdateCampaignData(data) {
        const { error, value } = updateCampaignSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },
      
      validateDeleteCampaignData(data) {
        const { error, value } = deleteCampaignSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateAppPlacementData(data) {
        const { error, value } = appPlacementSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateUpdateAppPlacementData(data) {
        const { error, value } = updateAppPlacementSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateDeleteAppData(data) {
        const { error, value } = deleteAppPlacementSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateGeneralSettingAppData(data) {
        const { error, value } = generalSettingAppSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateCurrencySettingAppData(data) {
        const { error, value } = currencySettingAppSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },
      
      validatedesignSettingAppData(data) {
        const { error, value } = designSettingAppSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },
      
      validateApiKeySettingAppData(data) {
        const { error, value } = apiKeySettingAppSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateOfferWallData(data) {
        const { error, value } = offerWallSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },

      validateContactData(data) {
        const { error, value } = contactSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
      },
      

};