import logger from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { devConfig } from '../config/config.js';

export const setGlobalmiddleware = app => {

  /**
   * Load environment variables from .env file, where API keys and passwords are configured.
   */
  dotenv.config({ path: '.env' });
  app.set('env', process.env.NODE_ENV);
  app.set('port', process.env.PORT || 1122);
  app.use(cors());
  app.use(logger('dev'));
  app.use(
    session({
      secret: devConfig.secret,
      resave: true,
      saveUninitialized: true,
    })
  );

  
};