import express from 'express';
import commonController from '../../controllers/common/common.controller.js';

export const commonRouter =  express.Router();

commonRouter.get('/getDataAdgate', commonController.adgate);
commonRouter.get('/farly', commonController.farly);
commonRouter.get('/fetchListenpad', commonController.fetchListenpad);  
commonRouter.get('/torox', commonController.torox);  
    
