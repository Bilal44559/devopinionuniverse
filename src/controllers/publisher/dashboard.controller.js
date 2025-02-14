import Offer from "../../models/offers.model.js";
import BannedOffer from "../../models/bannedOffers.model.js";
import PublisherHiddenOffer from "../../models/publisher_hidden_offers.model.js";
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import User from "../../models/user.model.js";
import CampaignProcess from "../../models/campaignProcess.model.js";
import OfferProcess from "../../models/offerprocess.model.js";
import App from '../../models/apps.model.js';
import Transaction from "../../models/transactions.model.js";
import moment from 'moment';
import { DateTime } from 'luxon';
import dashboardController from './dashboard.controller.js';

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

export default {

    dashboard: async (req, res) => {
        try {
            let msg;
            const { start_date, end_date} = req.body;
            const dashboardStats = await dashboardController.dashboardStats(req);
            const sevenDaysStats = await dashboardController.sevenDaysStats(req);
            const worldMapQuery = await dashboardController.worldMapQuery(req, start_date, end_date);
            const topPerformingOffers = await dashboardController.topPerformingOffers(req);
            const latestConversion = await dashboardController.latestConversion(req);
            const latestAdsConversion = await dashboardController.latestAdsConversion(req);
            msg = 'Dashboard';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                dashboardStats,
                sevenDaysStats,
                worldMapQuery,
                topPerformingOffers,
                latestConversion,
                latestAdsConversion
            });
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    dashboardStats: async (req) => {
        let msg;
        const uid = req.userId;
        const { app_id } = req.body;
        const appId = app_id ? (await App.findOne({ uid, _id: app_id }))?._id : null;
        const queryFilters = { uid };
        if (app_id) {
            queryFilters.app_id = appId ? appId.toString() : null;
        }
        const campaignFilters = { pid: uid };
        if (app_id) {
            campaignFilters.app_id = appId ? appId.toString() : null;
        }
        const today = moment().startOf('day').toDate();
        const yesterday = moment().subtract(1, 'day').startOf('day').toDate();
        const startOfMonth = moment().startOf('month').toDate();
        const endOfMonth = moment().endOf('month').toDate();
        const startOfLastMonth = moment().subtract(1, 'month').startOf('month').toDate();
        const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate();

        const todayStats = await OfferProcess.aggregate([
            { $match: { ...queryFilters, date: { $gte: today } } },
            {
                $group: {
                    _id: null,
                    conversions: { $sum: { $cond: [{ $eq: ['$status', 1] }, 1, 0] } },
                    clicks: { $sum: 1 }
                }
            }
        ]);

        const yesterdayStats = await OfferProcess.aggregate([
            { $match: { ...queryFilters, date: { $gte: yesterday, $lt: today } } },
            {
                $group: {
                    _id: null,
                    conversions: { $sum: { $cond: [{ $eq: ['$status', 1] }, 1, 0] } },
                    clicks: { $sum: 1 }
                }
            }
        ]);

        const todayCampaignConversions = await CampaignProcess.aggregate([
            { $match: { ...campaignFilters, datetime: { $gte: today } } },
            {
                $group: {
                    _id: null,
                    conversions: { $sum: { $cond: [{ $eq: ['$status', 1] }, 1, 0] } }
                }
            }
        ]);

        const yesterdayCampaignConversions = await CampaignProcess.aggregate([
            { $match: { ...campaignFilters, datetime: { $gte: yesterday, $lt: today } } },
            {
                $group: {
                    _id: null,
                    conversions: { $sum: { $cond: [{ $eq: ['$status', 1] }, 1, 0] } }
                }
            }
        ]);

        const todayTransaction = await Transaction.aggregate([
            { $match: { ...queryFilters, date: { $gte: today }, type: 'credit' } },
            {
                $group: {
                    _id: null,
                    credits: { $sum: '$credits' }
                }
            }
        ]).exec();

        const yesterdayTransaction = await Transaction.aggregate([
            { $match: { ...queryFilters, date: { $gte: yesterday, $lt: today }, type: 'credit' } },
            {
                $group: {
                    _id: null,
                    credits: { $sum: '$credits' }
                }
            }
        ]).exec();

        const thisMonthTransaction = await Transaction.aggregate([
            { $match: { ...queryFilters, date: { $gte: startOfMonth, $lte: endOfMonth }, type: 'credit' } },
            {
                $group: {
                    _id: null,
                    credits: { $sum: '$credits' }
                }
            }
        ]).exec();

        const lastMonthTransaction = await Transaction.aggregate([
            { $match: { ...queryFilters, date: { $gte: startOfLastMonth, $lte: endOfLastMonth }, type: 'credit' } },
            {
                $group: {
                    _id: null,
                    credits: { $sum: '$credits' }
                }
            }
        ]).exec();


        // Account-Balance
        const user = await User.findOne({ _id: uid });
        const accountBalance = parseFloat(user.balance).toFixed(2);

        // today Conversion and its Percentage
        const todayConversions = (todayStats[0]?.conversions || 0);
        const todayClicks = (todayStats[0]?.clicks || 0);
        const lastDayConversions = (yesterdayStats[0]?.conversions || 0);
        const lastDayClicks = (yesterdayStats[0]?.clicks || 0);
        let conversationPercentage;
        if (lastDayConversions == 0) {
            if (todayConversions > 0) {
                conversationPercentage = todayConversions * 100;
            } else {
                conversationPercentage = 0;
            }
        } else {
            conversationPercentage = ((todayConversions / lastDayConversions) * 100).toFixed(2);
        }

        // today Ads-conversion and its Percentage
        const todayAdsConversions = (todayCampaignConversions[0]?.conversions || 0);
        const lastDayAdsConversions = (yesterdayCampaignConversions[0]?.conversions || 0);
        let adsConversionsPercentage;
        if (lastDayAdsConversions == 0) {
            if (todayAdsConversions > 0) {
                adsConversionsPercentage = todayAdsConversions * 100;
            } else {
                adsConversionsPercentage = 0;
            }
        } else {
            adsConversionsPercentage = ((todayAdsConversions / lastDayAdsConversions) * 100).toFixed(2);
        }

        // today Revenue and its Percentage
        const todayRevenue = parseFloat(todayTransaction[0]?.credits || 0);
        const lastDayRevenue = (yesterdayTransaction[0]?.credits || 0);
        let todayRevenuePercentage;
        if (lastDayRevenue == 0) {
            if (todayRevenue > 0) {
                todayRevenuePercentage = todayRevenue * 100;
            } else {
                todayRevenuePercentage = 0;
            }
        } else {
            todayRevenuePercentage = ((todayRevenue / lastDayRevenue) * 100).toFixed(2);
        }

        // month Revenue and its Percentage
        const thisMonthRevenue = parseFloat(thisMonthTransaction[0]?.credits || 0);
        const lastMonthRevenue = (lastMonthTransaction[0]?.credits || 0);
        let monthRevenuePercentage;
        if (lastMonthRevenue == 0) {
            if (thisMonthRevenue > 0) {
                monthRevenuePercentage = thisMonthRevenue * 100;
            } else {
                monthRevenuePercentage = 0;
            }
        } else {
            monthRevenuePercentage = ((thisMonthRevenue / lastMonthRevenue) * 100).toFixed(2);
        }

        conversationPercentage = parseFloat(conversationPercentage);
        adsConversionsPercentage = parseFloat(adsConversionsPercentage);
        todayRevenuePercentage = parseFloat(todayRevenuePercentage);
        monthRevenuePercentage = parseFloat(monthRevenuePercentage);

        const data = {
            todayConversions,
            // todayClicks,
            // lastDayConversions,
            // lastDayClicks,
            conversationPercentage,
            todayAdsConversions,
            // lastDayAdsConversions,
            adsConversionsPercentage,
            todayRevenue,
            todayRevenuePercentage,
            thisMonthRevenue,
            monthRevenuePercentage,
            accountBalance: parseFloat(accountBalance)
        };
        return data;
    },

    sevenDaysStats: async (req) => {
        const uid = req.userId;
        const { app_id } = req.body;
        const appId = app_id ? (await App.findOne({ uid: uid, _id: app_id }))?._id : null;

        const queryFilters = { uid };
        if (app_id) {
            queryFilters.app_id = appId ? appId.toString() : null;
        }    

        const statDays = [];
        const statConversions = [];
        const statClicks = [];
        const statRevenue = [];
        let weeklyRevenue = 0;

        for (let i = 0; i < 7; i++) {
            const date = moment().subtract(i, 'days').startOf('day').toDate();
            const offerStats = await OfferProcess.aggregate([
                { $match: { ...queryFilters, date: { $gte: date, $lt: moment(date).add(1, 'day').toDate() } } },
                {
                    $group: {
                        _id: null,
                        conversions: { $sum: { $cond: [{ $eq: ['$status', 1] }, 1, 0] } },
                        clicks: { $sum: 1 }
                    }
                }
            ]).exec();

            const statDate = moment(date).format('D MMMM');
            statDays.push(statDate);

            if (offerStats.length > 0) {
                const row = offerStats[0];
                statConversions.push(row.conversions);
                statClicks.push(row.clicks);
            } else {
                statConversions.push(0);
                statClicks.push(0);
            }

            const transactionStats = await Transaction.aggregate([
                { $match: { ...queryFilters, date: { $gte: date, $lt: moment(date).add(1, 'day').toDate() }, type: 'credit' } },
                {
                    $group: {
                        _id: null,
                        credits: { $sum: '$credits' }
                    }
                }
            ]).exec();

            if (transactionStats.length > 0) {
                const row = transactionStats[0];
                const revenue = parseFloat(row.credits);
                const formattedRevenue = revenue.toFixed(2);
                statRevenue.push(parseFloat(formattedRevenue));
                weeklyRevenue += parseFloat(formattedRevenue);
            } else {
                statRevenue.push(0);
            }
        }

        const data = {
            statDays,
            statConversions,
            statClicks,
            statRevenue,
            weeklyRevenue
        };
        return data;
    },

    worldMapQuery: async (req, start_date = null, end_date = null) => {
        let msg;
        const { app_id } = req.body;
        const uid = req.userId;
        const appId = app_id ? (await App.findOne({ uid, _id: app_id }))?._id : null;  
        // const startDate = moment().subtract(30, 'days').toDate();
        // const endDate = moment().toDate();
        let startDate;
        let endDate;
        if (start_date) {
            startDate = DateTime.fromISO(start_date).startOf('day').toJSDate();
        }
        startDate = DateTime.now().minus({ days: 30 }).startOf('day').toJSDate();
        if (end_date) {
            endDate = DateTime.fromISO(end_date).endOf('day').toJSDate();
        }
        endDate = DateTime.now().endOf('day').toJSDate();

        if (start_date && end_date) {
            const startDateValidated = DateTime.fromISO(start_date).startOf('day').toJSDate();
            const endDateValidated = DateTime.fromISO(end_date).endOf('day').toJSDate();
            if (startDateValidated && endDateValidated) {
                const today = DateTime.now().toUTC().endOf('day').toJSDate();
                if (endDateValidated > today) {
                    msg = 'End Date should be less than or equal to today.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
                if (startDateValidated > endDateValidated) {
                    msg = 'Start Date should be before End Date.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
                startDate = startDateValidated;
                endDate = endDateValidated;
            } else {
                msg = 'Invalid Start Date or End Date.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
        }
        const query = {
            uid: uid,
            date: { $gte: startDate, $lte: endDate }
        };
        if (appId) {
            query.app_id = appId ? appId.toString() : null;
        }
        const pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: 'offer_process',
                    let: { op_id: "$id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$id", "$$op_id"] },
                                        { $eq: ["$uid", uid] },
                                        { $eq: ["$status", '1'] },
                                        { $gte: ["$date", moment().subtract(1, 'month').toDate()] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                credits: { $sum: "$credits" }
                            }
                        }
                    ],
                    as: 'op_filtered'
                }
            },
            {
                $unwind: {
                    path: '$op_filtered',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'offers',
                    localField: 'offer_id',
                    foreignField: 'id',
                    as: 'offer_details'
                }
            },
            {
                $unwind: {
                    path: '$offer_details',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$country',
                    clicks: { $sum: 1 },
                    completed_leads: { $sum: { $cond: [{ $ne: ['$op_filtered.credits', null] }, 1, 0] } },
                    revenue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$offer_details.adgatemedia_events', true] },
                                '$total_success_credit',
                                { $ifNull: ['$op_filtered.credits', 0] }
                            ]
                        }
                    }
                }
            },
            {
                $sort: {
                    revenue: -1
                }
            }
        ];
        const result = await OfferProcess.aggregate(pipeline).exec();
        const chartData = {
            records: []
        };
        for (const row of result) {
            const countryName = await getCountryName(row._id);

            chartData.records.push({
                dateRep: "14/04/2020",
                day: "14",
                month: "4",
                year: "2020",
                cases: "58",
                deaths: "3",
                countriesAndTerritories: countryName,
                geoId: row._id,
                countryterritoryCode: "AFG",
                popData2018: "37172386",
                revenue: row.revenue ? row.revenue.toFixed(2) : '0',
                clicks: row.clicks,
                completed_leads: row.completed_leads
            });
        }
        return chartData;
    },

    topPerformingOffers: async (req) => {
        const offers = await Offer.find({ active: 1 });
        // const offers = await Offer.find({ active: 1, deleted_bit: 0 });
        const bannedOffers = await BannedOffer.find();
        const publisherHiddenOffers = await PublisherHiddenOffer.find({ uid: req.userId });

        const validOffers = offers.filter(offer =>
            !bannedOffers.some(banned => banned.camp_id === offer.campaign_id && banned.network === offer.network) &&
            !publisherHiddenOffers.some(hidden => hidden.offerid === offer._id)
        );
        const topOffers = validOffers.sort((a, b) => b.epc - a.epc).slice(0, 10);
        const user = await User.findOne({ _id: req.userId });
        const data = [];
        for (let offer of topOffers) {
            if (offer.categories === "Survey") {
                continue;
            }

            let payout = offer.credits;
            if (user.offer_rate && user.offer_rate > 0.01) {
                payout = (payout * (user.offer_rate / 100)).toFixed(2);
            }
            else {
                // payout = (payout * (OFFER_RATE / 100)).toFixed(2);
                payout = (payout * (70 / 100)).toFixed(2);
            }

            const countries = offer.countries || '';
            // const flag = (countries.includes("all") || countries.includes("|") || !countries) ?
            //     "templates/images/globe.gif" :
            //     `templates/flags/${countries}.gif`;

            const cr = ((offer.leads / offer.hits) * 100).toFixed(2);
            const formattedCR = (cr === "100.00") ? "100" : cr;

            data.push({
                campid: offer.campaign_id,
                offerid: offer._id,
                name: offer.name,
                desc: offer.description,
                payout: payout,
                epc: offer.epc,
                cr: formattedCR,
                countries: countries,
                countriesCount: countries.split('|').length,
                // flag: flag,
                date: new Date(offer.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                image: offer.preview
            });
        }
        return data;
    },

    latestConversion: async (req) => {
        const { app_id } = req.body;
        const uid = req.userId;
        const appId = app_id ? (await App.findOne({ uid, _id: app_id }))?._id : null;
        const query = { uid, status: 1 };
        if (appId) {
            query.app_id = appId ? appId.toString() : null;
        }
        const offers = await OfferProcess.find(query).sort({ _id: -1 }).limit(5).exec();
        const data = [];
        let clicksCount = 0;
        let leadsCount = 0;

        for (const offer of offers) {
            clicksCount += 1;
            if (offer.status === 1) {
                leadsCount += 1;
            }

            let offerName = offer.offer_name;
            if (offerName.length > 20) {
                offerName = offerName.substring(0, 18) + "...";
            }
            data.push({
                campid: offer.campaign_id,
                offerid: offer._id,
                uid: offer.uid,
                sid: offer.sid,
                name: offerName,
                network: offer.network,
                image: offer.offer_preview,
                credits: offer.credits,
                country: offer.country,
                ref: offer.source,
                clicks: clicksCount,
                leads: leadsCount,
                date: moment(offer.date).format('YYYY-MM-DD hh:mm:ss'),
            });
        }
        return data;
    },

    latestAdsConversion: async (req) => {
        const { app_id } = req.body;
        const uid = req.userId;
        const appId = app_id ? (await App.findOne({ uid, _id: app_id }))?._id : null;
        const query = { pid: uid, status: 1 };
        if (appId) {
            query.app_id = appId ? appId.toString() : null;
        }
        const campaigns = await CampaignProcess.find(query).sort({ _id: -1 }).limit(5).exec();
        const data = [];
        let clicksCount = 0;
        let leadsCount = 0;
        for (let campaign of campaigns) {
            clicksCount += 1;
            if (campaign.status === 1) {
                leadsCount += 1;
            }
            let offerName = campaign.title;
            if (offerName.length > 20) {
                offerName = offerName.substring(0, 18) + "...";
            }
            const credits = campaign.payout;
            data.push({
                campid: campaign.camp_id,
                offerid: campaign._id,
                uid: campaign.pid, 
                sid: campaign.sid,
                name: offerName,
                image: campaign.image,
                network: 'ADS',
                credits: credits,
                country: campaign.country,
                ref: campaign.source,
                clicks: clicksCount,
                leads: leadsCount,
                uid: req.userId,
                date: moment(campaign.datetime).format('YYYY-MM-DD hh:mm:ss'),
            });
        }
        return data;
    },

};