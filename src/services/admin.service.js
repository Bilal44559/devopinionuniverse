import Joi from 'joi';

const createAdminSchema = Joi.object({
  admin_user: Joi.string().max(100).required(),
  admin_password: Joi.string().max(100).required(),
  admin_role_id: Joi.string().max(50).required(),
});

const updateAdminSchema = Joi.object({
  adminId: Joi.string().required(),
  admin_user: Joi.string().max(100).required(),
  admin_role_id: Joi.string().max(50).required(),
});

const updateChangeAdminPasswordSchema = Joi.object({
  adminId: Joi.string().required(),
  admin_password: Joi.string().max(100).required(),
});

const questionSchema = Joi.object({
    question: Joi.string().max(100).required(),
    options: Joi.string().max(100).required(),
    answer: Joi.string().max(50).required(),
  });

const updateQuestionSchema = Joi.object({
    questionId: Joi.string().required(),
    question: Joi.string().max(100).required(),
    options: Joi.string().max(100).required(),
    answer: Joi.string().max(50).required(),
  });

const updateQuestionStatusSchema = Joi.object({
    questionId: Joi.string().required(),
    status: Joi.number().required(),
  });

const createCategoryLimitSchema = Joi.object({
    email: Joi.string().required(),
    category: Joi.string().required(),
  });

const updateCategoryLimitSchema = Joi.object({
    categoryLimitId: Joi.string().required(),
    email: Joi.string().required(),
    category: Joi.string().required(),
    status: Joi.number().required(),
  });

const createCampaignSchema = Joi.object({
    offer_name: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    limit: Joi.number().allow(null, ''),
    countries: Joi.array().items(Joi.string()).allow(null, ''), // Changed to array
    status: Joi.number().allow(null, ''),
    ua_target: Joi.array().items(Joi.string()).allow(null, ''),
    categories: Joi.string().allow(null, ''),
    preview: Joi.string().allow(null, ''),
    preview_url: Joi.string().allow(null, ''),
    requirement: Joi.string().allow(null, ''),
    mobile: Joi.number().allow(null, ''),
    epc: Joi.number().allow(null, ''),
    hits: Joi.number().allow(null, ''),
    leads: Joi.number().allow(null, ''),
    campaign_id: Joi.number().required(),
    network: Joi.string().required(),
    payout: Joi.number().required(),
    link: Joi.string().required(),
  });

const updateCampaignSchema = Joi.object({
    offer_id: Joi.string().required(),
    offer_name: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    limit: Joi.number().allow(null, ''),
    countries: Joi.array().items(Joi.string()).allow(null, ''), // Changed to array
    status: Joi.number().allow(null, ''),
    ua_target: Joi.array().items(Joi.string()).allow(null, ''),
    categories: Joi.string().allow(null, ''),
    preview: Joi.string().allow(null, ''),
    preview_url: Joi.string().allow(null, ''),
    requirement: Joi.string().allow(null, ''),
    mobile: Joi.number().allow(null, ''),
    epc: Joi.number().allow(null, ''),
    hits: Joi.number().allow(null, ''),
    leads: Joi.number().allow(null, ''),
    campaign_id: Joi.number().required(),
    network: Joi.string().required(),
    payout: Joi.number().required(),
    link: Joi.string().allow(null, ''),
  });

  const addBannedOfferSchema = Joi.object({
    campaign_id: Joi.number().required(),
    network: Joi.string().required(),
  });

  const createNetworkSchema = Joi.object({
    name: Joi.string().required(),
    status: Joi.number().required(),
    param: Joi.string().allow(null, ''),
    complete: Joi.number().allow(null, ''),
    reversal: Joi.number().allow(null, ''),
    ips: Joi.string().allow(null, ''),
  });

  const updateNetworkSchema = Joi.object({
    networkId: Joi.string().required(),
    name: Joi.string().allow(null, ''),
    status: Joi.number().allow(null, ''),
    param: Joi.string().allow(null, ''),
    complete: Joi.number().allow(null, ''),
    reversal: Joi.number().allow(null, ''),
    ips: Joi.string().allow(null, ''),
  });

  const addNewsSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.string().allow(null, ''),
  });

  const createApiKeySchema = Joi.object({
    affiliate_name: Joi.string().required(),
    api_key: Joi.string().required(),
  });

  const updateApiKeySchema = Joi.object({
    api_key_id: Joi.string().required(),
    affiliate_name: Joi.string().allow(null, ''),
    api_key: Joi.string().allow(null, ''),
  });

  const updateAffiliateSchema = Joi.object({
    affiliate_id: Joi.string().required(),
    email_address: Joi.string().email().max(50).required(),
    fname: Joi.string().allow(null, ''),
    lname: Joi.string().allow(null, ''),
    status: Joi.number().allow(null, ''),
    country: Joi.string().required(),
    address: Joi.string().allow(null, ''),
    city: Joi.string().allow(null, ''),
    state: Joi.string().allow(null, ''),
    zip: Joi.string().allow(null, ''),
    website: Joi.string().allow(null, ''),
    hearby: Joi.string().allow(null, ''),
    payment_method: Joi.string().allow(null, ''),
    payment_cycle: Joi.string().allow(null, ''),
    payment_method_details: Joi.string().allow(null, ''),
    balance: Joi.string().allow(null, ''),
    pburl: Joi.string().allow(null, ''),
  });

  export default {

    validateCreateAdminData(data) {
        const { error, value } = createAdminSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateUpdateAdminData(data) {
        const { error, value } = updateAdminSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateChangeAdminPasswordData(data) {
        const { error, value } = updateChangeAdminPasswordSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateQuestionData(data) {
        const { error, value } = questionSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateUpdateQuestionData(data) {
        const { error, value } = updateQuestionSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateUpdateQuestionStatusData(data) {
        const { error, value } = updateQuestionStatusSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateCreateCategoryLimitData(data) {
        const { error, value } = createCategoryLimitSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateUpdateCategoryLimitData(data) {
        const { error, value } = updateCategoryLimitSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateCreateCampaignData(data) {
        const { error, value } = createCampaignSchema.validate(data, { abortEarly: false });
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

    validateAddBannedOfferData(data) {
        const { error, value } = addBannedOfferSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateCreateNetworkData(data) {
        const { error, value } = createNetworkSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateupdateNetworkData(data) {
        const { error, value } = updateNetworkSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateAddNewsData(data) {
        const { error, value } = addNewsSchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateCreateApiKeyData(data) {
        const { error, value } = createApiKeySchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },

    validateupdateApiKeyData(data) {
        const { error, value } = updateApiKeySchema.validate(data, { abortEarly: false });
        if (error) {
          throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
        }
        return value;
    },
    
  validateUpdateAffiliateData(data) {
    const { error, value } = updateAffiliateSchema.validate(data, { abortEarly: false });
    if (error) {
      throw new Error(`Validation Error: ${error.details.map(x => x.message).join(', ')}`);
    }
    return value;
},


  }