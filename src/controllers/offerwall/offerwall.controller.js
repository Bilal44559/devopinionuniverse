import mongoose from 'mongoose';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import userService from "../../services/user.service.js";
import Offer from '../../models/offers.model.js';
import User from '../../models/user.model.js';
import App from '../../models/apps.model.js';
import OfferWallApiKey from '../../models/offerwallapikeys.model.js';
import OfferProcess from '../../models/offerprocess.model.js';
import geoip from 'geoip-lite';
import path from 'path';
import fs from 'fs';
import { sendEmail } from '../../lib/mail.js';
import { checkValidEmail } from '../../lib/utils.js';
import ContactMessage from '../../models/contactMessages.model.js';
import PublisherHiddenOffer from '../../models/publisher_hidden_offers.model.js';
import BannedOffer from '../../models/bannedOffers.model.js';
import LiveServeyQuestionaireLibrary from '../../models/liveSurveyQuestionariesLibarary.model.js';
import axios from 'axios';
import UserDemography from '../../models/userDemography.model.js';
import Campaign from '../../models/campaigns.model.js';
import CampaignProcess from '../../models/campaignProcess.model.js';
import capLimit from '../../models/capLimit.model.js';
import crypto from 'crypto';
import Complaint from '../../models/complaint.model.js';


export const getIP = async (req) => {
    if (!req || !req.headers) {
        throw new Error("Request object or headers are undefined");
    }
    let ip;

    // Check if the IP is from a shared internet connection
    if (req.headers['client-ip']) {
        ip = req.headers['client-ip'];
    }
    // Check if the IP is passed from a proxy
    else if (req.headers['x-forwarded-for']) {
        // The X-Forwarded-For header can contain a comma-separated list of IPs. The first one is the client's IP.
        ip = req.headers['x-forwarded-for'].split(',').shift();
    }
    // Fallback to the remote address if no proxy is involved
    else {
        ip = req.connection.remoteAddress || req.ip;
    }
    if (ip === '::1') {
        ip = '127.0.0.1';
    }

    return ip;
};

export const getCountryByIP = async (ip) => {
    const geo = geoip.lookup(ip);
    console.log(geo);
    // return false;

    return geo ? geo.country : null;
};

export const getCountryName = async (countryCode) => {
    // Use a map or package to translate country codes to country names
    const countryNames = {
        'AF': 'Afghanistan',
        'AL': 'Albania',
        'DZ': 'Algeria',
        'AS': 'American Samoa',
        'AD': 'Andorra',
        'AO': 'Angola',
        'AI': 'Anguilla',
        'AQ': 'Antarctica',
        'AG': 'Antigua and Barbuda',
        'AR': 'Argentina',
        'AM': 'Armenia',
        'AW': 'Aruba',
        'AU': 'Australia',
        'AT': 'Austria',
        'AZ': 'Azerbaijan',
        'BS': 'Bahamas',
        'BH': 'Bahrain',
        'BD': 'Bangladesh',
        'BB': 'Barbados',
        'BY': 'Belarus',
        'BE': 'Belgium',
        'BZ': 'Belize',
        'BJ': 'Benin',
        'BM': 'Bermuda',
        'BT': 'Bhutan',
        'BO': 'Bolivia',
        'BA': 'Bosnia and Herzegovina',
        'BW': 'Botswana',
        'BR': 'Brazil',
        'IO': 'British Indian Ocean Territory',
        'BN': 'Brunei Darussalam',
        'BG': 'Bulgaria',
        'BF': 'Burkina Faso',
        'BI': 'Burundi',
        'CV': 'Cabo Verde',
        'KH': 'Cambodia',
        'CM': 'Cameroon',
        'CA': 'Canada',
        'KY': 'Cayman Islands',
        'CF': 'Central African Republic',
        'TD': 'Chad',
        'CL': 'Chile',
        'CN': 'China',
        'CO': 'Colombia',
        'KM': 'Comoros',
        'CG': 'Congo',
        'CD': 'Congo, Democratic Republic of the',
        'CR': 'Costa Rica',
        'CI': 'Côte d\'Ivoire',
        'HR': 'Croatia',
        'CU': 'Cuba',
        'CY': 'Cyprus',
        'CZ': 'Czech Republic',
        'DK': 'Denmark',
        'DJ': 'Djibouti',
        'DM': 'Dominica',
        'DO': 'Dominican Republic',
        'EC': 'Ecuador',
        'EG': 'Egypt',
        'SV': 'El Salvador',
        'GQ': 'Equatorial Guinea',
        'ER': 'Eritrea',
        'EE': 'Estonia',
        'SZ': 'Eswatini',
        'ET': 'Ethiopia',
        'FJ': 'Fiji',
        'FI': 'Finland',
        'FR': 'France',
        'GF': 'French Guiana',
        'PF': 'French Polynesia',
        'GA': 'Gabon',
        'GM': 'Gambia',
        'GE': 'Georgia',
        'DE': 'Germany',
        'GH': 'Ghana',
        'GI': 'Gibraltar',
        'GR': 'Greece',
        'GL': 'Greenland',
        'GD': 'Grenada',
        'GP': 'Guadeloupe',
        'GU': 'Guam',
        'GT': 'Guatemala',
        'GN': 'Guinea',
        'GW': 'Guinea-Bissau',
        'GY': 'Guyana',
        'HT': 'Haiti',
        'HN': 'Honduras',
        'HK': 'Hong Kong',
        'HU': 'Hungary',
        'IS': 'Iceland',
        'IN': 'India',
        'ID': 'Indonesia',
        'IR': 'Iran',
        'IQ': 'Iraq',
        'IE': 'Ireland',
        'IL': 'Israel',
        'IT': 'Italy',
        'JM': 'Jamaica',
        'JP': 'Japan',
        'JO': 'Jordan',
        'KZ': 'Kazakhstan',
        'KE': 'Kenya',
        'KI': 'Kiribati',
        'KP': 'Korea, Democratic People\'s Republic of',
        'KR': 'Korea, Republic of',
        'KW': 'Kuwait',
        'KG': 'Kyrgyzstan',
        'LA': 'Lao People\'s Democratic Republic',
        'LV': 'Latvia',
        'LB': 'Lebanon',
        'LS': 'Lesotho',
        'LR': 'Liberia',
        'LY': 'Libya',
        'LI': 'Liechtenstein',
        'LT': 'Lithuania',
        'LU': 'Luxembourg',
        'MO': 'Macao',
        'MG': 'Madagascar',
        'MW': 'Malawi',
        'MY': 'Malaysia',
        'MV': 'Maldives',
        'ML': 'Mali',
        'MT': 'Malta',
        'MH': 'Marshall Islands',
        'MQ': 'Martinique',
        'MR': 'Mauritania',
        'MU': 'Mauritius',
        'YT': 'Mayotte',
        'MX': 'Mexico',
        'FM': 'Micronesia',
        'MD': 'Moldova, Republic of',
        'MC': 'Monaco',
        'MN': 'Mongolia',
        'ME': 'Montenegro',
        'MS': 'Montserrat',
        'MA': 'Morocco',
        'MZ': 'Mozambique',
        'MM': 'Myanmar',
        'NA': 'Namibia',
        'NR': 'Nauru',
        'NP': 'Nepal',
        'NL': 'Netherlands',
        'NC': 'New Caledonia',
        'NZ': 'New Zealand',
        'NI': 'Nicaragua',
        'NE': 'Niger',
        'NG': 'Nigeria',
        'NU': 'Niue',
        'NF': 'Norfolk Island',
        'MP': 'Northern Mariana Islands',
        'NO': 'Norway',
        'OM': 'Oman',
        'PK': 'Pakistan',
        'PW': 'Palau',
        'PS': 'Palestine, State of',
        'PA': 'Panama',
        'PG': 'Papua New Guinea',
        'PY': 'Paraguay',
        'PE': 'Peru',
        'PH': 'Philippines',
        'PL': 'Poland',
        'PT': 'Portugal',
        'PR': 'Puerto Rico',
        'QA': 'Qatar',
        'RO': 'Romania',
        'RU': 'Russian Federation',
        'RW': 'Rwanda',
        'RE': 'Réunion',
        'BL': 'Saint Barthélemy',
        'SH': 'Saint Helena, Ascension and Tristan da Cunha',
        'KN': 'Saint Kitts and Nevis',
        'LC': 'Saint Lucia',
        'MF': 'Saint Martin (French part)',
        'PM': 'Saint Pierre and Miquelon',
        'VC': 'Saint Vincent and the Grenadines',
        'WS': 'Samoa',
        'SM': 'San Marino',
        'ST': 'Sao Tome and Principe',
        'SA': 'Saudi Arabia',
        'SN': 'Senegal',
        'RS': 'Serbia',
        'SC': 'Seychelles',
        'SL': 'Sierra Leone',
        'SG': 'Singapore',
        'SX': 'Sint Maarten (Dutch part)',
        'SK': 'Slovakia',
        'SI': 'Slovenia',
        'SB': 'Solomon Islands',
        'SO': 'Somalia',
        'ZA': 'South Africa',
        'SS': 'South Sudan',
        'ES': 'Spain',
        'LK': 'Sri Lanka',
        'SD': 'Sudan',
        'SR': 'Suriname',
        'SE': 'Sweden',
        'CH': 'Switzerland',
        'SY': 'Syrian Arab Republic',
        'TW': 'Taiwan, Province of China',
        'TJ': 'Tajikistan',
        'TZ': 'Tanzania, United Republic of',
        'TH': 'Thailand',
        'TL': 'Timor-Leste',
        'TG': 'Togo',
        'TK': 'Tokelau',
        'TO': 'Tonga',
        'TT': 'Trinidad and Tobago',
        'TN': 'Tunisia',
        'TR': 'Turkey',
        'TM': 'Turkmenistan',
        'TV': 'Tuvalu',
        'UG': 'Uganda',
        'UA': 'Ukraine',
        'AE': 'United Arab Emirates',
        'GB': 'United Kingdom',
        'US': 'United States of America',
        'UY': 'Uruguay',
        'UZ': 'Uzbekistan',
        'VU': 'Vanuatu',
        'VE': 'Venezuela',
        'VN': 'Viet Nam',
        'VG': 'Virgin Islands (British)',
        'VI': 'Virgin Islands (U.S.)',
        'YE': 'Yemen',
        'ZM': 'Zambia',
        'ZW': 'Zimbabwe'
    };

    return countryNames[countryCode] || 'Unknown';
};

function sanitize(input) {
    if (typeof input === 'string') {
        return input.replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, '\\$&'); // Escapes dangerous characters
    }
    return input;
}

export default {

    offerWallStats: async (req, res) => {
        try {
            let msg;
            const { uid, sid } = req.body;
            if (!uid || !sid) {
                msg = 'record not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const records = [];
            const record = await OfferProcess.aggregate([
                {
                    $match: { uid, sid }
                },
                {
                    $group: {
                        _id: null,
                        totalCompletedClicks: {
                            $sum: { $cond: [{ $eq: ['$status', 1] }, 1, 0] }
                        },
                        totalReversedClicks: {
                            $sum: { $cond: [{ $eq: ['$status', 2] }, 1, 0] }
                        }
                    }
                }
            ]);
            let totalCompletedClicks = 0;
            let totalReversedClicks = 0;
            let userRankValue = 0;
            if (record.length > 0) {
                ({ totalCompletedClicks, totalReversedClicks } = record[0]);
                userRankValue = totalCompletedClicks > 0 ? Math.round(((totalCompletedClicks - totalReversedClicks) / totalCompletedClicks) * 100) : 0;
            }
            records.push({
                Completed_leads: totalCompletedClicks,
                Reversed_leads: totalReversedClicks,
                Total_score: userRankValue
            });
            msg = 'offerwall stats.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, records);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getOfferWallModel: async (req, res) => {
        try {
            let msg;
            let { offer_id, device } = req.body;
            const offer = await Offer.findOne({ offer_id: offer_id });
            if (!offer) {
                msg = 'Offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let browsers = offer.browsers;
            if (browsers == 'Android' && (device == 'Windows' || device == 'Mac' || device == 'IOS')) {
                const offerId = offer.offer_id;
                const name = offer.name;
                const desc = offer.description;
                const requirements = offer.offer_requirements;
                const network = offer.network;
                const link = offer.link;
                const image = offer.image_url;
                const payout = offer.credits;
                const category = offer.categories;
                const events = JSON.parse(offer.adgatemedia_events);
                const points = events.map(event => event.points);
                const totalPoints = points.reduce((acc, curr) => acc + curr, 0);
                msg = 'Get OfferWall Offer successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, { offerId, name, image, totalPoints, desc, requirements, network, browsers, category, points, events, device, link, payout });
                return res.status(StatusCodes.OK).json(result);
            } else if ((browsers == 'CPE' || browsers == 'iPhone' || browsers == 'iPad' || browsers == 'iPhone|iPad' || browsers == 'iPad|iPhone') && (device == 'Windows' || device == 'Mac' || device == 'Android')) {
                const offerId = offer.offer_id;
                const name = offer.name;
                const desc = offer.description;
                const requirements = offer.offer_requirements;
                const network = offer.network;
                const link = offer.link;
                const image = offer.image_url;
                const payout = offer.credits;
                browsers = 'IOS';
                const category = offer.categories;
                const events = JSON.parse(offer.adgatemedia_events);
                const points = events.map(event => event.points);
                const totalPoints = points.reduce((acc, curr) => acc + curr, 0);
                msg = 'Get OfferWall Offer successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, { offerId, name, image, totalPoints, desc, requirements, network, browsers, category, points, events, device, link, payout });
                return res.status(StatusCodes.OK).json(result);
            } else {
                const offerId = offer.offer_id;
                const name = offer.name;
                const desc = offer.description;
                const requirements = offer.offer_requirements;
                const network = offer.network;
                const link = offer.link;
                const image = offer.image_url;
                const payout = offer.credits;
                browsers = 'unknown';
                device = 'unknown';
                const category = offer.categories;
                const events = JSON.parse(offer.adgatemedia_events);
                const points = events.map(event => event.points);
                const totalPoints = points.reduce((acc, curr) => acc + curr, 0);
                msg = 'Get OfferWall Offer successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, { offerId, name, image, totalPoints, desc, requirements, network, browsers, category, points, events, device, link, payout });
                return res.status(StatusCodes.OK).json(result);
            }

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }

    },

    sendEmailOfferWall: async (req, res) => {
        try {
            let msg;
            let { offer_id, email, device, uid, ip, sid, sid2, sid3, sid4, sid5, app_id, credits } = req.body;

            const values = {
                offer_id: offer_id ?? '',
                uid: uid,
                ip: ip,
                sid: sid,
                sid2: sid2,
                sid3: sid3,
                sid4: sid4,
                sid5: sid5,
                app_id: app_id ?? null, // ID_9ef48bc73330ffba9179cc6c8d025655
                credits: credits ?? 0,
            }


            const queryParams = new URLSearchParams(values);
            const url = `http://localhost:5173/click-offer?${queryParams.toString()}`;


            //   const userAgent = req.headers['user-agent'];
            //   let device = 'Unknown';
            //   if (userAgent.includes('Android')) {
            //       device = 'Android';
            //   } else if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) {
            //       device = 'IOS';
            //   } else if (userAgent.includes('Windows')) {
            //       device = 'Windows';
            //   } else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) {
            //       device = 'Mac';
            //   } else if (userAgent.includes('Linux')) {
            //       device = 'Linux';
            //   }   else{
            //       device = 'unknown';
            //   }


            const offer = await Offer.findOne({ _id: offer_id });
            if (!offer) {
                msg = 'Offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let browsers = offer.browsers;
            let name, desc, events, points, totalPoints;
            if (browsers == 'Android' && (device == 'Windows' || device == 'Mac' || device == 'IOS')) {
                name = offer.name;
                desc = offer.offer_requirements;
                events = JSON.parse(offer.adgatemedia_events);
                points = events.map(event => event.points);
                totalPoints = points.reduce((acc, curr) => acc + curr, 0);

            } else if ((browsers == 'CPE' || browsers == 'iPhone' || browsers == 'iPad' || browsers == 'iPhone|iPad' || browsers == 'iPad|iPhone') && (device == 'Windows' || device == 'Mac' || device == 'Android')) {
                name = offer.name;
                desc = offer.offer_requirements;
                events = JSON.parse(offer.adgatemedia_events);
                points = events.map(event => event.points);
                totalPoints = points.reduce((acc, curr) => acc + curr, 0);
            } else {
                name = offer.name;
                desc = offer.offer_requirements;
                device = 'unknown';
                events = JSON.parse(offer.adgatemedia_events);
                points = events.map(event => event.points);
                totalPoints = points.reduce((acc, curr) => acc + curr, 0);
            }

            const filePath = path.join("", "", "src", "views", "emails", "offerwall-mail.html");

            fs.readFile(filePath, 'utf8', (err, htmlContent) => {
                if (err) {
                    console.error('Error reading HTML file:', err);
                    return;
                }

                htmlContent = htmlContent.replace('{{name}}', name)
                    .replace('{{desc}}', desc)
                    .replace('{{device}}', device)
                    .replace('{{totalPoints}}', totalPoints)
                    .replace('{{url}}', url);

                const options = {
                    email: email,
                    subject: "Opinion Universe",
                    html: htmlContent,
                };

                sendEmail(options);
            });
            msg = 'Email delivered successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAllOfferWall: async (req, res) => {
        try {
            let msg;
            let { page, limit, sid, uid, app_id, type, ip } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;

            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (!uid) {
                msg = 'Invalid Publisher.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let filter = { active: true, epc: { $exists: true }, deleted_bit: 0, categories: { $ne: 'Survey' } };
            const cc = await getCountryByIP(ip);
            const countryFullName = await getCountryName(cc);
            if (cc) {
                filter.$or = [
                    { countries: new RegExp(cc, 'i') },
                    { countries: 'All' }
                ];
            }

            if (type === 'IOS') {
                filter.browsers = { $in: ['iPad', 'iPhone', 'iPad|iPhone', 'iPhone|iPad'] };
            } else if (type === 'Android') {
                filter.browsers = { $in: ['Android', 'Android|Android'] };
            } else {
                filter.browsers = { $in: ['Android', 'Android|Android', 'All'] };
            }
            const campaignIds = await OfferProcess.find({ uid: uid, sid: sid, status: 1 }).distinct('campaign_id');
            const offers = await Offer.find({
                ...filter,
                campaign_id: { $nin: campaignIds },
            });
            const filteredOffers = offers.filter(offer => {
                if (offer.limit === 0) {
                    return true;
                }
                return offer.hits < offer.limit;
            });
            const totalOffers = filteredOffers.length;
            if (totalOffers === 0 || (page - 1) * limit >= totalOffers) {
                msg = 'No offers found for the specified page.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const paginatedOffers = filteredOffers.slice((page - 1) * limit, page * limit);
            if (paginatedOffers.length === 0) {
                msg = 'Offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const totalPages = Math.ceil(totalOffers / limit);
            msg = 'Get all Offers successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                filteredTotalOffers: totalOffers,
                offers: paginatedOffers,
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },


    getSurveyOfferWall: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;

            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const sid = req.body.sid;
            const uid = req.body.uid;
            const app_id = req.body.app_id;
            const ip = req.body.ip;
            if (!uid) {
                msg = 'Invalid Publisher.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const cc = await getCountryByIP(ip);
            const countryFullName = await getCountryName(cc);
            let filter = { active: true, epc: { $exists: true } };
            if (cc) {
                filter.$or = [
                    { countries: new RegExp(cc, 'i') },
                    { countries: 'All' }
                ];
            }
            let category = 'Survey';
            if (category) {
                filter.categories = category;
            } else {
                msg = 'Category not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const campaignIds = await OfferProcess.find({ uid: uid, sid: sid, status: 1 }).distinct('campaign_id');
            const offers = await Offer.find({
                ...filter,
                campaign_id: { $nin: campaignIds },
            });
            const filteredOffers = offers.filter(offer => {
                if (offer.limit === 0) {
                    return true;
                }
                return offer.hits < offer.limit;
            });
            const totalOffers = filteredOffers.length;
            if (totalOffers === 0 || (page - 1) * limit >= totalOffers) {
                msg = 'No offers found for the specified page.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const paginatedOffers = filteredOffers.slice((page - 1) * limit, page * limit);
            if (paginatedOffers.length === 0) {
                msg = 'Offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const totalPages = Math.ceil(totalOffers / limit);
            msg = 'Get all Offers successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                filteredTotalOffers: totalOffers,
                offers: paginatedOffers,
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getAdsOfferwall: async (req, res) => {
        try {
            let msg;
            let { page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;

            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const sid = req.body.sid;
            const uid = req.body.uid;
            const appid = req.body.appid;
            const ip = req.body.ip;
            if (!uid) {
                msg = 'Invalid Publisher.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let filter = { status: 1 };
            const cc = await getCountryByIP(ip);
            const countryFullName = await getCountryName(cc);
            if (cc) {
                filter.$or = [
                    { country: new RegExp(cc, 'i') },
                    { country: 'all' }
                ];
            }
            const campaignIds = await CampaignProcess.find({ uid: uid, sid: sid, status: 1 }).distinct('campaign_id');
            const campaigns = await Campaign.find({
                ...filter,
                campaign_id: { $nin: campaignIds },
            });
            const filteredCampaigns = campaigns.filter(campaign => campaign.views < campaign.no_of_views);
            const totalOffers = filteredCampaigns.length;
            if (totalOffers === 0 || (page - 1) * limit >= totalOffers) {
                msg = 'No offers found for the specified page.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const paginatedCampaigns = filteredCampaigns.slice((page - 1) * limit, page * limit);
            if (paginatedCampaigns.length === 0) {
                msg = 'Campaign not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const totalPages = Math.ceil(totalOffers / limit);
            msg = 'Get all Offers successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                filteredTotalOffers: totalOffers,
                offers: paginatedCampaigns
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }

    },

    clickOffer: async (req, res) => {
        let msg;
        const {
            offer_id,
            ip,
            sid,
            sid2,
            sid3,
            sid4,
            sid5,
            app_id,
            country,
            credits,
            ref_credits,
            referrer_url,
            user_agent,
            uid
        } = req.body;

        const userExist = await User.findOne({ _id: uid });
        if (!userExist) {
            msg = 'User not found.';
            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
            return res.status(StatusCodes.BAD_REQUEST).json(result);
        }

        // if (!mongoose.isValidObjectId(offer_id)) {
        //     msg = 'Invalid Offer ID format.';
        //     const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
        //     return res.status(StatusCodes.BAD_REQUEST).json(result);
        // }
        if (!offer_id) {
            msg = 'Offer ID not found.';
            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
            return res.status(StatusCodes.BAD_REQUEST).json(result);
        }

        const offer = await Offer.findOne({ _id: offer_id });
        if (!offer) {
            msg = 'Sorry the offer not available.';
            const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
            return res.status(StatusCodes.BAD_REQUEST).json(result);
        }
        const todayDate = new Date().toISOString().split('T')[0];
        const cap_limit = await capLimit.findOne({ uid: uid });
        if (cap_limit) {
            const limit = cap_limit.limit;
            const offers = cap_limit.offer;

            console.log("limit  ", limit);
            console.log("offers  ", offers);
            if (Array.isArray(offers) && offers.includes('All')) {
                const publisher_limit = await OfferProcess.countDocuments({ uid: uid, status: 1, date: { $gte: new Date(todayDate), $lt: new Date(new Date(todayDate).setDate(new Date(todayDate).getDate() + 1)) } });
                console.log("offer process for all  ", publisher_limit);
                if (publisher_limit >= limit) {
                    msg = `Sorry, you have reached your limit of ${limit} offers for today's date. You have completed ${publisher_limit} offers. Please communicate with the administrator.`;
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            } else if (Array.isArray(offers)) {
                for (const offerId of offers) {
                    const publisher_limit = await OfferProcess.countDocuments({
                        uid: uid, offer_id: offerId,
                        status: 1, date: { $gte: new Date(todayDate), $lt: new Date(new Date(todayDate).setDate(new Date(todayDate).getDate() + 1)) }
                    });
                    console.log("offer process   ", publisher_limit);
                    if (publisher_limit >= limit) {
                        msg = `Sorry, you have reached your limit of ${limit} offers for today's date. You have completed ${publisher_limit} offers. Please communicate with the administrator.`;
                        const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                        return res.status(StatusCodes.BAD_REQUEST).json(result);
                    }
                }
            }
        } else {
            const limit = 50;
            const publisher_limit = await OfferProcess.countDocuments({ uid: uid, offer_id: offer_id, status: 1, date: { $gte: new Date(todayDate), $lt: new Date(new Date(todayDate).setDate(new Date(todayDate).getDate() + 1)) } });
            if (publisher_limit >= limit) {
                msg = `Sorry, you have reached your limit of ${limit} offers for today's date. You have completed ${publisher_limit} offers. Please communicate with the administrator.`;
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
        }



        // const credits = offer.credits * (70 / 100);
        // const ref_credits = credits * (30 / 100);

        const randomNumber = Math.floor(Math.random() * 10000000000);
        const hashtag = crypto.createHash('md5')
            .update(`${Date.now()}${randomNumber}`)
            .digest('hex');
        const start = Math.floor(Math.random() * 5);
        const hash = hashtag.substring(start, start + 25);
        let placement_id = null;
        if (app_id && app_id !== 'null') {
            const app = await App.findOne({ uid: uid, unique_id: app_id });
            if (!app) {
                msg = 'App id does not exit.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            placement_id = app._id;
        }

        const offerProcess = new OfferProcess({
            // campaign_id: offer.campaign_id,
            campaign_id: offer._id,
            offer_name: offer.name,
            offer_description: offer.description,
            offer_link: offer.link,
            offer_category: offer.categories,
            offer_browsers: offer.browsers,
            offer_preview: offer.preview,
            offer_adgatemedia_events: offer.adgatemedia_events,
            offer_requirements: offer.offer_requirements,
            offer_image_url: offer.image_url,
            offer_preview_url: offer.offer_preview_url,
            uid: uid,
            code: hash,
            status: 0,
            date: new Date(),
            ip: ip,
            credits: credits,
            ref_credits: ref_credits,
            network: offer.network,
            offer_id: offer._id,
            // link_id: linkId,
            link_id: 0,
            gw_id: 0,
            credit_mode: 'default',
            country: country,
            source: referrer_url,
            unique: 1,
            user_agent: user_agent,
            sid: sid,
            sid2: sid2,
            sid3: sid3,
            sid4: sid4,
            sid5: sid5,
            total_success_credit: 0.00,
            app_id: placement_id
        });
        await offerProcess.save();

        offer.hits = offer.hits + 1;
        await offer.save();

        let q = '';
        let offerLink = offer.link;
        let global = '';
        let params = '';
        switch (offer.network) {
            case 'Adscendmedia':
                q = `&sub1=${hash}&sub2=${uid}`;
                break;
            case 'CPALead':
                q = `&subid=${uid}-${hash}`;
                break;
            case 'Adgatemedia':
                q = `&s1=${hash}`;
                break;
            case 'Adworkmedia':
            case 'adworkmedia':
                q = `&sid=${uid}&sid2=${hash}`;
                break;
            case 'BlueTrackMedia':
                q = `&sid=${uid}-${hash}`;
                break;
            case 'TestNetwork':
                q = `?sub=${uid}-${hash}&campid=${offer.campaign_id}`;
                break;
            case 'RevenueHut':
                q = `${uid}/${hash}`;
                break;
            case 'RedFireNetwork':
                q = '';
                break;
            case 'Admantium':
            case 'Admantium2':
                q = `&aff_sub=${hash}&aff_sub2=${uid}`;
                break;
            case 'User':
                q = '';
                break;
            case 'CPAGrip':
                q = `&tracking_id=${uid}-${hash}`;
                break;
            case 'Capital':
                q = `&username=${hash}&sid2=${uid}`;
                break;
            case 'inovatedm':
            case 'Cpamerchant':
                q = `&aff_sub=${hash}&aff_sub2=${uid}`;
                break;
            case 'Wannads':
                q = `&userId=${hash}&sub_id2=${uid}`;
                break;
            case 'rom':
                offerLink = offer.link.replace("[transaction_id]", hash).replace("[publisher_id]", uid);
                global = 'yes';
                return;
            case 'fusion':
                q = `?maxLoi=25&supplierSessionId=${hash}`;
                break;
            case 'Paneland':
                const low_country = country.toLowerCase();
                q = `?mid=24322aefb3d9a4412023d44c9b4542b4&country=${low_country}&P_uid=${hash}`;
                break;
            case 'Yuno':
                q = `&pparam_puuid=${hash}&pparam_pupid=${uid}`;
                offerLink = offer.link + q;
                offerLink = offerLink.replace("[transaction_id]", hash);
                global = 'yes';
                return;
            case 'Torox':
                offerLink = offer.link.replace('[USER_ID]', hash).replace('[tag]', uid);
                break;
            case 'Farly':
                offerLink = offer.link.replace('[YOUR_CLICK_ID]', hash).replace('[YOUR_PUBLISHER_ID]', uid);
                if (offerLink.includes('[IDFA]')) {
                    offerLink = offerLink.replace('[IDFA]', offer_id);
                }

                if (offerLink.includes('[GAID]')) {
                    offerLink = offerLink.replace('[GAID]', offer_id);
                }
                break;
            default:
                const param = params.replace(/=|&/g, "");
                offerLink = !offer.link.includes("?") ? `${offer.link}?${param}=${uid}-${hash}` : `${offer.link}&${param}=${uid}-${hash}`;
                global = 'yes';
                return;
        }

        if (offer.network === 'Torox') {
            // offerLink = offer.link;
            offerLink = offerLink.replace('[USER_ID]', hash);
            offerLink = offerLink.replace('[tag]', uid);
        }


        if (offer.network === 'Adgatemedia') {
            // offerLink = offer.link;
            offerLink = offerLink.replace(/s1=&|&s1=/gi, '');
        }

        if (global !== 'yes') {
            // offerLink = offer.link + q;
            offerLink = offerLink + q;
            offerLink = offerLink.replace(/&amp;/g, '&');
        }

        if (offer.network == 'Farly') {
            // offerLink = offer.link;

            offerLink = offerLink.replace('[YOUR_CLICK_ID]', hash);
            offerLink = offerLink.replace('[YOUR_PUBLISHER_ID]', uid);

            if (offerLink.includes('[IDFA]')) {
                offerLink = offerLink.replace('[IDFA]', offer_id);
            }

            if (offerLink.includes('[GAID]')) {
                offerLink = offerLink.replace('[GAID]', offer_id);
            }
        }
        console.log('offerLink: ', offerLink);

        const clickLink = `${offerLink}&pubid=${uid}&sid=${sid}&sid2=${sid2}&sid3=${sid3}&sid4=${sid4}&sid5=${sid5}&category=All`;

        msg = 'Get click offer link successfully.';
        const result = makeApiResponse(msg, 1, StatusCodes.OK, { clickLink });
        res.status(StatusCodes.OK).json(result);

    },

    adsOfferWallProcess: async (req, res) => {
        try {
            let msg;
            const { campaign_id, sid } = req.body;
            const userAgent = req.headers['user-agent'];
            // const ip = await getIP(req);
            const ip = '182.191.48.99';
            const country = await getCountryByIP(ip);
            const countryFullName = await getCountryName(country);
            const campaign = await Campaign.findOne({ _id: campaign_id, status: 1 });
            if (!campaign || campaign.status == 2) {
                msg = 'campaign not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const perClickValue = parseFloat(campaign.per_click_value);
            let viewsAmount = parseFloat(campaign.views_amount);
            if (isNaN(perClickValue) || isNaN(viewsAmount)) {
                msg = 'Invalid value for views_amount or per_click_value';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const campaignProcess = new CampaignProcess({
                camp_id: campaign._id,
                title: campaign.title,
                description: campaign.description,
                ads_url: campaign.ads_url,
                image: campaign.image,
                no_of_views: campaign.no_of_views,
                duration: campaign.duration,
                pid: campaign.pid,
                status: 1,
                datetime: new Date(),
                country: country,
                payout: campaign.payout,
                per_click_value: perClickValue,
                views: campaign.views,
                views_amount: viewsAmount,
                views: campaign.views,
                code: null,
                sid: sid,
                sid2: null,
                sid3: null,
                sid4: null,
                sid5: null,
                ip: ip,
                source: null,
                user_agent: userAgent,
                app_id: null
            });
            await campaignProcess.save();
            campaign.views += 1;
            campaign.views_amount = (viewsAmount + perClickValue).toFixed(2);
            await campaign.save();
            if (campaign.views >= campaign.no_of_views) {
                campaign.status = 2;
                await campaign.save();
            }
            msg = 'campaign processed successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, campaignProcess);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    rewardStatus: async (req, res) => {
        try {
            let msg;
            let { pubid: uid, sid, sid2, sid3, sid4, sid5, apikey, app_id, status, page, limit } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 5;

            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (!uid) {
                msg = 'Invalid Publisher';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const userExist = await User.findOne({ _id: uid });
            if (!userExist) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            // const {
            //     offerwall_ratio,
            //     firstname,
            //     lastname,
            //     offerwall_currency,
            //     primary_color,
            //     secondary_color,
            //     text_color,
            //     logo,
            //     split_currency,
            //     offer_categories
            // } = user;

            // const username = `${firstname} ${lastname}`;
            // const selectedCategories = offer_categories.split(' , ');

            // let unique_id_str = '';
            // let isOfferwallKeyMatched = 1;    
            // if (app_id) {
            //     const app = await App.findOne({ uid, unique_id: app_id });
            //     if (!app) {
            //         return res.status(404).send("Error, App id does not exist.");
            //     }

            //     // unique_id_str = `&app_id=${app.unique_id}`;
            //     unique_id_str = app.unique_id;
            //     const offerwallApiKey = app.api_key;
            //     const api_key_status = app.api_key_status;

            //     if (api_key_status && offerwallApiKey) {
            //         isOfferwallKeyMatched = apikey === offerwallApiKey ? 1 : 0;
            //     }
            // } else {
            //     const offerwallApiKeys = await OfferWallApiKey.findOne({ uid, status: true });
            //     if (offerwallApiKeys) {
            //         const { api_key } = offerwallApiKeys;
            //         isOfferwallKeyMatched = apikey === api_key ? 1 : 0;
            //     } else {
            //         isOfferwallKeyMatched = 0;
            //     }
            // }

            // if (app_id) {
            //     const app = await App.findOne({ uid, unique_id: app_id });
            //     if (app && (!app.split_currency || !app.postback_url)) {
            //         return res.status(400).send('Error, Important App settings required.');
            //     }
            // }
            let offerStatus;
            if (status === 'completed') {
                offerStatus = 1;
            } else if (status === 'continue') {
                offerStatus = 2;
            } else {
                offerStatus = 2;
            }
            const offersCount = await OfferProcess.countDocuments({ uid: uid, sid: sid, status: offerStatus });
            const totalPages = Math.ceil(offersCount / limit);
            const offers = await OfferProcess.find({ uid: uid, sid: sid, status: offerStatus })
                .sort({ _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
            const parsedOffers = [];
            for (let i = 0; i < offers.length; i++) {
                const offer = offers[i];
                let adgateMediaEvents;
                adgateMediaEvents = JSON.parse(offer.offer_adgatemedia_events);
                parsedOffers.push({
                    ...offer.toObject(),
                    offer_adgatemedia_events: adgateMediaEvents
                });
            }
            msg = 'offers';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                offersCount,
                offers: parsedOffers,
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    contact: async (req, res) => {
        try {
            let msg;
            const {
                firstName,
                lastName,
                email,
                subject,
                message
            } = req.body;

            const { error, value } = userService.validateContactData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const isValid = await checkValidEmail(email);

            if (!isValid) {
                msg = 'Invalid email address.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const name = firstName + ' ' + lastName;
            const options = {
                email: 'bilalshafique159@gmail.com',
                subject: subject,
                html: `
                ${message} <br />
                -------------------------------------------<br />
                Sender's Name is ${name}<br /><br />
                Sender's Email Address is ${email}
            `,
            };
            sendEmail(options);
            const contact = new ContactMessage({
                contact_name: name,
                contact_email: email,
                contact_subject: subject,
                contact_message: message,
                contact_date: new Date()
            });
            await contact.save();

            msg = 'Your message has been sent to our support team.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    questions: async (req, res) => {
        try {
            let msg;
            const { country_code = 'ALL', language = 'ENGLISH' } = req.body;
            const existingQuestions = await LiveServeyQuestionaireLibrary.find({ country_code, language });
            if (existingQuestions.length > 0) {
                msg = 'Already have questions.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK);
                return res.status(StatusCodes.OK).json(result);
            }
            const baseUrl = 'https://your-live-url.com/api/v2/supply/getQuestionsByCountryAndLanguage';
            const xAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MmQ3NjU3NWJhNzdhMjY1NDU0NzA3MiIsInVzcl9pZCI6NTc2NCwidXNyX3R5cGUiOiJzdXBwbGllciIsImlhdCI6MTY5NzQ3ODIzMX0.Qb6vftXJURcxAIF5Ky6BGPcaZZJd1KFlt0CEApXUa3Y';
            const response = await axios.get(`${baseUrl}/${country_code}/${language}`, {
                headers: {
                    'Accept': 'application/json',
                    'x-access-token': xAccessToken
                }
            });
            const recordsData = response.data.result;
            const values = recordsData.map(record => {
                return new LiveServeyQuestionaireLibrary({
                    question_id: record.QuestionId,
                    question_text: record.QuestionText,
                    question_type: record.QuestionType,
                    question_response: JSON.stringify(record),
                    country_code,
                    language,
                    question_key: record.QuestionKey
                });
            });
            await LiveServeyQuestionaireLibrary.insertMany(values);
            msg = 'Bulk insertion successful.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            return res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getDemographyQuestions: async (req, res) => {
        try {
            let msg;
            const {
                sid,
                pubid,
                language = 'ENGLISH'
            } = req.body;
            const response = {};
            const country = 'ALL';
            const userDemography = await UserDemography.find({ sid, pubid });
            // let userDemographyQuery = '';

            // if (userDemography.length > 0) {
            //     response.surveyProtectionPage = false;
            //     userDemography.forEach(row => {
            //         const q = row.question.replace(/'/g, "\\'");
            //         userDemographyQuery += ` AND question_text NOT LIKE '%${q}%'`;
            //     });
            // } else {
            //     response.surveyProtectionPage = true;
            // }
            const answeredQuestions = userDemography.map(row => row.question_key);
            const questionsQuery = {
                country_code: country,
                language: language,
                status: 1,
                question_key: { $nin: answeredQuestions }
            };
            const questions = await LiveServeyQuestionaireLibrary.find(questionsQuery).exec();
            if (!questions) {
                msg = 'Questions not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, questions);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    userDemography: async (req, res) => {
        try {
            let msg;
            const { questionId, sid, pubid, language = 'ENGLISH', answer } = req.body;
            const country = 'ALL';
            if (!answer) {
                msg = 'Insertion error.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const questions = await LiveServeyQuestionaireLibrary.findOne({ question_id: questionId, status: 1, country_code: country, language: language });
            if (!questions) {
                msg = 'Question not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const existingAnswer = await UserDemography.findOne({
                question_key: questions.question_key,
                sid: sid
            });

            // If an existing answer is found, skip saving and notify the user
            if (existingAnswer) {
                msg = 'Question already answered, skipping.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, existingAnswer);
                return res.status(StatusCodes.OK).json(result);
            }
            const userDemography = new UserDemography({
                pubid,
                sid,
                date: new Date(),
                status: questions.status,
                question: questions.question_text,
                answer,
                question_key: questions.question_key,
                survey_platform: questions.survey_platform
            });
            await userDemography.save();
            msg = 'successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, userDemography);
            return res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    userDemographyQuestionPercentage: async (req, res) => {
        try {
            let msg;
            const { sid, pubid } = req.body;
            const response = {};
            const totalLibraryQuestions = await LiveServeyQuestionaireLibrary.countDocuments({ status: 1 });
            if (totalLibraryQuestions >= 0) {
                response.totalNumOfLibraryQuestionCount = totalLibraryQuestions;
            } else {
                msg = 'Questions not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const totalUserDemographyCount = await UserDemography.countDocuments({ sid, pubid });
            if (totalUserDemographyCount >= 0) {
                response.totalNumOfUserDemographyCount = totalUserDemographyCount;
            } else {
                msg = 'user demography Questions not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (response.totalNumOfUserDemographyCount < response.totalNumOfLibraryQuestionCount) {
                response.user_demography_ratio = Math.round((response.totalNumOfUserDemographyCount / response.totalNumOfLibraryQuestionCount) * 100);
            } else {
                response.user_demography_ratio = 100;
            }
            msg = 'successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, response);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    offerWalls: async (req, res) => {
        try {
            let msg;
            const {
                uid,
                camp_id
            } = req.body;
            const offers = Offer.find({ campaign_id: camp_id });
            if (!offers) {
                msg = 'Offer not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let name = offers.name;
            let desc = offers.description;
            let network = offers.network;
            let active = offers.active;
            let offerId = offers.offer_id;
            let campaignId = offers.campaign_id;
            let credit = offers.credits;
            let hits = offers.hits;
            let leads = offers.leads;
            let deleted_bit = offers.deleted_bit;
            let epc = offers.epc;
            let views = offers.views;
            let no_of_views = offers.no_of_views;
            let view_amount = offers.view_amount;
            let limit = offers.limit;
            let preview = offers.preview;
            let per_click_value = offers.per_click_value;
            let event = offers.adgatemedia_events;
            const offerProces = OfferProcess.find({ uid: uid, campaign_id: camp_id });
            if (offerProces) {
                offers == offerProces;
                offers.count;
                offers.skip;
            }
            let offer = [];
            offer.push({
                name: name,
                description: desc,
                offerId: offerId,
                campaignId: campaignId,
                network: network,
                credit: credit,
                hit: hits,
                lead: leads,
                limit: limit,
                views: views,
                no_of_views: no_of_views,
                view_amount: view_amount,
                per_click_value: per_click_value,
                preview: preview,
                event: event,
                epc: epc,
                active: active,
                deleted_bit: deleted_bit
            });
            msg = 'Get Offers successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, { offer });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            return res.status(StatusCodes.error.message);
        }
    },

    sendComplaint: async (req, res) => {
        try {
            
            let imagePath = '';
            if (req.file) {
                imagePath = req.file.filename;
            } else {
                msg = 'Complaint file is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
                const {
                    first_name,
                    last_name,
                    email,
                    subject,
                    message,
                    complaint_section_type,
                    pubid,
                    sid,
                    app_id,
                } = req.body;
    
                // Validate required fields
                if (!first_name || !last_name || !email || !subject || !message || !pubid || !sid || !app_id) {
                    const result = makeApiResponse('All fields are required.', 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
    
                const name = `${first_name} ${last_name}`;
    
                // Insert into the database
                const newComplaint = new Complaint({
                    complaint_name: name,
                    complaint_type: complaint_section_type,
                    complaint_email: email,
                    complaint_subject: subject,
                    complaint_message: message,
                    complaint_file: imagePath,
                    complaint_date: new Date(),
                    pub_id: pubid,
                    sid,
                    app_id,
                });
    
                await newComplaint.save();
    
                const msg = 'Your message has been sent to our support team.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, newComplaint);
                return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: error.message,
            });
        }

    },


};
