import mongoose from 'mongoose';
import chalk from 'chalk';
import { devConfig } from './config.js';

export const configureDb = async () => {
    mongoose.Promise = global.Promise;

    const uri = `mongodb+srv://${devConfig.db_username}:${devConfig.db_password}@${devConfig.db_host}/${devConfig.db_name}?retryWrites=true&w=majority`;

    try {
        await mongoose.connect(uri);
        console.log("DB Connection URL", uri);
        console.log('%s Database connected successfully!', chalk.green('✓'));
    } catch (err) {
        console.error('Could not connect to MongoDB..', err.message);
        console.error('Full error:', err);
    }
};
