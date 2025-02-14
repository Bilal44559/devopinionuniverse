import express from 'express';
import offerwallController from "../../controllers/offerwall/offerwall.controller.js";
import upload from '../../lib/multer.js';

export const offerwallRouter =  express.Router();

offerwallRouter.post('/offerWallStats', offerwallController.offerWallStats);
offerwallRouter.post('/getOfferwallModel', offerwallController.getOfferWallModel);
offerwallRouter.post('/sendEmailOfferWall', offerwallController.sendEmailOfferWall);
offerwallRouter.post('/getAllOfferwall', offerwallController.getAllOfferWall);
offerwallRouter.post('/getSurveyOfferwall', offerwallController.getSurveyOfferWall);
offerwallRouter.post('/rewardStatus', offerwallController.rewardStatus);
offerwallRouter.post('/contact', offerwallController.contact);
offerwallRouter.post('/getAdsOfferwall', offerwallController.getAdsOfferwall);
offerwallRouter.post('/adsOfferWallProcess', offerwallController.adsOfferWallProcess);
offerwallRouter.post('/questions', offerwallController.questions);
offerwallRouter.post('/getDemographyQuestions', offerwallController.getDemographyQuestions);
offerwallRouter.post('/userDemography', offerwallController.userDemography);
offerwallRouter.post('/userDemographyQuestionPercentage', offerwallController.userDemographyQuestionPercentage);
offerwallRouter.post('/clickOffer',  offerwallController.clickOffer);


offerwallRouter.post('/sendComplaint', upload.single('complaint_file'), offerwallController.sendComplaint);


