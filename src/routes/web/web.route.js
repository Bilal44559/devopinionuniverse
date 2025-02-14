import express from 'express';
import webController from '../../controllers/web/web.controller.js';

export const webRouter =  express.Router();

webRouter.get('/testing', webController.testing);