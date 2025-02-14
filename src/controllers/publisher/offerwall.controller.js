import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import userService from "../../services/user.service.js";
import crypto from 'crypto';
import Offer from '../../models/offers.model.js';
import OfferProcess from '../../models/offerprocess.model.js';
import geoip from 'geoip-lite';
import App from '../../models/apps.model.js';
import capLimit from '../../models/capLimit.model.js';
import path from 'path';


export default {
    getOfferwallSetting: async (req, res) => {
        try {
            let msg;
            const userExisting = await User.findOne({ _id: req.userId }).select('logo offerwall_ratio offerwall_currency primary_color secondary_color text_color offer_categories split_currency currency_status');
            // const offerApiKeyExisting = await OfferWallApiKey.findOne({ uid: req.userId }).select('api_key status');
            if (!userExisting) {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            // if(!offerApiKeyExisting){
            //     msg = 'offerwall api key not found.';
            //     const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
            //     res.status(StatusCodes.BAD_REQUEST).json(result); 
            // }
            const userResponse = {
                ...userExisting.toObject(),
                // api_key: offerApiKeyExisting.api_key,
                // status: offerApiKeyExisting.status
            };
            msg = 'Get Offerwall setting successfully..';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, userResponse);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    offerWall: async (req, res) => {
        try {
            let msg;
            const {
                offerwall_ratio,
                offerwall_currency,
                primary_color,
                secondary_color,
                text_color,
                offer_categories,
                split_currency,
                currency_status
            } = req.body;

            // const categoriesArr = Array.isArray(offer_categories) ? offer_categories : [];
            // const categoriesStr = categoriesArr.join(',');
            const { error, value } = userService.validateOfferWallData(req.body);

            if (error) {
                const result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let imagePath = `${req.protocol}://${req.get("host")}/uploads/images/offerwall-logo/opinionuniverse.png`;

            const user = await User.findOne({ _id: req.userId });

            if (user) {
                if (req.file) {
                    const filename = req.file.filename;
                    imagePath = `${req.protocol}://${req.get("host")}/uploads/images/offerwall-logo/${filename}`;
                } else if (user.logo) {
                    imagePath = user.logo;
                }


                user.offerwall_ratio = offerwall_ratio;
                user.offerwall_currency = offerwall_currency;
                user.primary_color = primary_color;
                user.secondary_color = secondary_color;
                user.text_color = text_color;
                user.offer_categories = offer_categories;
                user.split_currency = split_currency;
                user.currency_status = currency_status;
                user.logo = imagePath;
                const offerWall = await user.save();

                const iframeSettings = JSON.stringify({
                    iframe_ratio: user.offerwall_ratio,
                    iframe_currency: user.offerwall_currency,
                    iframe_primary_clr: user.primary_color,
                    iframe_secondary_clr: user.secondary_color,
                    iframe_text_clr: user.text_color,
                    iframe_logo: user.logo,
                    iframe_selectedCategories: user.offer_categories
                });
                user.offerwall_iframe_preview = iframeSettings;
                await user.save();
                msg = 'Your preferences has been updated successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK, user);
                res.status(StatusCodes.OK).json(result);
            } else {
                msg = 'User not found.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    // OfferWallApiKey: async (req, res) => {
    //     try {
    //         let msg;
    //         let { status } = req.body;

    //         const apiKeyLength = 64;
    //         const apiKey = crypto.randomBytes(apiKeyLength).toString('hex').substring(0, 48);

    //         const existingOfferwallApiKey = await OfferWallApiKey.findOne({ uid: req.userId });
    //         if (existingOfferwallApiKey) {
    //             if (status === undefined || status === null) {
    //                 existingOfferwallApiKey.api_key = apiKey;
    //                 existingOfferwallApiKey.datetime = new Date();
    //             }

    //             if (status !== undefined) {
    //                 existingOfferwallApiKey.status = status;
    //             }
    //             await existingOfferwallApiKey.save();

    //             msg = 'Your offerwall Api key updated successfully.';
    //             const result = makeApiResponse(msg, 1, StatusCodes.OK, existingOfferwallApiKey);
    //             return res.status(StatusCodes.OK).json(result);
    //         }

    //         const newOfferwallApiKey = new OfferWallApiKey({
    //             uid: req.userId,
    //             api_key: apiKey,
    //             status: 1,
    //             datetime: new Date()
    //         });
    //         await newOfferwallApiKey.save();
    //         msg = 'Your offerwall Api key generated successfully.';
    //         const result = makeApiResponse(msg, 1, StatusCodes.OK, newOfferwallApiKey);
    //         return res.status(StatusCodes.OK).json(result);

    //     } catch (error) {
    //         res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    //     }
    // },

    // getofferWall: async (req, res) => {
    //     let msg;
    //     const {
    //         offer_id,
    //         ip,
    //         sid,
    //         sid2,
    //         sid3,
    //         sid4,
    //         sid5,
    //         app_id,
    //         country,
    //         credits,
    //         ref_credits,
    //         referrer_url,
    //         user_agent,
    //         uid
    //     } = req.body;

    //     // const uid = req.userId;
    //     if (!mongoose.isValidObjectId(offer_id)) {
    //         msg = 'Invalid Offer ID format.';
    //         const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
    //         return res.status(StatusCodes.BAD_REQUEST).json(result);
    //     }

    //     // const ip = req.ip;


    //     // const sid = req.query.sid ? makesafe(req.query.sid) : null;
    //     // const sid2 = req.query.sid2 ? makesafe(req.query.sid2) : null;
    //     // const sid3 = req.query.sid3 ? makesafe(req.query.sid3) : null;
    //     // const sid4 = req.query.sid4 ? makesafe(req.query.sid4) : null;
    //     // const sid5 = req.query.sid5 ? makesafe(req.query.sid5) : null;
    //     // const reward_value = req.query.reward_value ? makesafe(req.query.reward_value) : null;
    //     // const app_id = req.query.app_id ? makesafe(req.query.app_id) : null;
    //     // const country = req.query.country ? makesafe(req.query.country) : null;

    //     // console.log('sid: ', sid);
    //     // return false;
    //     // const getCountryByIP = (ip) => {
    //     //     const geo = geoip.lookup(ip);
    //     //     return geo ? geo.country : 'Unknown'; 
    //     // };

    //     // const country = getCountryByIP(ip);
    //     // console.log('country: ', country);
    //     //   return false;


    //     // if (req.query.offer_id && req.query.pubid) {
    //     if (offer_id) {
    //         const offer = await Offer.findOne({ _id: offer_id });
    //         // console.log("offer: ",offer);
    //         // return false;
    //         if (!offer) {
    //             msg = 'Sorry the offer not available.';
    //             const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
    //             return res.status(StatusCodes.BAD_REQUEST).json(result);
    //         }

    //         // const todayDate = new Date('Y-m-d');
    //         const todayDate = new Date().toISOString().split('T')[0];
    //         // console.log('today-date  ', todayDate);
    //         const cap_limit = await capLimit.findOne({ uid: uid });
    //         // console.log('cap_limit  ', cap_limits);

    //         if (cap_limit) {
    //             // const cap_limit = cap_limits[0];
    //             // for (const cap_limit of cap_limits) {
    //             const limit = cap_limit.limit;
    //             const offers = cap_limit.offer;

    //             console.log("limit  ", limit);
    //             console.log("offers  ", offers);
    //             if(Array.isArray(offers) && offers.includes('All')){
    //                 const publisher_limit = await OfferProcess.countDocuments({ uid: uid, status: 1,  date: { $gte: new Date(todayDate), $lt: new Date(new Date(todayDate).setDate(new Date(todayDate).getDate() + 1)) }});
    //                 console.log("offer process for all  ", publisher_limit);
    //                 if(publisher_limit >= limit){
    //                     msg = `Sorry, you have reached your limit of ${limit} offers for today's date. You have completed ${publisher_limit} offers. Please communicate with the administrator.`;
    //                     const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
    //                     return res.status(StatusCodes.BAD_REQUEST).json(result);
    //                 }
    //             } else if (Array.isArray(offers)){
    //                 for(const offerId of offers){
    //                     const publisher_limit = await OfferProcess.countDocuments({ uid: uid, offer_id: offerId,
    //                     status: 1, date: { $gte: new Date(todayDate), $lt: new Date(new Date(todayDate).setDate(new Date(todayDate).getDate() + 1)) }});
    //                     console.log("offer process   ", publisher_limit);
    //                     if(publisher_limit >= limit){
    //                         msg = `Sorry, you have reached your limit of ${limit} offers for today's date. You have completed ${publisher_limit} offers. Please communicate with the administrator.`;
    //                         const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
    //                         return res.status(StatusCodes.BAD_REQUEST).json(result);
    //                     }
    //                 }
    //             }
    //         // }
    //         } else {
    //            const limit = 50;
    //            const publisher_limit = await OfferProcess.countDocuments({ uid: uid, offer_id: offer_id, status: 1,  date: { $gte: new Date(todayDate), $lt: new Date(new Date(todayDate).setDate(new Date(todayDate).getDate() + 1)) }});
    //            if(publisher_limit >= limit){
    //                msg = `Sorry, you have reached your limit of ${limit} offers for today's date. You have completed ${publisher_limit} offers. Please communicate with the administrator.`;
    //                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
    //                return res.status(StatusCodes.BAD_REQUEST).json(result);
    //            }
    //         }



    //         // const credits = offer.credits * (70 / 100);
    //         // const ref_credits = credits * (30 / 100);

    //         // let linkId;
    //         // let hash;

    //         // if (req.query.lnkid && req.query.h) {
    //         //     linkId = makesafe(req.query.lnkid);

    //         //     const getLinkIdByLinkCode = (linkId) => {

    //         //         return linkId;
    //         //     };
    //         //     linkId = getLinkIdByLinkCode(linkId);

    //         //     hash = makesafe(req.query.h);
    //         //     const ccQ = `AND (countries LIKE '%${country}%' OR countries = 'All')`;

    //         // } else {
    //         //     linkId = 0;
    //         //     const randomNumber = Math.floor(Math.random() * 10000000000);
    //         //     const hashtag = crypto.createHash('md5')
    //         //         .update(`${Date.now()}${randomNumber}`)
    //         //         .digest('hex');
    //         //     const start = Math.floor(Math.random() * 5);
    //         //     hash = hashtag.substring(start, start + 25);

    //         // }
    //         const randomNumber = Math.floor(Math.random() * 10000000000);
    //         const hashtag = crypto.createHash('md5')
    //             .update(`${Date.now()}${randomNumber}`)
    //             .digest('hex');
    //         const start = Math.floor(Math.random() * 5);
    //         const hash = hashtag.substring(start, start + 25);
    //         // const uid = req.query.pubid;
    //         // const offer_ratio = await User.findOne({_id: uid});
    //         const app = await App.findOne({ uid: req.userId, unique_id: app_id });
    //         if (!app) {
    //             msg = 'App id does not exit.';
    //             const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
    //             return res.status(StatusCodes.BAD_REQUEST).json(result);
    //         }
    //         const placement_id = app ? app._id : null;

    //         // let referrer_url = '';
    //         // if (req.headers.referer) {
    //         //   referrer_url = makesafe(req.headers.referer);
    //         // }

    //         // const ua = makesafe(req.headers['user-agent']);

    //         const offerProcess = new OfferProcess({
    //             // campaign_id: offer.campaign_id,
    //             campaign_id: offer._id,
    //             offer_name: offer.name,
    //             offer_description: offer.description,
    //             offer_link: offer.link,
    //             offer_category: offer.categories,
    //             offer_browsers: offer.browsers,
    //             offer_preview: offer.preview,
    //             offer_adgatemedia_events: offer.adgatemedia_events,
    //             offer_requirements: offer.offer_requirements,
    //             offer_image_url: offer.image_url,
    //             offer_preview_url: offer.offer_preview_url,
    //             uid: req.userId,
    //             code: hash,
    //             status: 0,
    //             date: new Date(),
    //             ip: ip,
    //             credits: credits,
    //             ref_credits: ref_credits,
    //             network: offer.network,
    //             offer_id: offer._id,
    //             // link_id: linkId,
    //             link_id: 0,
    //             gw_id: 0,
    //             credit_mode: 'default',
    //             country: country,
    //             source: referrer_url,
    //             unique: 1,
    //             user_agent: user_agent,
    //             sid: sid,
    //             sid2: sid2,
    //             sid3: sid3,
    //             sid4: sid4,
    //             sid5: sid5,
    //             total_success_credit: 0.00,
    //             app_id: placement_id
    //         });
    //         await offerProcess.save();

    //         offer.hits = offer.hits + 1;
    //         await offer.save();

    //         let q = '';
    //         let offerLink = offer.link;
    //         let global = '';
    //         let params = '';
    //         switch (offer.network) {
    //             case 'Adscendmedia':
    //                 q = `&sub1=${hash}&sub2=${uid}`;
    //                 break;
    //             case 'CPALead':
    //                 q = `&subid=${uid}-${hash}`;
    //                 break;
    //             case 'Adgatemedia':
    //                 q = `&s1=${hash}`;
    //                 break;
    //             case 'Adworkmedia':
    //             case 'adworkmedia':
    //                 q = `&sid=${uid}&sid2=${hash}`;
    //                 break;
    //             case 'BlueTrackMedia':
    //                 q = `&sid=${uid}-${hash}`;
    //                 break;
    //             case 'TestNetwork':
    //                 q = `?sub=${uid}-${hash}&campid=${offer.campaign_id}`;
    //                 break;
    //             case 'RevenueHut':
    //                 q = `${uid}/${hash}`;
    //                 break;
    //             case 'RedFireNetwork':
    //                 q = '';
    //                 break;
    //             case 'Admantium':
    //             case 'Admantium2':
    //                 q = `&aff_sub=${hash}&aff_sub2=${uid}`;
    //                 break;
    //             case 'User':
    //                 q = '';
    //                 break;
    //             case 'CPAGrip':
    //                 q = `&tracking_id=${uid}-${hash}`;
    //                 break;
    //             case 'Capital':
    //                 q = `&username=${hash}&sid2=${uid}`;
    //                 break;
    //             case 'inovatedm':
    //             case 'Cpamerchant':
    //                 q = `&aff_sub=${hash}&aff_sub2=${uid}`;
    //                 break;
    //             case 'Wannads':
    //                 q = `&userId=${hash}&sub_id2=${uid}`;
    //                 break;
    //             case 'rom':
    //                 offerLink = offer.link.replace("[transaction_id]", hash).replace("[publisher_id]", uid);
    //                 global = 'yes';
    //                 return;
    //             case 'fusion':
    //                 q = `?maxLoi=25&supplierSessionId=${hash}`;
    //                 break;
    //             case 'Paneland':
    //                 const low_country = country.toLowerCase();
    //                 q = `?mid=24322aefb3d9a4412023d44c9b4542b4&country=${low_country}&P_uid=${hash}`;
    //                 break;
    //             case 'Yuno':
    //                 q = `&pparam_puuid=${hash}&pparam_pupid=${uid}`;
    //                 offerLink = offer.link + q;
    //                 offerLink = offerLink.replace("[transaction_id]", hash);
    //                 global = 'yes';
    //                 return;
    //             case 'Torox':
    //                 offerLink = offer.link.replace('[USER_ID]', hash).replace('[tag]', uid);
    //                 break;
    //             default:
    //                 const param = params.replace(/=|&/g, "");
    //                 offerLink = !offer.link.includes("?") ? `${offer.link}?${param}=${uid}-${hash}` : `${offer.link}&${param}=${uid}-${hash}`;
    //                 global = 'yes';
    //                 return;
    //         }

    //         if (offer.network === 'Torox') {
    //             // offerLink = offer.link;
    //             offerLink = offerLink.replace('[USER_ID]', hash);
    //             offerLink = offerLink.replace('[tag]', uid);
    //         }


    //         if (offer.network === 'Adgatemedia') {
    //             // offerLink = offer.link;
    //             offerLink = offerLink.replace(/s1=&|&s1=/gi, '');
    //         }

    //         if (global !== 'yes') {
    //             // offerLink = offer.link + q;
    //             offerLink = offerLink + q;
    //             offerLink = offerLink.replace(/&amp;/g, '&');
    //         }

    //         if (offer.network == 'Farly') {
    //             // offerLink = offer.link;

    //             offerLink = offerLink.replace(/\[YOUR_CLICK_ID\]/gi, hash);
    //             offerLink = offerLink.replace(/\[YOUR_PUBLISHER_ID\]/gi, uid);

    //             if (offerLink.includes('[IDFA]')) {
    //                 offerLink = offerLink.replace(/\[IDFA\]/gi, offer_id);
    //             }

    //             if (offerLink.includes('[gaid]')) {
    //                 offerLink = offerLink.replace(/\[gaid\]/gi, offer_id);
    //             }
    //         }
    //         console.log('offerLink: ', offerLink);

    //         const updatedOfferLink = `${offerLink}&pubid=${uid}&sid=${sid}&sid2=${sid2}&sid3=${sid3}&sid4=${sid4}&sid5=${sid5}&category=All`;

    //         msg = 'Get Offer successfully.';
    //         const result = makeApiResponse(msg, 1, StatusCodes.OK, { updatedOfferLink, offer, offerProcess });
    //         res.status(StatusCodes.OK).json(result);
    //     }
    // },

    offerWallIframe: async (req, res) => {
        try {
            let msg;
            const uid = req.userId;
            const iframeUrl = `http://localhost:3000/offerwall/getAllOfferwall?pubid=${uid}&sid=[USER_ID]&apikey=[apikey]`;

            const codex = `<iframe src="'.${iframeUrl}.'" width="900px" height="1000px" style="border:0; padding:0; scrolling="auto" margin:0;" frameborder="0" /><a href="'.${iframeUrl}.'" target="_blank">iFrames are required to see this page. Please click here!</a></iframe>`;
            msg = 'Get offerwall iframe successfully.';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, codex);
            res.status(StatusCodes.OK).json(result);
        }
        catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    }

};
