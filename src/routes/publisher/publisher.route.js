import express from 'express';
import publisherController from '../../controllers/publisher/publisher.controller.js';
import accountController from '../../controllers/publisher/account.controller.js';
import { verifyToken } from '../../middlewares/verify-token.js';
import campaignController from '../../controllers/publisher/campaign.controller.js';
import upload from '../../lib/multer.js';
import placementController from '../../controllers/publisher/placement.controller.js';
import postbackController from '../../controllers/publisher/postback.controller.js';
import offerwallController from '../../controllers/publisher/offerwall.controller.js';
import reportsController from '../../controllers/publisher/reports.controller.js';
import paymentController from '../../controllers/publisher/payment.controller.js';
import dashboardController from '../../controllers/publisher/dashboard.controller.js';

export const publisherRouter =  express.Router();
// Dashboard
publisherRouter.post('/dashboard', verifyToken,  dashboardController.dashboard);
// Account Setting
publisherRouter.get('/account-detail', verifyToken,  accountController.accountDetail);
publisherRouter.post('/company-detail', verifyToken,  accountController.companyDetail);
publisherRouter.post('/update-password', verifyToken, accountController.updatePassword);
publisherRouter.post('/payment-detail', verifyToken,  accountController.paymentDetail);
// Offers
publisherRouter.post('/getAllOffers', verifyToken, publisherController.getAllOffers);
publisherRouter.post('/getSingleOffers', verifyToken, publisherController.getSingleOffer);
publisherRouter.post('/searchOffers', verifyToken, publisherController.searchOffers);
// Apikey
publisherRouter.post('/generateApiKey', verifyToken, publisherController.generateApiKey);
publisherRouter.get('/getApiKey', verifyToken, publisherController.getApiKey);
// Campaign
publisherRouter.post('/addCampaign', verifyToken, upload.single('image'), campaignController.addCampaign);
publisherRouter.post('/updateCampaign', verifyToken, upload.single('image'), campaignController.updateCampaign);
publisherRouter.post('/deleteCampaign', verifyToken, campaignController.deleteCampaign);
publisherRouter.get('/getCampaign', verifyToken, campaignController.getCampaign);
publisherRouter.post('/createPayment', verifyToken, campaignController.createPayment);
publisherRouter.get('/executePayment', campaignController.executePayment);
// App/placement
publisherRouter.post('/createApp', verifyToken, placementController.createApp);
publisherRouter.get('/getApp', verifyToken, placementController.getApp);
publisherRouter.post('/updateApp', verifyToken, placementController.updateApp);
publisherRouter.post('/deleteApp', verifyToken, placementController.deleteApp);
publisherRouter.post('/generalSettingApp', verifyToken, placementController.generalSettingApp);
publisherRouter.post('/currencySettingApp', verifyToken, placementController.currencySettingApp);
publisherRouter.post('/designSettingApp', verifyToken, upload.single('logo'), placementController.designSettingApp);
publisherRouter.post('/apiKeySettingApp', verifyToken, placementController.apiKeySettingApp);
publisherRouter.post('/postBackSettingApp', verifyToken, placementController.postBackSettingApp);
publisherRouter.post('/testPostbackSettingApp', verifyToken, placementController.testPostbackSettingApp);
// publisherRouter.post('/removePostBackSettingApp', verifyToken, placementController.removePostBackSettingApp);
//Postback
publisherRouter.post('/postback', verifyToken, postbackController.postback);
publisherRouter.post('/testPostback', verifyToken, postbackController.testPostback);
publisherRouter.post('/adgaitMediaPostback', postbackController.adgaitMediaPostback);
publisherRouter.post('/toroxPostback', postbackController.toroxPostback);
publisherRouter.post('/aditmediaPostback', postbackController.aditmediaPostback);
publisherRouter.post('/farlyPostback', postbackController.farlyPostback);
// offerwall
publisherRouter.post('/offerWall', verifyToken, upload.single('offerwall_logo'), offerwallController.offerWall);
// publisherRouter.post('/OfferWallApiKey', verifyToken, offerwallController.OfferWallApiKey);
publisherRouter.get('/getOfferwallSetting', verifyToken, offerwallController.getOfferwallSetting);
publisherRouter.get('/offerWallIframe', verifyToken, offerwallController.offerWallIframe);
// reports
publisherRouter.post('/dailyReports', verifyToken, reportsController.dailyReports);
publisherRouter.post('/conversionReports', verifyToken, reportsController.conversionReports);
publisherRouter.post('/adConversionReports', verifyToken, reportsController.adConversionReports);
publisherRouter.post('/reversalReports', verifyToken, reportsController.reversalReports);
publisherRouter.post('/clickReports', verifyToken, reportsController.clickReports);
publisherRouter.post('/postbackReports', verifyToken, reportsController.postbackReports);
publisherRouter.post('/userQuestionnaireReports', verifyToken, reportsController.userQuestionnaireReports);
publisherRouter.post('/searchReports', verifyToken, reportsController.searchReports);
publisherRouter.post('/exportDailyReports', verifyToken, reportsController.exportDailyReports);
publisherRouter.post('/exportConversionReports', verifyToken, reportsController.exportConversionReports);
publisherRouter.post('/exportReversalReports', verifyToken, reportsController.exportReversalReports);
publisherRouter.post('/exportClickReports', verifyToken, reportsController.exportClickReports);
publisherRouter.post('/exportPostbackReports', verifyToken, reportsController.exportPostbackReports);
publisherRouter.post('/exportQuestionReports', verifyToken, reportsController.exportQuestionReports);
//payment
publisherRouter.post('/getAllPayment', verifyToken,  paymentController.getAllPayment);
publisherRouter.post('/getPdfFile', verifyToken,  paymentController.getPdfFile);
// Testing route
publisherRouter.post('/testModals', publisherController.testModals);
