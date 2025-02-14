import express from 'express';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csvParser from 'csv-parser';
import User from '../../models/user.model.js';
import bcrypt from 'bcryptjs';
import Network from '../../models/networks.model.js';
import OffersModel from '../../models/offers.model.js';
import axios from 'axios';
import App from '../../models/apps.model.js';
import OfferProcess from '../../models/offerprocess.model.js';
import OfferEvents from '../../models/offerevents.model.js';
import ApiKey from '../../models/apiKeys.model.js';
import PbSettings from '../../models/pbsettings.model.js';
import Pbsent from '../../models/pb_sent.model.js';
import PbLog from '../../models/pblog.model.js';
import AdminEarnings from '../../models/adminearnings.model.js';
import Transaction from '../../models/transactions.model.js';
import Campaign from '../../models/campaigns.model.js';
import CampaignProcess from '../../models/campaignProcess.model.js';

export const migrationRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sanitizeFilename = (filename) => {
    return filename.replace(/[<>:"/\\|?*]+/g, '_'); // Sanitize the filename
};

const parseDate = (dateStr) => {
    return dateStr && dateStr !== 'NULL' && dateStr !== '0000-00-00 00:00:00.000000'
        ? new Date(dateStr)
        : null;
};

export const saveImage = async (imageUrl, imageId, network) => {
    try {
        const directoryPath = path.join(__dirname, '..', '..', 'uploads', 'offers', network);
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        let imageName = path.basename(imageUrl);
        imageName = sanitizeFilename(imageName); // Sanitize the filename

        const savePath = path.join(directoryPath, imageName);

        const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        if (!imageName || imageName.includes('/') || imageName.includes('\\')) {
            throw new Error(`Invalid filename: ${imageName}`);
        }

        fs.writeFileSync(savePath, imageData.data);

        // console.log("image folder path : ",path.join('uploads', 'offers', network, imageName));
        // return false;
        return path.join('uploads', 'offers', network, imageName); // Return the relative path
    } catch (error) {
        // Log a more detailed error message
        // console.error(`Failed to save the image from URL ${imageUrl}:`);
        // console.error(`Error Message: ${error.message}`);
        // console.error(`Error Code: ${error.code || 'N/A'}`);
        // console.error(`Attempted Path: ${path.join(__dirname, '..', '..', 'uploads', 'offers', network, path.basename(imageUrl))}`);
        return null;
    }
};


// Route to migrate users from CSV to MongoDB
migrationRouter.get('/migrationUsers', async (req, res) => {
    const userFilePath = path.join(__dirname, '../../migration-tables/users.csv');
    // console.log('User CSV file: ', userFilePath);
    let msg;
    let users = [];
    const startTime = performance.now();

    // Read the CSV file and parse it
    fs.createReadStream(userFilePath)
        .pipe(csvParser())
        .on('data', async (row) => {
            try {

                const registrationStep = row.registeration_step === "NULL" ? null : row.registeration_step;
                
                const newUser = {
                    uid: row.uid,
                    firstname: row.firstname,
                    lastname: row.lastname,
                    password: row.password,
                    salt: row.salt,
                    email_address: row.email_address,
                    address: row.address,
                    city: row.city,
                    state: row.state,
                    zip: row.zip,
                    country: row.country,
                    phone: row.phone,
                    websites: row.websites,
                    gender: row.gender,
                    referrer_id: row.referrer_id,
                    active: row.active,
                    ip_address: row.ip_address,
                    date_registration: new Date(row.date_registration),
                    offer_rate: parseFloat(row.offer_rate),
                    referral_rate: parseFloat(row.referral_rate),
                    premium_rate: parseFloat(row.premium_rate),
                    isBan: row.isBan,
                    isLocked: row.isLocked,
                    l_hideuser: row.l_hideuser,
                    l_hideEarnings: row.l_hideEarnings,
                    balance: parseFloat(row.balance),
                    promotional_methods: row.promotional_methods,
                    website: row.website,
                    hearby: row.hearby,
                    email_verified: row.email_verified,
                    payment_method: row.payment_method,
                    payment_cycle: row.payment_cycle,
                    payment_method_details: row.payment_method_details,
                    pm_bank_owner: row.pm_bank_owner,
                    pm_bank_name: row.pm_bank_name,
                    pm_bank_address: row.pm_bank_address,
                    pm_bank_ifsc: row.pm_bank_ifsc,
                    pm_wire_swift_code: row.pm_wire_swift_code,
                    pm_wire_iban_no: row.pm_wire_iban_no,
                    offerwall_ratio: parseFloat(row.offerwall_ratio),
                    offerwall_currency: row.offerwall_currency,
                    user_type: row.user_type,
                    logo: row.logo,
                    primary_color: row.primary_color,
                    secondary_color: row.secondary_color,
                    text_color: row.text_color,
                    offer_categories: row.offer_categories,
                    offerwall_iframe_preview: row.offerwall_iframe_preview,
                    split_currency: parseInt(row.split_currency, 10),
                    currency_status: row.currency_status,
                    c_first_name: row.c_first_name,
                    c_last_name: row.c_last_name,
                    company_name: row.company_name,
                    c_tax_number: row.c_tax_number,
                    c_country: row.c_country,
                    c_state: row.c_state,
                    c_city: row.c_city,
                    c_address: row.c_address,
                    c_zip: row.c_zip,
                    c_phone: row.c_phone,
                    c_skype: row.c_skype,
                    c_telegram: row.c_telegram,
                    ads_credit: parseFloat(row.ads_credit),
                    signature_image: row.signature_image,
                    account_type: row.account_type,
                    registeration_number: row.registeration_number,
                    registeration_step: registrationStep, // Converted to null if "NULL"
                    user_designation: row.user_designation,
                    currency_type: row.currency_type,
                    currency: row.currency,
                    funds: parseFloat(row.funds),
                    tracking_link_bit: row.tracking_link_bit || 0,
                };

                // Push the new user into the array
                users.push(newUser);

            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
            }
        })
        .on('end', async () => {
            try {
                // console.log("users", users);
                let password = 'opinionuniverse123';
                let salt = await bcrypt.genSalt();
                let hash = await bcrypt.hash(password, salt);
                for (let index = 0; index < users.length; index++) {
                    users[index].password = hash;        
                }
                
                // console.log("users", users);
                    
                await User.insertMany(users);
                const endTime = performance.now();
                const duration = endTime - startTime;
                msg = `CSV file migrate sucessfully. CSV file processed in ${duration} milliseconds.`;
                const result = makeApiResponse(msg, 1, StatusCodes.OK);
                res.status(StatusCodes.OK).json(result);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
            }
        })
        .on('error', (err) => {
            console.error('Error reading the file:', err);
            msg = 'Error reading the CSV file';
            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
            res.status(StatusCodes.BAD_REQUEST).json(result);
        });
});

// Route to migrate networks from CSV to MongoDB
migrationRouter.get('/networksMigration', async (req, res) => {
    const networkFilePath = path.join(__dirname, '../../migration-tables/networks.csv');
    // console.log('Network CSF file: ', networkFilePath);
    let msg;
    let networks = [];
    const startTime = performance.now();

    // Read the CSV file and parse it
    fs.createReadStream(networkFilePath)
        .pipe(csvParser())
        .on('data', async (row) => {
            try {
                const reversal = row.reversal === "NULL" ? null : row.reversal;
                const newNetwork = {
                    default_network_id: row.id,
                    name: row.name,
                    active: row.active,
                    parameter: row.parameter,
                    ips: row.ips,
                    complete: row.complete,
                    reversal: reversal,
                };

                // Push the new network into the array
                networks.push(newNetwork);

            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
            }
        })
        .on('end', async () => {
            try {
                // console.log("networks", networks);
                             
                await Network.insertMany(networks);
                const endTime = performance.now();
                const duration = endTime - startTime;
                msg = `CSV file migrate sucessfully. CSV file processed in ${duration} milliseconds.`;
                const result = makeApiResponse(msg, 1, StatusCodes.OK);
                res.status(StatusCodes.OK).json(result);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
            }
        })
        .on('error', (err) => {
            console.error('Error reading the file:', err);
            msg = 'Error reading the CSV file';
            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
            res.status(StatusCodes.BAD_REQUEST).json(result);
        });
});


// Route to migrate Offers from CSV to MongoDB
// migrationRouter.get('/offersMigration', async (req, res) => {
//     const offerFilePath = path.join(__dirname, '../../migration-tables/offers.csv');
//     let msg;
//     let offers = [];
//     const startTime = performance.now();
//     let recordCount = 0; // Counter to track processed rows

//     const data = [
//         { camp_id: "100", date: "3/6/2023 4:39" },
//         { camp_id: "4386", date: "6/29/2023 10:58" },
//         { camp_id: "3380", date: "5/25/2023 4:20" },
//         { camp_id: "1626094301", date: "6/7/2023 6:07" },
//         { camp_id: "6201", date: "6/8/2023 4:57" },
//         { camp_id: "410", date: "6/9/2023 10:46" },
//         { camp_id: "4970296", date: "6/13/2023 3:32" },
//         { camp_id: "546255256", date: "5/14/2024 13:54" },
//         { camp_id: "366965", date: "8/7/2023 17:56" },
//         { camp_id: "62112", date: "2/1/2024 5:53" },
//         { camp_id: "10808", date: "2/9/2024 16:12" },
//         { camp_id: "38", date: "9/7/2023 19:44" },
//         { camp_id: "386178", date: "9/16/2023 16:37" },
//         { camp_id: "298453", date: "9/26/2023 18:15" },
//         { camp_id: "298780", date: "10/4/2023 9:50" },
//         { camp_id: "4976433", date: "10/6/2023 8:39" },
//         { camp_id: "6k2yzno5zd", date: "12/6/2023 14:16" },
//         { camp_id: "19591", date: "11/2/2023 15:43" },
//         { camp_id: "20392", date: "11/2/2023 15:43" },
//         { camp_id: "19543", date: "11/2/2023 15:44" },
//         { camp_id: "19541", date: "11/2/2023 15:48" },
//         { camp_id: "15801", date: "11/6/2023 17:43" },
//         { camp_id: "19699", date: "12/1/2023 18:22" },
//         { camp_id: "4411", date: "12/7/2023 6:50" },
//         { camp_id: "3372", date: "12/7/2023 6:50" },
//         { camp_id: "3373", date: "12/7/2023 6:51" },
//         { camp_id: "3632", date: "12/7/2023 6:51" },
//         { camp_id: "3382", date: "12/7/2023 6:51" },
//         { camp_id: "3381", date: "12/7/2023 6:51" },
//         { camp_id: "3379", date: "12/7/2023 6:51" },
//         { camp_id: "3378", date: "12/7/2023 6:52" },
//         { camp_id: "3377", date: "12/7/2023 6:52" },
//         { camp_id: "3376", date: "12/7/2023 6:52" },
//         { camp_id: "3375", date: "12/7/2023 6:52" },
//         { camp_id: "0.8", date: "12/7/2023 6:52" },
//         { camp_id: "497477", date: "12/8/2023 16:37" },
//         { camp_id: "1659635318", date: "12/10/2023 7:52" },
//         { camp_id: "409431", date: "1/25/2024 10:33" },
//         { camp_id: "4.09431E+19", date: "1/27/2024 10:39" },
//         { camp_id: "27", date: "1/27/2024 15:40" },
//         { camp_id: "785", date: "5/2/2024 11:39" },
//         { camp_id: "52", date: "5/2/2024 11:40" },
//         { camp_id: "69585445", date: "5/14/2024 13:55" },
//         { camp_id: "98568956", date: "5/14/2024 18:27" },
//         { camp_id: "532365200", date: "5/14/2024 19:21" },
//         { camp_id: "5260", date: "5/14/2024 19:21" },
//         { camp_id: "652956", date: "5/14/2024 19:21" },
//         { camp_id: "556856", date: "5/14/2024 19:22" },
//         { camp_id: "5911410", date: "7/1/2024 7:01" },
//     ];
    

//     // Read the CSV file and parse it
//     fs.createReadStream(offerFilePath)
//         .pipe(csvParser())
//         .on('data', (row) => {
//             try {
//                 // if (recordCount < 2) {
//                 const newOffer = {
//                     offer_id: row.id,
//                     name: row.name,
//                     description: row.description,
//                     link: row.link,
//                     active: row.active,
//                     credits: row.credits,
//                     hits: row.hits,
//                     limit: row.limit,
//                     countries: row.countries,
//                     date: row.date,
//                     network: row.network,
//                     campaign_id: row.campaign_id,
//                     leads: row.leads,
//                     epc: row.epc,
//                     mobile: row.mobile,
//                     categories: row.categories,
//                     cr: row.cr,
//                     views: row.views,
//                     conv: row.conv,
//                     browsers: row.browsers,
//                     uid: row.uid,
//                     preview: row.preview,
//                     adgatemedia_events: row.adgatemedia_events,
//                     offer_requirements: row.offer_requirements,
//                     image_url: row.image_url,
//                     offer_preview_url: row.offer_preview_url,
//                     deleted_bit: row.deleted_bit,
//                     deleted_date: row.deleted_date,
//                     ban_offer_bit: row.ban_offer_bit || 0,
//                     ban_offer_date: row.ban_offer_date || null,
//                     instal_event_payout: row.instal_event_payout,
//                 };

//                 // Push the new offer into the array
//                 offers.push(newOffer);

//             //     recordCount++; // Increment the counter
//             // }
//             } catch (error) {
//                 console.error('Error parsing row:', error.message);
//             }
//         })
//         .on('end', async () => {
//             try {
//                 // Process all offers and add network_data
//                 offers = await Promise.all(
//                     offers.map(async (offer) => {
//                         const offer_network = offer.network;
//                         const offer_preview = offer.preview;
//                         const offer_id = offer.offer_id;

//                         // Fetch network data from the database
//                         const get_network_data = await Network.findOne({ name: offer_network });

//                         // Construct the network_data object
//                         const network_record = {
//                             network_id: get_network_data ? get_network_data._id : null,
//                             default_network_id: get_network_data ? get_network_data.default_network_id : null,
//                             network_name: get_network_data ? get_network_data.name : null,
//                         };

//                         // Add network_data to the offer
//                         offer.network_data = network_record;

//                         const previewPath = await saveImage(offer_preview, offer_id, offer_network);
//                         // console.log("image previewPath : ",previewPath);
                        
//                         offer.image_url = previewPath;

//                         // Check if offer_id matches any camp_id in the data array
//                         const match = data.find(item => item.camp_id == offer_id);
//                         if (match) {
//                             offer.ban_offer_bit = 1;
//                             offer.ban_offer_date = match.date;
//                         }

//                         // console.log("ban_offer_bit : ", offer.ban_offer_bit);
//                         // console.log("ban_offer_date : ",offer.ban_offer_date);

//                         return offer;
//                     })
//                 );

                
// // console.log(offers);

//                 // Save all offers to MongoDB
//                 await OffersModel.insertMany(offers);

//                 const endTime = performance.now();
//                 const duration = endTime - startTime;
//                 msg = `CSV file migrated successfully. CSV file processed in ${duration.toFixed(2)} milliseconds.`;
//                 const result = makeApiResponse(msg, 1, StatusCodes.OK);
//                 res.status(StatusCodes.OK).json(result);
//             } catch (error) {
//                 console.error('Error during migration:', error.message);
//                 res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
//             }
//         })
//         .on('error', (err) => {
//             console.error('Error reading the file:', err.message);
//             msg = 'Error reading the CSV file';
//             const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
//             res.status(StatusCodes.BAD_REQUEST).json(result);
//         });
// });

migrationRouter.get('/offersMigration', async (req, res) => {
    const offerFilePath = path.join(__dirname, '../../migration-tables/offers.csv');
    const batchSize = 100; // Batch size for database insertion
    let offers = [];
    const startTime = performance.now();

    const data = [
        { camp_id: "100", date: "3/6/2023 4:39" },
        { camp_id: "4386", date: "6/29/2023 10:58" },
        { camp_id: "3380", date: "5/25/2023 4:20" },
        { camp_id: "1626094301", date: "6/7/2023 6:07" },
        { camp_id: "6201", date: "6/8/2023 4:57" },
        { camp_id: "410", date: "6/9/2023 10:46" },
        { camp_id: "4970296", date: "6/13/2023 3:32" },
        { camp_id: "546255256", date: "5/14/2024 13:54" },
        { camp_id: "366965", date: "8/7/2023 17:56" },
        { camp_id: "62112", date: "2/1/2024 5:53" },
        { camp_id: "10808", date: "2/9/2024 16:12" },
        { camp_id: "38", date: "9/7/2023 19:44" },
        { camp_id: "386178", date: "9/16/2023 16:37" },
        { camp_id: "298453", date: "9/26/2023 18:15" },
        { camp_id: "298780", date: "10/4/2023 9:50" },
        { camp_id: "4976433", date: "10/6/2023 8:39" },
        { camp_id: "6k2yzno5zd", date: "12/6/2023 14:16" },
        { camp_id: "19591", date: "11/2/2023 15:43" },
        { camp_id: "20392", date: "11/2/2023 15:43" },
        { camp_id: "19543", date: "11/2/2023 15:44" },
        { camp_id: "19541", date: "11/2/2023 15:48" },
        { camp_id: "15801", date: "11/6/2023 17:43" },
        { camp_id: "19699", date: "12/1/2023 18:22" },
        { camp_id: "4411", date: "12/7/2023 6:50" },
        { camp_id: "3372", date: "12/7/2023 6:50" },
        { camp_id: "3373", date: "12/7/2023 6:51" },
        { camp_id: "3632", date: "12/7/2023 6:51" },
        { camp_id: "3382", date: "12/7/2023 6:51" },
        { camp_id: "3381", date: "12/7/2023 6:51" },
        { camp_id: "3379", date: "12/7/2023 6:51" },
        { camp_id: "3378", date: "12/7/2023 6:52" },
        { camp_id: "3377", date: "12/7/2023 6:52" },
        { camp_id: "3376", date: "12/7/2023 6:52" },
        { camp_id: "3375", date: "12/7/2023 6:52" },
        { camp_id: "0.8", date: "12/7/2023 6:52" },
        { camp_id: "497477", date: "12/8/2023 16:37" },
        { camp_id: "1659635318", date: "12/10/2023 7:52" },
        { camp_id: "409431", date: "1/25/2024 10:33" },
        { camp_id: "4.09431E+19", date: "1/27/2024 10:39" },
        { camp_id: "27", date: "1/27/2024 15:40" },
        { camp_id: "785", date: "5/2/2024 11:39" },
        { camp_id: "52", date: "5/2/2024 11:40" },
        { camp_id: "69585445", date: "5/14/2024 13:55" },
        { camp_id: "98568956", date: "5/14/2024 18:27" },
        { camp_id: "532365200", date: "5/14/2024 19:21" },
        { camp_id: "5260", date: "5/14/2024 19:21" },
        { camp_id: "652956", date: "5/14/2024 19:21" },
        { camp_id: "556856", date: "5/14/2024 19:22" },
        { camp_id: "5911410", date: "7/1/2024 7:01" },
    ];

    try {
        // Cache Network data to minimize database queries
        const networkCache = {};
        const networks = await Network.find({});
        networks.forEach((network) => {
            networkCache[network.name] = {
                network_id: network._id,
                default_network_id: network.default_network_id,
                network_name: network.name,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(offerFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const deleted_date = row.deleted_date === "NULL" ? null : row.deleted_date;
                    const active = row.active === "NULL" ? null : row.active;
                    const credits = row.credits === "NULL" ? null : row.credits;
                    const hits = row.hits === "NULL" ? null : row.hits;
                    const limit = row.limit === "NULL" ? null : row.limit;
                    const date = row.date === "NULL" ? null : row.date;
                    const campaign_id = row.campaign_id === "NULL" ? null : row.campaign_id;
                    const leads = row.leads === "NULL" ? null : row.leads;
                    const epc = row.epc === "NULL" ? null : row.epc;
                    const mobile = row.mobile === "NULL" ? null : row.mobile;
                    const cr = row.cr === "NULL" ? null : row.cr;
                    const views = row.views === "NULL" ? null : row.views;
                    const conv = row.conv === "NULL" ? null : row.conv;
                    const uid = row.uid === "NULL" ? null : row.uid;

                    const newOffer = {
                        offer_id: row.id,
                        name: row.name,
                        description: row.description,
                        link: row.link,
                        active: active,
                        credits: credits,
                        hits: hits,
                        limit: limit,
                        countries: row.countries,
                        date: date,
                        network: row.network,
                        campaign_id: campaign_id,
                        leads: leads,
                        epc: epc,
                        mobile: mobile,
                        categories: row.categories,
                        cr: cr,
                        views: views,
                        conv: conv,
                        browsers: row.browsers,
                        uid: uid,
                        preview: row.preview,
                        adgatemedia_events: row.adgatemedia_events,
                        offer_requirements: row.offer_requirements,
                        image_url: row.image_url,
                        offer_preview_url: row.offer_preview_url,
                        deleted_bit: row.deleted_bit,
                        deleted_date: deleted_date,
                        ban_offer_bit: row.ban_offer_bit || 0,
                        ban_offer_date: row.ban_offer_date || null,
                        instal_event_payout: row.instal_event_payout || 0,
                    };
                    offers.push(newOffer);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < offers.length; i += batchSize) {
                        const batch = offers.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (offer) => {
                                const offer_network = offer.network;
                                const offer_id = offer.offer_id;

                                // Get network data from cache
                                const networkData = networkCache[offer_network] || {
                                    network_id: null,
                                    default_network_id: null,
                                    network_name: null,
                                };
                                offer.network_data = networkData;

                                // Save image and update the image URL
                                offer.image_url = await saveImage(offer.preview, offer_id, offer_network);

                                // Check if offer_id matches any camp_id in the data array
                                const match = data.find((item) => item.camp_id == offer_id);
                                if (match) {
                                    offer.ban_offer_bit = 1;
                                    offer.ban_offer_date = match.date;
                                }

                                return offer;
                            })
                        );

                        // Insert processed batch into MongoDB
                        await OffersModel.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/reverseOfferProcessMigration', async (req, res) => {
    const reverseOfferProcessFilePath = path.join(__dirname, '../../migration-tables/reverse_offer_process.csv');
    const batchSize = 1000; // Batch size for database insertion
    let offerProcesses = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            uid: user.uid,
            };
        });

        // Cache Offer data to minimize database queries
        const offerCache = {};
        const offerDataCache = {};
        const offers = await OffersModel.find({});
        offers.forEach((offer) => {
            offerCache[offer.offer_id] = {
                offer_id: offer._id,
                default_offer_id: offer.offer_id,
                offer_name: offer.name,
            };
            offerDataCache[offer.offer_id] = {
                offer_hits: offer.hits === "NULL" ? null : offer.hits,
                offer_limit: offer.limit === "NULL" ? null : offer.limit,
                offer_leads: offer.leads === "NULL" ? null : offer.leads,
                offer_epc: offer.epc === "NULL" ? null : offer.epc,
                offer_mobile: offer.mobile === "NULL" ? null : offer.mobile,
                offer_cr: offer.cr === "NULL" ? null : offer.cr,
                offer_views: offer.views === "NULL" ? null : offer.views,
                offer_conv: offer.conv === "NULL" ? null : offer.conv,
                offer_description: offer.description,
                offer_link: offer.link,
                offer_active: offer.active === "NULL" ? null : offer.active,
                offer_browsers: offer.browsers,
                offer_category: offer.categories,
                offer_preview: offer.preview,
                offer_adgatemedia_events: offer.adgatemedia_events,
                offer_requirements: offer.offer_requirements,
                offer_image_url: offer.image_url,
                offer_preview_url: offer.preview_url,
                offer_deleted_bit: offer.deleted_bit,
                offer_ban_bit: offer.ban_offer_bit || 0,
                offer_instal_event_payout: offer.instal_event_payout || 0,
            };
        });
      

        // Cache Network data to minimize database queries
        const networkCache = {};
        const networks = await Network.find({});
        networks.forEach((network) => {
            networkCache[network.name] = {
                network_id: network._id,
                default_network_id: network.default_network_id,
                network_name: network.name,
            };
        });

        // Cache App data to minimize database queries
        const appCache = {};
        const apps = await App.find({});
        apps.forEach((app) => {
            appCache[app.default_app_id] = {
                app_id: app._id,
                default_app_id: app.default_app_id,
                app_name: app.app_name,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(reverseOfferProcessFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const ref_credits = row.ref_credits === "NULL" ? null : row.ref_credits;
                    const status = row.status === "NULL" ? null : row.status;
                    const link_id = row.link_id === "NULL" ? null : row.link_id;
                    const gw_id = row.gw_id === "NULL" ? null : row.gw_id;
                    const credits = row.credits === "NULL" ? null : row.credits;
                    const unique = row.unique === "NULL" ? null : row.unique;
                    const total_success_credit = row.total_success_credit === "NULL" ? null : row.total_success_credit;
                    const default_app_id = row.app_id === "NULL" ? null : row.app_id;
                    const date = row.date === "NULL" ? null : row.date;
                    const completed_date = row.completed_date === "NULL" ? null : row.completed_date;
                    const reversed_date = row.reversed_date === "NULL" ? null : row.reversed_date;
                    const campaign_id = row.campaign_id === "NULL" ? null : row.campaign_id;
                    const uid = row.uid === "NULL" ? null : row.uid;
                    // const default_offer_id = row.offer_id === "NULL" ? null : row.offer_id;
                    const default_offer_id = !isNaN(Number(row.offer_id)) ? Number(row.offer_id) : null;

                    const newOfferProcess = {
                        default_offer_process_id: row.id,
                        campaign_id: campaign_id,
                        default_offer_id: default_offer_id,
                        offer_name: row.offer_name,
                        credits: credits,
                        ref_credits: ref_credits,
                        code: row.code,
                        status: status,
                        country: row.country,
                        date: date,
                        completed_date: completed_date,
                        reversed_date: reversed_date,
                        ip: row.ip,
                        network: row.network,
                        link_id: link_id,
                        gw_id: gw_id,
                        credit_mode: row.credit_mode,
                        source: row.source,
                        unique: unique,
                        user_agent: row.user_agent,
                        sid: row.sid,
                        sid2: row.sid2,
                        sid3: row.sid3,
                        sid4: row.sid4,
                        sid5: row.sid5,
                        total_success_credit: total_success_credit,
                        default_app_id: default_app_id,
                        uid: uid,
                    };
                    offerProcesses.push(newOfferProcess);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < offerProcesses.length; i += batchSize) {
                        const batch = offerProcesses.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (offerProcess) => {
                                const offer_process_network = offerProcess.network;
                                const offer_process_offer_id = offerProcess.default_offer_id;
                                const offer_process_app_id = offerProcess.default_app_id;
                                const offer_process_uid = offerProcess.uid;

                                // Get offer data from cache
                                const userData = userCache[offer_process_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                offerProcess.publisher_data = userData;

    
                                  // Get offer data from cache
                                  const offerData = offerCache[offer_process_offer_id] || {
                                    offer_id: null,
                                    default_offer_id: null,
                                    offer_name: null,
                                };
                                offerProcess.offer_data = offerData;
                                offerProcess.offer_id = offerData.offer_id;
                                const offerRemainingData = offerDataCache[offer_process_offer_id] || {};
                                offerProcess.offer_limit = offerRemainingData.offer_limit;
                                offerProcess.offer_leads = offerRemainingData.offer_leads;
                                offerProcess.offer_epc = offerRemainingData.offer_epc;
                                offerProcess.offer_mobile = offerRemainingData.offer_mobile;
                                offerProcess.offer_cr = offerRemainingData.offer_cr;
                                offerProcess.offer_views = offerRemainingData.offer_views;
                                offerProcess.offer_conv = offerRemainingData.offer_conv;
                                offerProcess.offer_description = offerRemainingData.offer_description;
                                offerProcess.offer_link = offerRemainingData.offer_link;
                                offerProcess.offer_active = offerRemainingData.offer_active;
                                offerProcess.offer_browsers = offerRemainingData.offer_browsers;
                                offerProcess.offer_category = offerRemainingData.offer_category;
                                offerProcess.offer_preview = offerRemainingData.offer_preview;
                                offerProcess.offer_adgatemedia_events = offerRemainingData.offer_adgatemedia_events;
                                offerProcess.offer_requirements = offerRemainingData.offer_requirements;
                                offerProcess.offer_image_url = offerRemainingData.offer_image_url;
                                offerProcess.offer_preview_url = offerRemainingData.offer_preview_url;
                                offerProcess.offer_deleted_bit = offerRemainingData.offer_deleted_bit;
                                offerProcess.offer_ban_bit = offerRemainingData.offer_ban_bit;
                                offerProcess.offer_instal_event_payout = offerRemainingData.offer_instal_event_payout;
                                // Get network data from cache
                                const networkData = networkCache[offer_process_network] || {
                                    network_id: null,
                                    default_network_id: null,
                                    network_name: null,
                                };
                                offerProcess.network_data = networkData;

                                  // Get app data from cache
                                const appData = appCache[offer_process_app_id] || {
                                    app_id: null,
                                    default_app_id: null,
                                    app_name: null
                                };
                                offerProcess.app_data = appData;
                                offerProcess.app_id = appData.app_id;
                                return offerProcess;
                            })
                        );
                        // console.log('offer : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await OfferProcess.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/completeOfferProcessMigration', async (req, res) => {
    const completeOfferProcessFilePath = path.join(__dirname, '../../migration-tables/complete_offer_process.csv');
    const batchSize = 5000; // Batch size for database insertion
    let offerProcesses = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            uid: user.uid,
            };
        });

        // Cache Offer data to minimize database queries
        const offerCache = {};
        const offerDataCache = {};
        const offers = await OffersModel.find({});
        offers.forEach((offer) => {
            offerCache[offer.offer_id] = {
                offer_id: offer._id,
                default_offer_id: offer.offer_id,
                offer_name: offer.name,
            };
            offerDataCache[offer.offer_id] = {
                offer_hits: offer.hits === "NULL" ? null : offer.hits,
                offer_limit: offer.limit === "NULL" ? null : offer.limit,
                offer_leads: offer.leads === "NULL" ? null : offer.leads,
                offer_epc: offer.epc === "NULL" ? null : offer.epc,
                offer_mobile: offer.mobile === "NULL" ? null : offer.mobile,
                offer_cr: offer.cr === "NULL" ? null : offer.cr,
                offer_views: offer.views === "NULL" ? null : offer.views,
                offer_conv: offer.conv === "NULL" ? null : offer.conv,
                offer_description: offer.description,
                offer_link: offer.link,
                offer_active: offer.active === "NULL" ? null : offer.active,
                offer_browsers: offer.browsers,
                offer_category: offer.categories,
                offer_preview: offer.preview,
                offer_adgatemedia_events: offer.adgatemedia_events,
                offer_requirements: offer.offer_requirements,
                offer_image_url: offer.image_url,
                offer_preview_url: offer.preview_url,
                offer_deleted_bit: offer.deleted_bit,
                offer_ban_bit: offer.ban_offer_bit || 0,
                offer_instal_event_payout: offer.instal_event_payout || 0,
            };
        });
      

        // Cache Network data to minimize database queries
        const networkCache = {};
        const networks = await Network.find({});
        networks.forEach((network) => {
            networkCache[network.name] = {
                network_id: network._id,
                default_network_id: network.default_network_id,
                network_name: network.name,
            };
        });

        // Cache App data to minimize database queries
        const appCache = {};
        const apps = await App.find({});
        apps.forEach((app) => {
            appCache[app.default_app_id] = {
                app_id: app._id,
                default_app_id: app.default_app_id,
                app_name: app.app_name,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(completeOfferProcessFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const ref_credits = row.ref_credits === "NULL" ? null : row.ref_credits;
                    const status = row.status === "NULL" ? null : row.status;
                    const link_id = row.link_id === "NULL" ? null : row.link_id;
                    const gw_id = row.gw_id === "NULL" ? null : row.gw_id;
                    const credits = row.credits === "NULL" ? null : row.credits;
                    const unique = row.unique === "NULL" ? null : row.unique;
                    const total_success_credit = row.total_success_credit === "NULL" ? null : row.total_success_credit;
                    const default_app_id = row.app_id === "NULL" ? null : row.app_id;
                    const date = row.date === "NULL" ? null : row.date;
                    const completed_date = row.completed_date === "NULL" ? null : row.completed_date;
                    const reversed_date = row.reversed_date === "NULL" ? null : row.reversed_date;
                    const campaign_id = row.campaign_id === "NULL" ? null : row.campaign_id;
                    const uid = row.uid === "NULL" ? null : row.uid;
                    // const default_offer_id = row.offer_id === "NULL" ? null : row.offer_id;
                    const default_offer_id = !isNaN(Number(row.offer_id)) ? Number(row.offer_id) : null;

                    const newOfferProcess = {
                        default_offer_process_id: row.id,
                        campaign_id: campaign_id,
                        default_offer_id: default_offer_id,
                        offer_name: row.offer_name,
                        credits: credits,
                        ref_credits: ref_credits,
                        code: row.code,
                        status: status,
                        country: row.country,
                        date: date,
                        completed_date: completed_date,
                        reversed_date: reversed_date,
                        ip: row.ip,
                        network: row.network,
                        link_id: link_id,
                        gw_id: gw_id,
                        credit_mode: row.credit_mode,
                        source: row.source,
                        unique: unique,
                        user_agent: row.user_agent,
                        sid: row.sid,
                        sid2: row.sid2,
                        sid3: row.sid3,
                        sid4: row.sid4,
                        sid5: row.sid5,
                        total_success_credit: total_success_credit,
                        default_app_id: default_app_id,
                        uid: uid,
                    };
                    offerProcesses.push(newOfferProcess);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < offerProcesses.length; i += batchSize) {
                        const batch = offerProcesses.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (offerProcess) => {
                                const offer_process_network = offerProcess.network;
                                const offer_process_offer_id = offerProcess.default_offer_id;
                                const offer_process_app_id = offerProcess.default_app_id;
                                const offer_process_uid = offerProcess.uid;

                                // Get offer data from cache
                                const userData = userCache[offer_process_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                offerProcess.publisher_data = userData;

    
                                  // Get offer data from cache
                                  const offerData = offerCache[offer_process_offer_id] || {
                                    offer_id: null,
                                    default_offer_id: null,
                                    offer_name: null,
                                };
                                offerProcess.offer_data = offerData;
                                offerProcess.offer_id = offerData.offer_id;
                                const offerRemainingData = offerDataCache[offer_process_offer_id] || {};
                                offerProcess.offer_limit = offerRemainingData.offer_limit;
                                offerProcess.offer_leads = offerRemainingData.offer_leads;
                                offerProcess.offer_epc = offerRemainingData.offer_epc;
                                offerProcess.offer_mobile = offerRemainingData.offer_mobile;
                                offerProcess.offer_cr = offerRemainingData.offer_cr;
                                offerProcess.offer_views = offerRemainingData.offer_views;
                                offerProcess.offer_conv = offerRemainingData.offer_conv;
                                offerProcess.offer_description = offerRemainingData.offer_description;
                                offerProcess.offer_link = offerRemainingData.offer_link;
                                offerProcess.offer_active = offerRemainingData.offer_active;
                                offerProcess.offer_browsers = offerRemainingData.offer_browsers;
                                offerProcess.offer_category = offerRemainingData.offer_category;
                                offerProcess.offer_preview = offerRemainingData.offer_preview;
                                offerProcess.offer_adgatemedia_events = offerRemainingData.offer_adgatemedia_events;
                                offerProcess.offer_requirements = offerRemainingData.offer_requirements;
                                offerProcess.offer_image_url = offerRemainingData.offer_image_url;
                                offerProcess.offer_preview_url = offerRemainingData.offer_preview_url;
                                offerProcess.offer_deleted_bit = offerRemainingData.offer_deleted_bit;
                                offerProcess.offer_ban_bit = offerRemainingData.offer_ban_bit;
                                offerProcess.offer_instal_event_payout = offerRemainingData.offer_instal_event_payout;
                                // Get network data from cache
                                const networkData = networkCache[offer_process_network] || {
                                    network_id: null,
                                    default_network_id: null,
                                    network_name: null,
                                };
                                offerProcess.network_data = networkData;

                                  // Get app data from cache
                                const appData = appCache[offer_process_app_id] || {
                                    app_id: null,
                                    default_app_id: null,
                                    app_name: null
                                };
                                offerProcess.app_data = appData;
                                offerProcess.app_id = appData.app_id;
                                return offerProcess;
                            })
                        );
                        // console.log('offer : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await OfferProcess.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/pendingOfferProcessMigration', async (req, res) => {
    const pendingOfferProcessFilePath = path.join(__dirname, '../../migration-tables/pending_offer_process.csv');
    const batchSize = 10000; // Batch size for database insertion
    let offerProcesses = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            uid: user.uid,
            };
        });

        // Cache Offer data to minimize database queries
        const offerCache = {};
        const offerDataCache = {};
        const offers = await OffersModel.find({});
        offers.forEach((offer) => {
            offerCache[offer.offer_id] = {
                offer_id: offer._id,
                default_offer_id: offer.offer_id,
                offer_name: offer.name,
            };
            offerDataCache[offer.offer_id] = {
                offer_hits: offer.hits === "NULL" ? null : offer.hits,
                offer_limit: offer.limit === "NULL" ? null : offer.limit,
                offer_leads: offer.leads === "NULL" ? null : offer.leads,
                offer_epc: offer.epc === "NULL" ? null : offer.epc,
                offer_mobile: offer.mobile === "NULL" ? null : offer.mobile,
                offer_cr: offer.cr === "NULL" ? null : offer.cr,
                offer_views: offer.views === "NULL" ? null : offer.views,
                offer_conv: offer.conv === "NULL" ? null : offer.conv,
                offer_description: offer.description,
                offer_link: offer.link,
                offer_active: offer.active === "NULL" ? null : offer.active,
                offer_browsers: offer.browsers,
                offer_category: offer.categories,
                offer_preview: offer.preview,
                offer_adgatemedia_events: offer.adgatemedia_events,
                offer_requirements: offer.offer_requirements,
                offer_image_url: offer.image_url,
                offer_preview_url: offer.preview_url,
                offer_deleted_bit: offer.deleted_bit,
                offer_ban_bit: offer.ban_offer_bit || 0,
                offer_instal_event_payout: offer.instal_event_payout || 0,
            };
        });
      

        // Cache Network data to minimize database queries
        const networkCache = {};
        const networks = await Network.find({});
        networks.forEach((network) => {
            networkCache[network.name] = {
                network_id: network._id,
                default_network_id: network.default_network_id,
                network_name: network.name,
            };
        });

        // Cache App data to minimize database queries
        const appCache = {};
        const apps = await App.find({});
        apps.forEach((app) => {
            appCache[app.default_app_id] = {
                app_id: app._id,
                default_app_id: app.default_app_id,
                app_name: app.app_name,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(pendingOfferProcessFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const ref_credits = row.ref_credits === "NULL" ? null : row.ref_credits;
                    const status = row.status === "NULL" ? null : row.status;
                    const link_id = row.link_id === "NULL" ? null : row.link_id;
                    const gw_id = row.gw_id === "NULL" ? null : row.gw_id;
                    const credits = row.credits === "NULL" ? null : row.credits;
                    const unique = row.unique === "NULL" ? null : row.unique;
                    const total_success_credit = row.total_success_credit === "NULL" ? null : row.total_success_credit;
                    const default_app_id = row.app_id === "NULL" ? null : row.app_id;
                    const date = row.date === "NULL" ? null : row.date;
                    const completed_date = row.completed_date === "NULL" ? null : row.completed_date;
                    const reversed_date = row.reversed_date === "NULL" ? null : row.reversed_date;
                    const campaign_id = row.campaign_id === "NULL" ? null : row.campaign_id;
                    const uid = row.uid === "NULL" ? null : row.uid;
                    // const default_offer_id = row.offer_id === "NULL" ? null : row.offer_id;
                    const default_offer_id = !isNaN(Number(row.offer_id)) ? Number(row.offer_id) : null;

                    const newOfferProcess = {
                        default_offer_process_id: row.id,
                        campaign_id: campaign_id,
                        default_offer_id: default_offer_id,
                        offer_name: row.offer_name,
                        credits: credits,
                        ref_credits: ref_credits,
                        code: row.code,
                        status: status,
                        country: row.country,
                        date: date,
                        completed_date: completed_date,
                        reversed_date: reversed_date,
                        ip: row.ip,
                        network: row.network,
                        link_id: link_id,
                        gw_id: gw_id,
                        credit_mode: row.credit_mode,
                        source: row.source,
                        unique: unique,
                        user_agent: row.user_agent,
                        sid: row.sid,
                        sid2: row.sid2,
                        sid3: row.sid3,
                        sid4: row.sid4,
                        sid5: row.sid5,
                        total_success_credit: total_success_credit,
                        default_app_id: default_app_id,
                        uid: uid,
                    };
                    offerProcesses.push(newOfferProcess);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < offerProcesses.length; i += batchSize) {
                        const batch = offerProcesses.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (offerProcess) => {
                                const offer_process_network = offerProcess.network;
                                const offer_process_offer_id = offerProcess.default_offer_id;
                                const offer_process_app_id = offerProcess.default_app_id;
                                const offer_process_uid = offerProcess.uid;

                                // Get offer data from cache
                                const userData = userCache[offer_process_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                offerProcess.publisher_data = userData;

    
                                  // Get offer data from cache
                                  const offerData = offerCache[offer_process_offer_id] || {
                                    offer_id: null,
                                    default_offer_id: null,
                                    offer_name: null,
                                };
                                offerProcess.offer_data = offerData;
                                offerProcess.offer_id = offerData.offer_id;
                                const offerRemainingData = offerDataCache[offer_process_offer_id] || {};
                                offerProcess.offer_limit = offerRemainingData.offer_limit;
                                offerProcess.offer_leads = offerRemainingData.offer_leads;
                                offerProcess.offer_epc = offerRemainingData.offer_epc;
                                offerProcess.offer_mobile = offerRemainingData.offer_mobile;
                                offerProcess.offer_cr = offerRemainingData.offer_cr;
                                offerProcess.offer_views = offerRemainingData.offer_views;
                                offerProcess.offer_conv = offerRemainingData.offer_conv;
                                offerProcess.offer_description = offerRemainingData.offer_description;
                                offerProcess.offer_link = offerRemainingData.offer_link;
                                offerProcess.offer_active = offerRemainingData.offer_active;
                                offerProcess.offer_browsers = offerRemainingData.offer_browsers;
                                offerProcess.offer_category = offerRemainingData.offer_category;
                                offerProcess.offer_preview = offerRemainingData.offer_preview;
                                offerProcess.offer_adgatemedia_events = offerRemainingData.offer_adgatemedia_events;
                                offerProcess.offer_requirements = offerRemainingData.offer_requirements;
                                offerProcess.offer_image_url = offerRemainingData.offer_image_url;
                                offerProcess.offer_preview_url = offerRemainingData.offer_preview_url;
                                offerProcess.offer_deleted_bit = offerRemainingData.offer_deleted_bit;
                                offerProcess.offer_ban_bit = offerRemainingData.offer_ban_bit;
                                offerProcess.offer_instal_event_payout = offerRemainingData.offer_instal_event_payout;
                                // Get network data from cache
                                const networkData = networkCache[offer_process_network] || {
                                    network_id: null,
                                    default_network_id: null,
                                    network_name: null,
                                };
                                offerProcess.network_data = networkData;

                                  // Get app data from cache
                                const appData = appCache[offer_process_app_id] || {
                                    app_id: null,
                                    default_app_id: null,
                                    app_name: null
                                };
                                offerProcess.app_data = appData;
                                offerProcess.app_id = appData.app_id;
                                return offerProcess;
                            })
                        );
                        // console.log('offer : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await OfferProcess.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/offerEventsMigration', async (req, res) => {
    const offerEventFilePath = path.join(__dirname, '../../migration-tables/offer_events.csv');
    const batchSize = 1000; // Batch size for database insertion
    let offerEvents = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            uid: user.uid,
            };
        });

        // Cache Offer data to minimize database queries
        const offerCache = {};
        const offers = await OffersModel.find({});
        offers.forEach((offer) => {
            offerCache[offer.offer_id] = {
                offer_id: offer._id,
                default_offer_id: offer.offer_id,
                offer_name: offer.name,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(offerEventFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const datetime = row.datetime === "NULL" ? null : row.datetime;
                    const user_payout = row.user_payout === "NULL" ? null : row.user_payout;
                    const pub_payout = row.pub_payout === "NULL" ? null : row.pub_payout;
                    const uid = row.uid === "NULL" ? null : row.uid;

                    const newOfferEvent = {
                        default_offer_event_id: row.id,
                        uid: uid,
                        event_id: row.event_id,
                        event_name: row.event_name,
                        default_offer_id: row.offer_id,
                        pub_payout: pub_payout,
                        user_payout: user_payout,
                        sid: row.sid,
                        datetime: datetime,
                    };
                    offerEvents.push(newOfferEvent);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < offerEvents.length; i += batchSize) {
                        const batch = offerEvents.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (offerEvent) => {
                                const offer_event_uid = offerEvent.uid;
                                const offer_event_offer_id = offerEvent.default_offer_id;

                                // Get offer data from cache
                                const userData = userCache[offer_event_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                offerEvent.publisher_data = userData;

                                // Get offer data from cache
                                const offerData = offerCache[offer_event_offer_id] || {
                                    offer_id: null,
                                    default_offer_id: null,
                                    offer_name: null,
                                };
                                offerEvent.offer_data = offerData;
                                offerEvent.offer_id = offerData.offer_id;

                                return offerEvent;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await OfferEvents.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});


migrationRouter.get('/appsMigration', async (req, res) => {
    const appsFilePath = path.join(__dirname, '../../migration-tables/apps.csv');
    const batchSize = 1000; // Batch size for database insertion
    let apps = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            uid: user.uid,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(appsFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const datetime = row.datetime === "NULL" ? null : row.datetime;
                    const split_currency = row.split_currency === "NULL" ? null : row.split_currency;
                    const ratio = row.ratio === "NULL" ? null : row.ratio;
                    const api_key_status = row.api_key_status === "NULL" ? null : row.api_key_status;
                    const currency_status = row.currency_status === "NULL" ? null : row.currency_status;
                    const ip = row.ip === "NULL" ? null : row.ip;
                    const uid = row.uid === "NULL" ? null : row.uid;
                    const decimal_points = row.decimal_points === "NULL" ? null : row.decimal_points;

                    const newApp = {
                        uid: uid,
                        app_name: row.app_name,
                        unique_id: row.unique_id,
                        website_url: row.website_url,
                        datetime: datetime,
                        currency: row.currency,
                        split_currency: split_currency,
                        ratio: ratio,
                        logo: row.logo,
                        categories: row.categories,
                        primary_clr: row.primary_clr,
                        secondary_clr: row.secondary_clr,
                        text_clr: row.text_clr,
                        api_key: row.api_key,
                        api_key_status: api_key_status,
                        postback_url: row.postback_url,
                        currency_status: currency_status,
                        ip: ip,
                        decimal_points: decimal_points,
                    };
                    apps.push(newApp);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < apps.length; i += batchSize) {
                        const batch = apps.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (app) => {
                                const app_uid = app.uid;

                                // Get offer data from cache
                                const userData = userCache[app_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                app.publisher_data = userData;

                                return app;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await App.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/apiKeysMigration', async (req, res) => {
    const apiKeysFilePath = path.join(__dirname, '../../migration-tables/api_keys.csv');
    const batchSize = 1000; // Batch size for database insertion
    let apiKeys = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            uid: user.uid,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(apiKeysFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const uid = row.uid === "NULL" ? null : row.uid;

                    const newApiKey = {
                        uid: uid,
                        apikey: row.api_key,
                        status: row.status,
                        requestBit: row.request_bit,
                    };
                    apiKeys.push(newApiKey);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < apiKeys.length; i += batchSize) {
                        const batch = apiKeys.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (apiKey) => {
                                const api_Key_uid = apiKey.uid;

                                // Get offer data from cache
                                const userData = userCache[api_Key_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                apiKey.publisher_data = userData;
                                return apiKey;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await ApiKey.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/pbSettingsMigration', async (req, res) => {
    const pbsettingsFilePath = path.join(__dirname, '../../migration-tables/pb_settings.csv');
    const batchSize = 1000; // Batch size for database insertion
    let pbsettings = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            uid: user.uid,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(pbsettingsFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const uid = row.uid === "NULL" ? null : row.uid;
                    const check_ip = row.check_ip === "NULL" ? null : row.check_ip;
                    const date = row.date === "NULL" ? null : row.date;

                    const newPbSetting = {
                        uid: uid,
                        pb_type: row.pb_type,
                        url: row.url,
                        check_ip: check_ip,
                        date: date,
                    };
                    pbsettings.push(newPbSetting);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < pbsettings.length; i += batchSize) {
                        const batch = pbsettings.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (pbsetting) => {
                                const pb_settings_uid = pbsetting.uid;

                                // Get offer data from cache
                                const userData = userCache[pb_settings_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                pbsetting.publisher_data = userData;
                                return pbsetting;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await PbSettings.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/pbSentMigration', async (req, res) => {
    const pbSentFilePath = path.join(__dirname, '../../migration-tables/pb_sent.csv');
    const batchSize = 10000; // Batch size for database insertion
    let pbSents = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            uid: user.uid,
            };
        });

        // Cache Offer data to minimize database queries
        const offerCache = {};
        const offers = await OffersModel.find({});
        offers.forEach((offer) => {
            offerCache[offer.campaign_id] = {
                camp_id: offer._id,
                default_camp_id: offer.campaign_id,
                camp_name: offer.name,
            };
        });

        // Cache Network data to minimize database queries
        const networkCache = {};
        const networks = await Network.find({});
        networks.forEach((network) => {
            networkCache[network.name] = {
                network_id: network._id,
                default_network_id: network.default_network_id,
                network_name: network.name,
            };
        });

        // Cache App data to minimize database queries
        const appCache = {};
        const apps = await App.find({});
        apps.forEach((app) => {
            appCache[app.default_app_id] = {
                app_id: app._id,
                default_app_id: app.default_app_id,
                app_name: app.app_name,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(pbSentFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const uid = row.uid === "NULL" ? null : row.uid;
                    const default_camp_id = row.campid === "NULL" ? null : row.campid;
                    const status = row.status === "NULL" ? null : row.status;
                    const date = row.date === "NULL" ? null : row.date;
                    const payout = row.payout === "NULL" ? null : row.payout;
                    const default_app_id = row.app_id === "NULL" ? null : row.app_id;

                    const newPbSent = {
                        uid: uid,
                        default_camp_id: default_camp_id,
                        network: row.network,
                        url: row.url,
                        status: status,
                        date: date,
                        pb_response: row.pb_response,
                        offer_id: row.offer_id,
                        payout: payout,
                        sid: row.sid,
                        sid2: row.sid2,
                        sid3: row.sid3,
                        sid4: row.sid4,
                        sid5: row.sid5,
                        ip: row.ip,
                        tid: row.tid,
                        event_id: row.event_id,
                        event_name: row.event_name,
                        default_app_id: default_app_id
                    };
                    pbSents.push(newPbSent);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < pbSents.length; i += batchSize) {
                        const batch = pbSents.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (pbSent) => {
                                const pb_sent_uid = pbSent.uid;
                                const pb_sent_campid = pbSent.default_camp_id;
                                const pb_sent_network = pbSent.network;
                                const pb_sent_appid = pbSent.default_app_id;

                                // Get offer data from cache
                                const userData = userCache[pb_sent_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                pbSent.publisher_data = userData;

                                // Get offer data from cache
                                const offerData = offerCache[pb_sent_campid] || {
                                    camp_id: null,
                                    default_camp_id: null,
                                    camp_name: null,
                                };
                                pbSent.offer_data = offerData;
                                pbSent.camp_id = offerData.camp_id;

                                 // Get network data from cache
                                 const networkData = networkCache[pb_sent_network] || {
                                    network_id: null,
                                    default_network_id: null,
                                    network_name: null,
                                };
                                pbSent.network_data = networkData;

                                  // Get app data from cache
                                const appData = appCache[pb_sent_appid] || {
                                    app_id: null,
                                    default_app_id: null,
                                    app_name: null
                                };
                                pbSent.app_data = appData;
                                pbSent.app_id = appData.app_id;

                                return pbSent;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await Pbsent.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/pbLogMigration', async (req, res) => {
    const pbLogFilePath = path.join(__dirname, '../../migration-tables/pblog.csv');
    const batchSize = 10000; // Batch size for database insertion
    let pbLogs = [];
    const startTime = performance.now();

    try {

        // Cache Offer data to minimize database queries
        const offerCache = {};
        const offers = await OffersModel.find({});
        offers.forEach((offer) => {
            offerCache[offer.campaign_id] = {
                camp_id: offer._id,
                default_camp_id: offer.campaign_id,
                camp_name: offer.name,
            };
        });

        // Cache Network data to minimize database queries
        const networkCache = {};
        const networks = await Network.find({});
        networks.forEach((network) => {
            networkCache[network.name] = {
                network_id: network._id,
                default_network_id: network.default_network_id,
                network_name: network.name,
            };
        });

        // Cache App data to minimize database queries
        const appCache = {};
        const apps = await App.find({});
        apps.forEach((app) => {
            appCache[app.default_app_id] = {
                app_id: app._id,
                default_app_id: app.default_app_id,
                app_name: app.app_name,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(pbLogFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const default_camp_id = row.campid === "NULL" ? null : row.campid;
                    const status = row.status === "NULL" ? null : row.status;
                    const date = row.date === "NULL" ? null : row.date;
                    const user_payout = row.user_payout === "NULL" ? null : row.user_payout;
                    const pub_payout = row.pub_payout === "NULL" ? null : row.pub_payout;
                    const default_app_id = row.app_id === "NULL" ? null : row.app_id;

                    const newPbLog = {
                        network: row.network,
                        default_camp_id: default_camp_id,
                        sid1: row.sid1,
                        sid2: row.sid2,
                        status: status,
                        ip: row.ip,
                        date: date,
                        request_uri: row.request_uri,
                        type: row.type,
                        user_payout: user_payout,
                        pub_payout: pub_payout,
                        response: row.response,
                        default_app_id: default_app_id
                    };
                    pbLogs.push(newPbLog);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < pbLogs.length; i += batchSize) {
                        const batch = pbLogs.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (pbLog) => {
                                const pb_log_campid = pbLog.default_camp_id;
                                const pb_log_network = pbLog.network;
                                const pb_log_appid = pbLog.default_app_id;

                                // Get offer data from cache
                                const offerData = offerCache[pb_log_campid] || {
                                    camp_id: null,
                                    default_camp_id: null,
                                    camp_name: null,
                                };
                                pbLog.offer_data = offerData;
                                pbLog.camp_id = offerData.camp_id;

                                 // Get network data from cache
                                 const networkData = networkCache[pb_log_network] || {
                                    network_id: null,
                                    default_network_id: null,
                                    network_name: null,
                                };
                                pbLog.network_data = networkData;

                                  // Get app data from cache
                                const appData = appCache[pb_log_appid] || {
                                    app_id: null,
                                    default_app_id: null,
                                    app_name: null
                                };
                                pbLog.app_data = appData;
                                pbLog.app_id = appData.app_id;

                                return pbLog;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await PbLog.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/adminEarningsMigration', async (req, res) => {
    const adminEarningsFilePath = path.join(__dirname, '../../migration-tables/admin_earnings.csv');
    const batchSize = 10000; // Batch size for database insertion
    let adminEarnings = [];
    const startTime = performance.now();

    try {

        // Cache Offer data to minimize database queries
        const offerCache = {};
        const offers = await OffersModel.find({});
        offers.forEach((offer) => {
            offerCache[offer.campaign_id] = {
                campaign_id: offer._id,
                default_campaign_id: offer.campaign_id,
                campaign_name: offer.name,
            };
        });

        // Cache Network data to minimize database queries
        const networkCache = {};
        const networks = await Network.find({});
        networks.forEach((network) => {
            networkCache[network.name] = {
                network_id: network._id,
                default_network_id: network.default_network_id,
                network_name: network.name,
            };
        });

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            uid: user.uid,
            };
        });

  

        // Read the CSV file and parse it
        fs.createReadStream(adminEarningsFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const default_campaign_id = row.campaign_id === "NULL" ? null : row.campaign_id;
                    const credits = row.credits === "NULL" ? null : row.credits;
                    const date = row.date === "NULL" ? null : row.date;
                    const uid = row.uid === "NULL" ? null : row.uid;
                    const offer_id = row.offer_id === "NULL" ? null : row.offer_id;

                    const newAdminEarning = {
                        credits: credits,
                        default_campaign_id: default_campaign_id,
                        network: row.network,
                        offer_name: row.offer_name,
                        uid: uid,
                        date: date,
                        hash: row.hash,
                        offer_id: offer_id,
                        country: row.country
                    };
                    adminEarnings.push(newAdminEarning);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < adminEarnings.length; i += batchSize) {
                        const batch = adminEarnings.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (adminEarning) => {
                                const admin_earnings_campaign_id = adminEarning.default_campaign_id;
                                const admin_earnings_network = adminEarning.network;
                                const admin_earnings_uid = adminEarning.uid;

                                // Get offer data from cache
                                const offerData = offerCache[admin_earnings_campaign_id] || {
                                    campaign_id: null,
                                    default_campaign_id: null,
                                    campaign_name: null,
                                };
                                adminEarning.offer_data = offerData;
                                adminEarning.campaign_id = offerData.campaign_id;

                                 // Get network data from cache
                                 const networkData = networkCache[admin_earnings_network] || {
                                    network_id: null,
                                    default_network_id: null,
                                    network_name: null,
                                };
                                adminEarning.network_data = networkData;

                                // Get offer data from cache
                                const userData = userCache[admin_earnings_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                adminEarning.publisher_data = userData;

                                return adminEarning;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await AdminEarnings.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/transactionsMigration', async (req, res) => {
    const transactionsFilePath = path.join(__dirname, '../../migration-tables/transactions.csv');
    const batchSize = 10000; // Batch size for database insertion
    let transactions = [];
    const startTime = performance.now();

    try {

          // Cache User data to minimize database queries
          const userCache = {};
          const users = await User.find({});
          users.forEach((user) => {
          userCache[user.uid] = {
              user_id: user._id,
              uid: user.uid,
              };
          });

        // Cache Offer data to minimize database queries
        const offerCache = {};
        const offers = await OffersModel.find({});
        offers.forEach((offer) => {
            offerCache[`${offer.campaign_id}-${offer.network}`] = {
                offer_id: offer._id,
                default_offer_id: offer.campaign_id,
                offer_name: offer.name,
            };
        });

        // Cache Network data to minimize database queries
        const networkCache = {};
        const networks = await Network.find({});
        networks.forEach((network) => {
            networkCache[network.name] = {
                network_id: network._id,
                default_network_id: network.default_network_id,
                network_name: network.name,
            };
        });

        // Cache App data to minimize database queries
        const appCache = {};
        const apps = await App.find({});
        apps.forEach((app) => {
            appCache[app.default_app_id] = {
                app_id: app._id,
                default_app_id: app.default_app_id,
                app_name: app.app_name,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(transactionsFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const uid = row.uid === "NULL" ? null : row.uid;
                    const link_id = row.link_id === "NULL" ? null : row.link_id;
                    const gw_id = row.gw_id === "NULL" ? null : row.gw_id;
                    const referral_id = row.referral_id === "NULL" ? null : row.referral_id;
                    const default_offer_id = row.offer_id === "NULL" ? null : row.offer_id;
                    const credits = row.credits === "NULL" ? null : row.credits;
                    const date = row.date === "NULL" ? null : row.date;
                    const ip = row.ip === "NULL" ? null : row.ip;
                    const default_app_id = row.app_id === "NULL" ? null : row.app_id;

                    const newTransaction = {
                        uid: uid,
                        link_id: link_id,
                        gw_id: gw_id,
                        referral_id: referral_id,
                        default_offer_id: default_offer_id,
                        offer_name: row.offer_name,
                        credits: credits,
                        type: row.type,
                        date: date,
                        network: row.network,
                        hash: row.hash,
                        ip: ip,
                        country: row.country,
                        default_app_id: default_app_id
                    };
                    transactions.push(newTransaction);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < transactions.length; i += batchSize) {
                        const batch = transactions.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (transaction) => {
                                const transactions_uid = transaction.uid;
                                const transactions_offer_id = transaction.default_offer_id;
                                const transactions_network = transaction.network;
                                const transactions_app_id =transaction.default_app_id;
                                // Get offer data from cache
                                const userData = userCache[transactions_uid] || {
                                    user_id: null,
                                    uid: null,
                                };
                                transaction.publisher_data = userData;

                                // Get offer data from cache
                                const offerData = offerCache[`${transaction.default_offer_id}-${transaction.network}`] || {
                                    offer_id: null,
                                    default_offer_id: null,
                                    offer_name: null,
                                };
                                transaction.offer_data = offerData;
                                transaction.offer_id = offerData.offer_id;

                                 // Get network data from cache
                                 const networkData = networkCache[transactions_network] || {
                                    network_id: null,
                                    default_network_id: null,
                                    network_name: null,
                                };
                                transaction.network_data = networkData;

                                // Get app data from cache
                                const appData = appCache[transactions_app_id] || {
                                app_id: null,
                                default_app_id: null,
                                app_name: null
                                };
                                transaction.app_data = appData;
                                transaction.app_id = appData.app_id;

                                return transaction;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await Transaction.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/campaignsMigration', async (req, res) => {
    const campaignsFilePath = path.join(__dirname, '../../migration-tables/campaigns.csv');
    const batchSize = 100; // Batch size for database insertion
    let campaigns = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            pid: user.uid,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(campaignsFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const default_campaign_id = row.id === "NULL" ? null : row.id;
                    const pid = row.pid === "NULL" ? null : row.pid;
                    const no_of_views = row.no_of_views === "NULL" ? null : row.no_of_views;
                    const status = row.status === "NULL" ? null : row.status;
                    const payout = row.payout === "NULL" ? null : row.payout;
                    const per_click_value = row.per_click_value === "NULL" ? null : row.per_click_value;
                    const views = row.views === "NULL" ? null : row.views;
                    const datetime = row.date_time === "NULL" ? null : row.date_time;
                    const views_amount = row.views_amount === "NULL" ? null : row.views_amount;

                    const newCampaign = {
                        default_campaign_id: default_campaign_id,
                        title: row.title,
                        description: row.description,
                        ads_url: row.ads_url,
                        image: row.image,
                        no_of_views: no_of_views,
                        duration: row.duration,
                        pid: pid,
                        status: status,
                        datetime: datetime,
                        country: row.country,
                        payout: payout,
                        per_click_value: per_click_value,
                        views: views,
                        views_amount: views_amount
                    };
                    campaigns.push(newCampaign);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < campaigns.length; i += batchSize) {
                        const batch = campaigns.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (campaign) => {
                                const campaigns_pid = campaign.pid;

                                // Get offer data from cache
                                const userData = userCache[campaigns_pid] || {
                                    user_id: null,
                                    pid: null,
                                };
                                campaign.publisher_data = userData;

                                return campaign;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await Campaign.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

migrationRouter.get('/campaignProcessMigration', async (req, res) => {
    const campaignProcessFilePath = path.join(__dirname, '../../migration-tables/campaign_process.csv');
    const batchSize = 1000; // Batch size for database insertion
    let campaignProcesses = [];
    const startTime = performance.now();

    try {

        // Cache User data to minimize database queries
        const userCache = {};
        const users = await User.find({});
        users.forEach((user) => {
        userCache[user.uid] = {
            user_id: user._id,
            pid: user.uid,
            };
        });

        // Cache campaign data to minimize database queries
        const offerCache = {};
        const campaigns = await Campaign.find({});
        campaigns.forEach((campaign) => {
            offerCache[campaign.default_campaign_id] = {
            camp_id: campaign._id,
            default_camp_id: campaign.default_campaign_id,
            camp_name: campaign.title,
            };
        });
        
        // Cache App data to minimize database queries
        const appCache = {};
        const apps = await App.find({});
        apps.forEach((app) => {
            appCache[app.default_app_id] = {
                app_id: app._id,
                default_app_id: app.default_app_id,
                app_name: app.app_name,
            };
        });

        // Read the CSV file and parse it
        fs.createReadStream(campaignProcessFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const default_camp_id = row.camp_id === "NULL" ? null : row.camp_id;
                    const pid = row.pid === "NULL" ? null : row.pid;
                    const no_of_views = row.no_of_views === "NULL" ? null : row.no_of_views;
                    const status = row.status === "NULL" ? null : row.status;
                    const payout = row.payout === "NULL" ? null : row.payout;
                    const per_click_value = row.per_click_value === "NULL" ? null : row.per_click_value;
                    const views = row.views === "NULL" ? null : row.views;
                    const views_amount = row.views_amount === "NULL" ? null : row.views_amount;
                    const default_app_id = row.app_id === "NULL" ? null : row.app_id;

                    const newCampaignProcess = {
                        default_camp_id: default_camp_id,
                        title: row.title,
                        description: row.description,
                        ads_url: row.ads_url,
                        image: row.image,
                        no_of_views: no_of_views,
                        duration: row.duration,
                        pid: pid,
                        status: status,
                        datetime: parseDate(row.datetime),
                        completed_datetime: parseDate(row.completed_datetime),
                        reversed_datetime: parseDate(row.reversed_datetime),
                        country: row.country,
                        payout: payout,
                        per_click_value: per_click_value,
                        views: views,
                        views_amount: views_amount,
                        code: row.code,
                        sid: row.sid,
                        sid2: row.sid2,
                        sid3: row.sid3,
                        sid4: row.sid4,
                        sid5: row.sid5,
                        ip: row.ip,
                        source: row.source,
                        user_agent: row.user_agent,
                        default_app_id: default_app_id
                    };
                    campaignProcesses.push(newCampaignProcess);
                } catch (error) {
                    console.error('Error parsing row:', error.message);
                }
            })
            .on('end', async () => {
                try {
                    // Process offers in batches
                    for (let i = 0; i < campaignProcesses.length; i += batchSize) {
                        const batch = campaignProcesses.slice(i, i + batchSize);
                        const processedBatch = await Promise.all(
                            batch.map(async (campaignProcess) => {
                                const campaign_process_pid = campaignProcess.pid;
                                const campaign_process_camp_id = campaignProcess.default_camp_id;
                                const campaign_process_app_id = campaignProcess.default_app_id;

                                // Get offer data from cache
                                const userData = userCache[campaign_process_pid] || {
                                    user_id: null,
                                    pid: null,
                                };
                                campaignProcess.publisher_data = userData;

                                 // Get campaign data from cache
                                 const offerData = offerCache[campaign_process_camp_id] || {
                                    camp_id: null,
                                    default_camp_id: null,
                                    camp_name: null,
                                };
                                campaignProcess.campaign_data = offerData;
                                campaignProcess.camp_id = offerData.camp_id;

                                // Get app data from cache
                                const appData = appCache[campaign_process_app_id] || {
                                    app_id: null,
                                    default_app_id: null,
                                    app_name: null
                                };
                                campaignProcess.app_data = appData;
                                campaignProcess.app_id = appData.app_id;

                                return campaignProcess;
                            })
                        );
                        // console.log('event : ', processedBatch);
                        

                        // Insert processed batch into MongoDB
                        await CampaignProcess.insertMany(processedBatch);
                    }

                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const msg = `CSV file migrated successfully in ${duration.toFixed(2)} milliseconds.`;
                    const result = makeApiResponse(msg, 1, StatusCodes.OK);
                    res.status(StatusCodes.OK).json(result);
                } catch (error) {
                    console.error('Error during migration:', error.message);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
                }
            })
            .on('error', (err) => {
                console.error('Error reading the file:', err.message);
                const msg = 'Error reading the CSV file';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            });
    } catch (error) {
        console.error('Error initializing migration:', error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
});

export default migrationRouter;
