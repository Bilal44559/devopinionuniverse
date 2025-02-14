import express from 'express';
import { webRouter } from '../routes/web/web.route.js';
import { publisherRouter } from '../routes/publisher/publisher.route.js';
import { adminRouter } from '../routes/admin/admin.route.js';
import { commonRouter } from '../routes/common/common.route.js';
import { authRouter } from '../routes/auth/auth.route.js';
import { offerwallRouter } from '../routes/offerwall/offerwall.route.js';
import { migrationRouter } from '../routes/common/migration.route.js';

export const restRouter = express.Router();

restRouter.use('/auth', authRouter);
restRouter.use('/web', webRouter);
restRouter.use('/publisher', publisherRouter);
restRouter.use('/admin', adminRouter);
restRouter.use('/common', commonRouter);
restRouter.use('/offerwall', offerwallRouter);
restRouter.use('/migration', migrationRouter);

