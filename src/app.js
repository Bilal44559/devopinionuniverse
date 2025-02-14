import express from 'express';
import chalk from 'chalk';
import { restRouter } from './base/index.js';
import { configureDb } from './config/db.js';
import { setGlobalmiddleware } from './middlewares/global-middleware.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bodyParser from 'body-parser';
import swaggerDocs from "./config/swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
configureDb();
// Route

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.use(express.static(path.join(__dirname, 'uploads/images')));
// app.use(express.urlencoded({ extended: true }));
// const directoryPath = path.join(__dirname, 'common', 'images_assets', 'fetcher-images');

// // Ensure the directory exists
// if (!fs.existsSync(directoryPath)) {
//     fs.mkdirSync(directoryPath, { recursive: true });
// }

app.use(express.json());

setGlobalmiddleware(app);

app.use('/', restRouter);

swaggerDocs(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use(express.urlencoded({ extended: true }));

// handler the UNAUTHORIZED 
app.use('/failure', (req, res, next) => {
  const error = new Error('Not found');
  error.message = 'Invalid Authorization';
  error.status = 401;
  next(error);
});

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.message = 'Invalid route';
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  return res.status(error.status || 500).json({
      message: error.message,
      status_code: error.status,
  });
});

/**
 * Start Express server.
 */
app.listen(3000, '209.38.165.249', () => {
    console.log(`Server running on http://209.38.165.249:3000`);
});
