import express from 'express';
import adminController from '../../controllers/admin/admin.controller.js';
import caplimitController from '../../controllers/admin/caplimit.controller.js';
import campaignsController from '../../controllers/admin/campaigns.controller.js';
import categoryLimitController from '../../controllers/admin/categoryLimit.controller.js';
import networkController from '../../controllers/admin/network.controller.js';
import publisherIpBlockController from '../../controllers/admin/publisherIpBlock.controller.js';
import overallBlockedIpController from '../../controllers/admin/overallBlockedIp.controller.js';
import upload from '../../lib/multer.js';
import newsControllers from '../../controllers/admin/news.controllers.js';
import apikeyController from '../../controllers/admin/apikey.controller.js';
import { verifyToken } from '../../middlewares/verify-token.js';
import complaintController from '../../controllers/admin/complaint.controller.js';
import postbackController from '../../controllers/admin/postback.controller.js';
import trackingLinkController from '../../controllers/admin/trackingLink.controller.js';
import leadController from '../../controllers/admin/lead.controller.js';
import adsLeadController from '../../controllers/admin/adsLead.controller.js';
import affiliateController from '../../controllers/admin/affiliate.controller.js';
import cashoutController from '../../controllers/admin/cashout.controller.js';
import dashboardController from '../../controllers/admin/dashboard.controller.js';
import roleController from '../../controllers/admin/role.controller.js';


export const adminRouter =  express.Router();

adminRouter.post('/login', adminController.login);
adminRouter.get('/profile', verifyToken, adminController.getProfile);
//admin permission
adminRouter.post('/adminPermission', adminController.adminPermission);
//cap limit
adminRouter.post('/createCapLimit', caplimitController.createCapLimit);
adminRouter.get('/getAllCapLimit', caplimitController.getAllCapLimit);
adminRouter.post('/updateCapLimit', caplimitController.updateCapLimit);
adminRouter.post('/deleteCapLimit', caplimitController.deleteCapLimit);
adminRouter.post('/searchCapLimit', caplimitController.searchCapLimit);
//category limit
adminRouter.post('/createCategoryLimit', categoryLimitController.createCategoryLimit);
adminRouter.get('/getAllCategoryLimit', categoryLimitController.getAllCategoryLimit);
adminRouter.post('/updateCategoryLimit', categoryLimitController.updateCategoryLimit);
adminRouter.post('/deleteCategoryLimit', categoryLimitController.deleteCategoryLimit);
adminRouter.post('/searchCategoryLimit', categoryLimitController.searchCategoryLimit);
//campaign
adminRouter.get('/getAllCampaign', campaignsController.getAllCampaigns);
adminRouter.post('/addCampaign', campaignsController.addCampaign);
adminRouter.post('/updateCampaign', campaignsController.updateCampaign);
adminRouter.post('/deleteCampaign', campaignsController.deleteCampaign);
//banned offer
adminRouter.get('/getAllBannedOffers', campaignsController.getAllBannedOffers);
adminRouter.post('/addBannedOffer', campaignsController.addBannedOffer);
adminRouter.post('/unBannedOffer', campaignsController.unBannedOffer);
adminRouter.post('/selectedBannedOfferDelete', campaignsController.selectedBannedOfferDelete);
//affiliate campaigns 
adminRouter.get('/getAllAffiliateCampaigns', campaignsController.getAllAffiliateCampaigns);
//delete offer
adminRouter.get('/getAllDeletedOffers', campaignsController.getAllDeletedOffers);
adminRouter.post('/updateDeletedOffer', campaignsController.updateDeletedOffer);
//network
adminRouter.get('/getAllNetworks', networkController.getAllNetworks);
adminRouter.post('/addNetwork', networkController.addNetwork);
adminRouter.post('/updateNetwork', networkController.updateNetwork);
adminRouter.post('/deleteNetwork', networkController.deleteNetwork);
adminRouter.post('/selectedNetworkDelete', networkController.selectedNetworkDelete);
//publisher-blocked-ip
adminRouter.get('/getAllPublisherBlockedIp', publisherIpBlockController.getAllPublisherBlockedIp);
adminRouter.post('/addPublisherBlockedIp', publisherIpBlockController.addPublisherBlockedIp);
adminRouter.post('/updatePublisherBlockedIp', publisherIpBlockController.updatePublisherBlockedIp);
adminRouter.post('/deletePublisherBlockedIp', publisherIpBlockController.deletePublisherBlockedIp);
adminRouter.post('/selectedPublisherBlockedIpDelete', publisherIpBlockController.selectedPublisherBlockedIpDelete);
//overall-blocked-ip
adminRouter.get('/getAllOverallBlockedIp', overallBlockedIpController.getAllOverallBlockedIp);
adminRouter.post('/addOverallBlockedIp', overallBlockedIpController.addOverallBlockedIp);
adminRouter.post('/uploadExcel', upload.single('file') ,overallBlockedIpController.uploadExcel);
adminRouter.post('/updateOverallBlockedIp', overallBlockedIpController.updateOverallBlockedIp);
adminRouter.post('/deleteOverallBlockedIp', overallBlockedIpController.deleteOverallBlockedIp);
adminRouter.post('/selectedOverallBlockedIpDelete', overallBlockedIpController.selectedOverallBlockedIpDelete);
//all-users-save-and-delete
adminRouter.get('/allUsersSaveAndDelete', overallBlockedIpController.allUsersSaveAndDelete);
adminRouter.get('/changeFileName', overallBlockedIpController.changeFileName);
adminRouter.get('/reversedOfferProcess', overallBlockedIpController.reversedOfferProcess);
//news
adminRouter.post('/addNews', upload.single('news_img'), newsControllers.addNews);
adminRouter.get('/getAllNews', newsControllers.getAllNews);
//api-key
adminRouter.post('/createApiKey', apikeyController.createApiKey);
adminRouter.get('/getApiKey', apikeyController.getApiKey);
adminRouter.get('/getSingleApiKey', apikeyController.getSingleApiKey);
adminRouter.post('/updateApiKey', apikeyController.updateApiKey);
adminRouter.post('/changeApiKeyStatus', apikeyController.changeApiKeyStatus);
adminRouter.post('/generateApiKey', apikeyController.generateApiKey);

//complaint section
adminRouter.get('/getComplaints', complaintController.getComplaints);
adminRouter.post('/getSingleComplaint', complaintController.getSingleComplaint);
// adminRouter.post('/searchComplaint', caplimitController.searchComplaint);

//postback section
adminRouter.get('/getPostbackList', postbackController.getPostbackList);
adminRouter.get('/getSinglePostbackDetail/:id', postbackController.getSinglePostbackDetail);
// adminRouter.post('/searchComplaint', postbackController.searchComplaint);

//Tracking Link Blocked section
adminRouter.get('/getAllTrackingLinks', trackingLinkController.getAllTrackingLinks);
// adminRouter.post('/addTrackingLink', trackingLinkController.addTrackingLink);
adminRouter.get('/updateTrackingLink/:id', trackingLinkController.updateTrackingLink);
adminRouter.get('/deleteTrackingLink/:id', trackingLinkController.deleteTrackingLink);
adminRouter.post('/selectedTrackingLinkDelete', trackingLinkController.selectedTrackingLinkDelete);

//Leads section
adminRouter.get('/getAllLeads', leadController.getAllLeads);
// adminRouter.post('/addTrackingLink', leadController.addTrackingLink);
adminRouter.get('/getCompleteLeads', leadController.getCompleteLeads);
adminRouter.get('/getReversedLeads', leadController.getReversedLeads);
adminRouter.get('/getSingleLeadDetail/:id', leadController.getSingleLeadDetail);
adminRouter.post('/reversedLead', leadController.reversedLead);
adminRouter.post('/selectedLeadsApprove', leadController.selectedLeadsApprove);
adminRouter.post('/selectedLeadReverse', leadController.selectedLeadReverse);
adminRouter.post('/searchLeads', leadController.searchLeads);

//Live Leads section
adminRouter.get('/getAllLiveLeads', leadController.getAllLiveLeads);

//Ads Leads section
adminRouter.get('/getAllAdsLeads', adsLeadController.getAllAdsLeads);
adminRouter.post('/deleteAdsLead', adsLeadController.deleteAdsLead);
adminRouter.post('/updateStatusAdsLead', adsLeadController.updateStatusAdsLead);
adminRouter.post('/detailAdsLeads', adsLeadController.detailAdsLeads);

//Affilates
adminRouter.get('/getAllaffiliate', affiliateController.affiliateView);
adminRouter.get('/getSingleAffiliate', affiliateController.getSingleAffiliate);
adminRouter.post('/updateAffiliate', affiliateController.updateAffiliate);
adminRouter.post('/deleteAffiliate', affiliateController.deleteAffiliate);
adminRouter.post('/updateIsBanAffiliate', affiliateController.updateIsBanAffiliate);
adminRouter.post('/updateIsLockedAffiliate', affiliateController.updateIsLockedAffiliate);
adminRouter.post('/selectedAffiliateDelete', affiliateController.selectedAffiliateDelete);
adminRouter.post('/searchAffiliate', affiliateController.searchAffiliate);

//Cashouts
adminRouter.get('/getAllCashout', cashoutController.getAllCashout);
adminRouter.get('/getSingleCashout', cashoutController.getSingleCashout);
adminRouter.post('/updateCashout', cashoutController.updateCashout);
adminRouter.post('/deleteCashout', cashoutController.deleteCashout);
adminRouter.post('/selectedCashoutDelete', cashoutController.selectedCashoutDelete);
adminRouter.post('/searchCashout', cashoutController.searchCashout);

//Roles
adminRouter.get('/getAllRoles', roleController.getAllRoles);
adminRouter.get('/getSingleRole', roleController.getSingleRole);
adminRouter.post('/createRole', roleController.createRole);
adminRouter.post('/updateRole', roleController.updateRole);
adminRouter.post('/deleteRole', roleController.deleteRole);

//Roles
adminRouter.get('/getAllAdmins', adminController.getAllAdmin);
// adminRouter.get('/getSingleRole', adminController.getSingleAdmin);
adminRouter.post('/createAdmin', adminController.createAdmin);
adminRouter.post('/updateAdmin', adminController.updateAdmin);
adminRouter.post('/deleteAdmin', adminController.deleteAdmin); 
adminRouter.post('/changeAdminPassword', adminController.changeAdminPassword);

//dasboard
adminRouter.get('/dashboard', dashboardController.dashboard);







