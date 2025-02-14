import ValidUrl from 'valid-url';
import PbSettings from '../../models/pbsettings.model.js';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import axios from 'axios';
import OfferProcess from '../../models/offerprocess.model.js';
import App from '../../models/apps.model.js';
import User from '../../models/user.model.js';
import Offer from '../../models/offers.model.js';
import Pbsent from '../../models/pb_sent.model.js';
import Pblog from '../../models/pblog.model.js';
import Transaction from '../../models/transactions.model.js';
import AdminEarnings from '../../models/adminearnings.model.js';
import OfferEvents from '../../models/offerevents.model.js';
import ReadyDownloads from '../../models/ready_downloads.model.js';
import { createDiffieHellman } from 'crypto';
import Test from '../../models/test.model.js';
import Network from '../../models/networks.model.js';


export const sendPostback = async (uid, offer_id = "", status, campid = "", network, payout = 0, sid = "", sid2 = "", sid3 = "", sid4 = "", sid5 = "", ip = "", tid = "", placement_id = "", e_id = "", event_name = "") => {
    let msg;
    let url;
    let sp_currency;

    if (status === 1) {
        const offer = await OfferProcess.findOne({ code: tid });
        if (offer) {
            offer.completed_date = new Date();
            await offer.save(); // Save the updated offer
            msg = 'Completed date updated successfully';
        } else {
            msg = 'ERROR: while updating completed_date';
            throw new Error(msg);
        }
    } else if (status === 2) {
        const offer = await OfferProcess.findOne({ code: tid });
        if (offer) {
            offer.reversed_date = new Date();
            await offer.save(); // Save the updated offer
            msg = 'Reversed date updated successfully';
        } else {
            msg = 'ERROR: while updating reversed_date';
            throw new Error(msg);
        }
    }

    const pb_setting = await PbSettings.findOne({ uid: uid });

    if (placement_id) {
        const placement = await App.findOne({ _id: placement_id });
        if (placement) {
            url = placement.postback_url;
            url = url.replace(/\[app_id\]/gi, placement.unique_id);
            sp_currency = placement.split_currency;
            const oratio = placement.ratio;

            if (network === 'Adgatemedia' || network === 'Hangmyads' || network === 'ADS' || network === 'Farly') {
                payout = payout;
            } else {
                payout = payout * (oratio / 100);
            }
        }
    } else {
        url = pb_setting.url;
        const userDetail = await User.findOne({ _id: uid });
        sp_currency = userDetail.split_currency;
        const oratio = userDetail.offerwall_ratio;

        if (network === 'Adgatemedia' || network === 'Hangmyads' || network === 'ADS' || network === 'Farly' || network === 'Torox') {
            payout = payout;
        } else {
            payout = payout * (oratio / 100);
        }
    }

    if (url && ValidUrl.isUri(url)) {
        const selectedOffer = await Offer.findOne({ network: network });
        const offer_name = selectedOffer.name;
        url = url.replace(/\[OFFERID\]/gi, offer_id);
        url = url.replace(/\[STATUS\]/gi, status);
        url = url.replace(/\[SID\]/gi, sid);
        url = url.replace(/\[SID2\]/gi, sid2);
        url = url.replace(/\[SID3\]/gi, sid3);
        url = url.replace(/\[SID4\]/gi, sid4);
        url = url.replace(/\[SID5\]/gi, sid5);
        url = url.replace(/\[IP\]/gi, ip);
        url = url.replace(/\[TransactionID\]/gi, tid);
        url = url.replace(/\[offername\]/gi, offer_name);

        const hyphenated_string = event_name.replace(/ /g, '-');

        if (network === 'Adgatemedia' || network === 'Hangmyads') {
            url = url.replace(/\[eventid\]/gi, e_id);
            url = url.replace(/\[eventname\]/gi, hyphenated_string);
            url = url.replace(/\[PAYOUT\]/gi, payout);
        } else if (network === 'Farly') {
            url = url.replace(/\[eventid\]/gi, e_id);
            url = url.replace(/\[eventname\]/gi, hyphenated_string);
            url = url.replace(/\[PAYOUT\]/gi, payout);
        } else if (network === 'ADS') {
            url = url.replace(/\[PAYOUT\]/gi, payout);
        } else if (network === 'Torox') {
            url = url.replace(/\[PAYOUT\]/gi, payout);
        } else {
            url = url.replace(/\[PAYOUT\]/gi, payout * sp_currency);
        }

        try {
            const response = await axios.get(url);
            const curlRequest = response.data;

            const pb_sent = new Pbsent({
                uid,
                campid,
                network,
                url,
                status,
                date: new Date(),
                pb_response: curlRequest,
                offer_id,
                payout,
                sid,
                sid2,
                sid3,
                sid4,
                sid5,
                ip,
                tid,
                event_id: e_id,
                event_name,
                app_id: placement_id
            });
            await pb_sent.save();
            console.log('url : ', url);
            return curlRequest;
        } catch (error) {
            console.error('Error making HTTP request or saving to database:', error);
            throw new Error('Failed to make HTTP request or save to database');
        }
    } else {
        throw new Error('Invalid URL');
    }
};

export default {


    postback: async (req, res) => {
        try {
            let msg;
            const {
                url,
                check_ip,
                removePostback
            } = req.body;

            if (removePostback === 'removePB') {
                await PbSettings.deleteOne({ uid: req.userId });
                msg = 'Your postback has been remove successfully.';
                const result = makeApiResponse(msg, 1, StatusCodes.OK);
                return res.status(StatusCodes.OK).json(result);
            }
            if (url && ValidUrl.isUri(url)) {

                const postback = await PbSettings.findOne({ uid: req.userId });
                if (postback) {
                    postback.pb_type = 'global';
                    postback.url = url || postback.url;
                    postback.check_ip = check_ip || 0;
                    postback.date = new Date();
                    await postback.save();
                    msg = 'Your postback has been update successfully.';
                    const result = makeApiResponse(msg, 1, StatusCodes.OK, postback);
                    return res.status(StatusCodes.OK).json(result);
                } else {
                    const newPostback = new PbSettings({
                        uid: req.userId,
                        pb_type: 'global',
                        url,
                        check_ip,
                        date: new Date()
                    });
                    await newPostback.save();
                    msg = 'Your postback has been created successfully.';
                    const result = makeApiResponse(msg, 1, StatusCodes.OK, newPostback);
                    return res.status(StatusCodes.OK).json(result);
                }
            } else {
                msg = 'Invalid Postback URL.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    testPostback: async (req, res) => {
        try {
            let msg;
            const {
                offerId,
                sid,
                sid2,
                sid3,
                sid4,
                sid5,
                status,
                payout
            } = req.body;
            const postback = await PbSettings.findOne({ uid: req.userId });
            if (!postback) {
                msg = "You haven't set any postback yet. Please set it before testing it.";
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }

            if (postback.url && ValidUrl.isUri(postback.url)) {

                let url = postback.url;
                url = url.replace("[OFFERID]", offerId || '');
                url = url.replace("[STATUS]", status || '');
                url = url.replace("[SID]", sid || '');
                url = url.replace("[SID2]", sid2 || '');
                url = url.replace("[SID3]", sid3 || '');
                url = url.replace("[SID4]", sid4 || '');
                url = url.replace("[SID5]", sid5 || '');
                url = url.replace("[PAYOUT]", payout || '');

                const response = await axios.get(url);
                msg = `Postback has been sent to ${url}.`;
                const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                    status: response.status,
                    headers: response.headers,
                    data: response.data
                });
                return res.status(StatusCodes.OK).json(result);

            } else {
                msg = 'Invalid Postback URL.';
                const result = makeApiResponse(msg, 0, StatusCodes.NOT_FOUND);
                return res.status(StatusCodes.NOT_FOUND).json(result);
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    adgaitMediaPostback: async (req, res) => {
        try {
            let msg;
            const {
                hash,
                reward,
                ip,
                event_name,
                e_id,
                // status,
            } = req.body;

            const network = 'Adgatemedia';
            const status = 1;
            // if (status) {
            //   let  status = status;
            // } else {
            //     status = 1;
            // }
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const uid = offerProcess.uid;
            const offer_id = offerProcess.offer_id;

            let points = offerProcess.credits;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;

            const camp_id = offerProcess.campaign_id;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offer = await Offer.findOne({ _id: offer_id });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offerId = offer._id;
            let events = JSON.parse(offer.adgatemedia_events);
            events = events.filter(item => item.payout !== 0);
            const totalEvents = events.length;

            let userPoints = 0;
            // let points = 0;
            let offer_ratio;
            let currency;
            let split_currency;

            if (reward) {
                const app = await App.findOne({ _id: placement_id });
                if (app) {
                    offer_ratio = app.ratio;
                    currency = app.currency;
                    split_currency = app.split_currency;
                } else {
                    const user = await User.findOne({ _id: uid });
                    offer_ratio = user.offerwall_ratio;
                    currency = user.offerwall_currency;
                    split_currency = user.split_currency;
                }

                points = reward / 100;

                if (offer_ratio == split_currency) {
                    userPoints = reward;
                } else {
                    if (offer_ratio == 100) {
                        userPoints = (reward / 100) * split_currency;
                    } else {
                        userPoints = ((points / 100) * offer_ratio) * split_currency;
                    }
                }
            } else if (reward == 0) {
                points = 0.00;
                userPoints = 0.00;
            }

            if (!uid || !offer_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 0) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: offer_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: offer_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: offer_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id, e_id, event_name);
                }

                if (offerProcess.offer_id == offer_id && offerProcess.status !== 2 && offerProcess.uid == uid) {
                    offerProcess.total_success_credit = points;
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const pub_payout = points;
            const user_payout_event = userPoints * split_currency;
            const offerEvent = new OfferEvents({
                uid,
                event_id: e_id,
                event_name,
                offer_id: offerId,
                pub_payout,
                user_payout: userPoints,
                sid,
                datetime: new Date()
            });
            await offerEvent.save();

            offerProcess.total_success_credit += points;
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.offer_id == offer_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id, e_id, event_name);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    toroxPostback: async (req, res) => {
        try {
            let msg;
            const {
                user_id, // its use for hash
                Subid1,
                oid,
                o_name,
                amount,
                currency_name,
                payout,
                e_id,
                event_name
            } = req.body;

            const network = 'Torox';
            const status = 1;
            const uri = req.originalUrl;
            const offerProcess = await OfferProcess.findOne({ code: user_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: oid,
                    sid1: null,
                    sid2: user_id,
                    status,
                    ip: null,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const uid = offerProcess.uid;
            const offer_id = offerProcess.offer_id;

            let points = offerProcess.credits;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ip = offerProcess.ip;

            const camp_id = offerProcess.campaign_id;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: user_id,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offer = await Offer.findOne({ campaign_id: camp_id });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: user_id,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offerId = offer._id;
            let userPoints = 0;
            // let points = 0;
            let offer_ratio;
            let currency;
            let split_currency;

            if (amount) {
                // const app = await App.findOne({ _id: placement_id });
                // if (app) {
                //     offer_ratio = app.ratio;
                //     currency = app.currency;
                //     split_currency = app.split_currency;
                // } else {
                const user = await User.findOne({ _id: uid });
                offer_ratio = user.offerwall_ratio;
                currency = user.offerwall_currency;
                split_currency = user.split_currency;
                // }
                const pointIntoDollar = amount / split_currency;
                const defaultCut = pointIntoDollar * (70 / 100); // Ensure OFFER_RATE is defined elsewhere in your code

                let points = defaultCut;
                let userPoints;

                if (offer_ratio == split_currency) {
                    userPoints = amount;
                } else {
                    if (offer_ratio == 100) {
                        userPoints = (amount / 100) * split_currency;
                    } else {
                        userPoints = ((points / 100) * offer_ratio) * split_currency;
                    }
                }
            } else if (amount == 0) {
                points = 0.00;
                userPoints = 0.00;
            }
            if (!uid || !camp_id || !user_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: user_id,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: user_id,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: user_id,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 0) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: user_id, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();

                    loginUser.balance -= points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: user_id, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: user_id,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id, e_id, event_name);
                }

                if (offerProcess.offer_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid) {
                    offerProcess.total_success_credit = points;
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: user_id,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const pub_payout = points;
            const user_payout_event = userPoints * split_currency;
            const offerEvent = new OfferEvents({
                uid,
                event_id: e_id,
                event_name,
                offer_id: offerId,
                pub_payout,
                user_payout: userPoints,
                sid,
                datetime: new Date()
            });
            await offerEvent.save();

            offerProcess.total_success_credit += points;
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();

            loginUser.balance += points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: user_id,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash: user_id,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: user_id,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash: user_id,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, user_id, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }

    },

    aditmediaPostback: async (req, res) => {
        try {
            let msg;
            const {
                s_id: hash,
            } = req.body;

            const network = 'Aditmedia';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const uid = offerProcess.uid;
            const offer_id = offerProcess.offer_id;

            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;

            const camp_id = offerProcess.campaign_id;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offer = await Offer.findOne({ campaign_id: camp_id });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offerId = offer._id;
            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    admantiumPostback: async (req, res) => {
        try {
            let msg;
            const {
                cid,
                status,
                pid: uid,
                s_id: hash,
            } = req.body;

            const network = 'Admantium';
            // const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            if (!uid || !cid || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }


            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: cid, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;

            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;


            const offer = await Offer.findOne({ campaign_id: cid, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offerId = offer._id;


            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 3) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: cid, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: cid });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: cid, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, 2, cid, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == cid && offerProcess.status !== 2 && offerProcess.uid == uid) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: cid,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: cid,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == cid) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, 1, cid, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    adscendPostback: async (req, res) => {
        try {
            let msg;
            const {
                camp_id,
                status,
                sub2: uid,
                sub1: hash,
            } = req.body;

            const network = 'Adscendmedia';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }


            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;

            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    adscendSurveyPostback: async (req, res) => {
        try {
            let msg;
            const {
                camp_id,
                status,
                sub1,
                sub2: uid,
                sub3: hash,
            } = req.body;

            const network = 'AdscendLive';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            if (!uid || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }


            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;

            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    adworkPostback: async (req, res) => {
        try {
            let msg;
            const {
                campaign_id: camp_id,
                status,
                sid: uid,
                sid2: hash,
            } = req.body;

            const network = 'Adworkmedia';
            const validIps = ['67.227.230.75', '67.227.230.76'];
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            if (!validIps.includes(ip)) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Gateway',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'You are not allowed to use this page!',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'You are not allowed to use this page!';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }


            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;

            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    affiliatePostbackHandler: async (req, res) => {
        try {
            let msg;
            const {
                pixel,
                campid: camp_id,
                status,
                sid: subID
            } = req.body;

            const network = 'User';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const [uid, hash] = subID.split('-');

            if (!uid || !camp_id || !hash || pixel) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }


            const offerProcess = await OfferProcess.findOne({ _id: pixel, uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;

            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, leads: { $lt: 'limit' }, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    AmpedPostback: async (req, res) => {
        try {
            let msg;
            const {
                sid: uid,
                s2: hash
            } = req.body;

            const network = 'Amped';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }


            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    appsflyerPostback: async (req, res) => {
        try {
            let msg;
            const {
                click_id: hash,
                ip_address,
                timestamp,
                andriod_id,
                adid,
                creative_id,
                site_id,
                event_name,
                event_value
                // status,
            } = req.body;

            const network = 'Appsflyer';
            const status = 1;
            // if (status) {
            //   let  status = status;
            // } else {
            //     status = 1;
            // }
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const uid = offerProcess.uid;
            const offer_id = offerProcess.offer_id;

            let points = offerProcess.credits;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;

            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;

            const camp_id = offerProcess.campaign_id;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offer = await Offer.findOne({ campaign_id: camp_id });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offerId = offer._id;
            let events = JSON.parse(offer.adgatemedia_events);
            events = events.filter(item => item.payout !== 0);
            const totalEvents = events.length;

            let userPoints = 0;
            // let points = 0;
            let offer_ratio;
            let currency;
            let split_currency;

            if (reward) {
                const app = await App.findOne({ _id: placement_id });
                if (app) {
                    offer_ratio = app.ratio;
                    currency = app.currency;
                    split_currency = app.split_currency;
                } else {
                    const user = await User.findOne({ _id: uid });
                    offer_ratio = user.offerwall_ratio;
                    currency = user.offerwall_currency;
                    split_currency = user.split_currency;
                }

                points = reward / 100;

                if (offer_ratio == split_currency) {
                    userPoints = reward;
                } else {
                    if (offer_ratio == 100) {
                        userPoints = (reward / 100) * split_currency;
                    } else {
                        userPoints = ((points / 100) * offer_ratio) * split_currency;
                    }
                }
            } else if (reward == 0) {
                points = 0.00;
                userPoints = 0.00;
            }

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 0) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id, e_id, event_name);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid) {
                    offerProcess.total_success_credit = points;
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const pub_payout = points;
            const user_payout_event = userPoints * split_currency;
            const offerEvent = new OfferEvents({
                uid,
                event_id: e_id,
                event_name,
                offer_id: offerId,
                pub_payout,
                user_payout: userPoints,
                sid,
                datetime: new Date()
            });
            await offerEvent.save();

            offerProcess.total_success_credit += points;
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id, e_id, event_name);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    bigbangadsPostback: async (req, res) => {
        try {
            let msg;
            const {
                // sid: uid,
                aff_sub2: hash
            } = req.body;

            const network = 'BigBangAds';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const uid = offerProcess.uid;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }


            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    bitlabPostback: async (req, res) => {
        try {
            let msg;
            const {
                sid: hash,
                type
            } = req.body;

            const network = 'bitlabLiveSurvey';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const uid = offerProcess.uid;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let points;
            if (type !== 'COMPLETE') {
                points = 0.0;
                await OfferProcess.findOneAndDelete({ uid: uid, code: hash, campaign_id: camp_id, network: network });
            } else {
                points = offerProcess.credits;
            }
            let userPoints = points;
            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (type === 'RECONCILIATION') {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    bluetrackmediaPostback: async (req, res) => {
        try {
            let msg;
            const {
                campaign: camp_id,
                status,
                sid: subID
            } = req.body;

            const network = 'BlueTrackMedia';
            const validIps = ['72.52.224.101', '72.52.225.74'];
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const [uid, hash] = subID.split('-');
            if (!validIps.includes(ip)) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Gateway',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'You are not allowed to use this page!',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'You are not allowed to use this page!';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    capitalPostback: async (req, res) => {
        try {
            let msg;
            const {
                cid: camp_id,
                status,
                sid: hash,
                sid2: uid,
                sid3: isGW
            } = req.body;

            const network = 'Capital';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    cpagripPostback: async (req, res) => {
        try {
            let msg;
            const {
                offer_id: camp_id,
                tracking_id: subID,
                password
            } = req.body;

            const network = 'CPAGrip';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const [uid, hash] = subID.split('-');
            if (!password || password !== 'CPNNETWORK') {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'You are not allowed to use this page!',
                    app_id: placement_id
                });
                await pblog.save();
                msg = 'You are not allowed to use this page!';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    cpaleadPostback: async (req, res) => {
        try {
            let msg;
            const {
                survid: camp_id,
                subid,
                password
            } = req.body;

            const network = 'CPALead';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const [uid, hash] = subid.split('-');
            if (!password || password !== 'CPNNETWORK') {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'You are not allowed to use this page!',
                    app_id: placement_id
                });
                await pblog.save();
                msg = 'You are not allowed to use this page!';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    CpamerchantPostback: async (req, res) => {
        try {
            let msg;
            const {
                cid: camp_id,
                status,
                sid: hash,
                aff_sub2: uid
            } = req.body;

            const network = 'Cpamerchant';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    cpx_researchPostback: async (req, res) => {
        try {
            let msg;
            const {
                status,
                subid,
                subid_2: hash,
                type
            } = req.body;

            const network = 'cpxSurvey';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            if (!hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const uid = offerProcess.uid;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }


            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let points;
            if (type === 'out') {
                points = 0.0;
                await OfferProcess.findOneAndDelete({ uid: uid, code: hash, campaign_id: camp_id, network: network });
            } else if (type === 'bonus') {
                points = 0.0;
                await OfferProcess.findOneAndDelete({ uid: uid, code: hash, campaign_id: camp_id, network: network });
            } else if (type === 'complete') {
                points = offerProcess.credits;
            } else if (type === 'reversal') {
                points = offerProcess.credits;
            } else {
                points = offerProcess.credits;
            }
            let userPoints = points;
            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    dynataPostback: async (req, res) => {
        try {
            let msg;
            const {
                aff_sub2: hash,
            } = req.body;

            const network = 'Dynata';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const uid = offerProcess.uid;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }


            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    farlyPostback: async (req, res) => {
        try {
            let msg;
            const {
                clickid: hash,
                gaid: e_id,
                ganame: event_name,
                reward
            } = req.body;

            const network = 'Farly';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            let points = offerProcess.credits;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const uid = offerProcess.uid;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }


            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offer = await Offer.findOne({ _id: offer_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offerId = offer._id;
            let events = JSON.parse(offer.adgatemedia_events);
            events = events.filter(item => item.payout !== 0);
            const totalEvents = events.length;

            let userPoints = 0;
            let offer_ratio;
            let currency;
            let split_currency;
            let pointIntoDollar;
            let defaultCut;
            let pubCut;

            if (reward) {
                const app = await App.findOne({ _id: placement_id });
                if (app) {
                    offer_ratio = app.ratio;
                    currency = app.currency;
                    split_currency = app.split_currency;
                    pointIntoDollar = reward / split_currency;
                    defaultCut = pointIntoDollar * (70);  // OFFER_RATE is 70
                    pubCut = defaultCut * (offer_ratio);
                } else {
                    const user = await User.findOne({ _id: uid });
                    offer_ratio = user.offerwall_ratio;
                    currency = user.offerwall_currency;
                    split_currency = user.split_currency;
                    pointIntoDollar = reward / split_currency;
                    defaultCut = pointIntoDollar * (70);  // OFFER_RATE is 70
                    pubCut = defaultCut * (offer_ratio);
                }

                points = defaultCut;
                userPoints = pubCut;
            } else if (reward == 0) {
                points = 0.00;
                userPoints = 0.00;
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }


            if (status === 0) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id, e_id, event_name);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.total_success_credit = points;
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const pub_payout = points;
            const offerEvent = new OfferEvents({
                uid,
                event_id: e_id,
                event_name,
                offer_id: offerId,
                pub_payout,
                user_payout: userPoints,
                sid,
                datetime: new Date()
            });
            await offerEvent.save();

            offerProcess.total_success_credit += points;
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id, e_id, event_name);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    firalmediaPostback: async (req, res) => {
        try {
            let msg;
            const {
                oid: camp_id,
                status,
                aff_sub,
                sub,
                sub2,
                aff_sub2,
                aff_sub3,
            } = req.body;

            const network = 'FiralMedia';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            let uid = sub;
            if (!uid) {
                uid = aff_sub;
            }
            let hash = sub2;
            if (!hash) {
                hash = aff_sub2;
            }
            if (aff_sub3 !== 'CPNNETWORK') {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'You are not allowed to use this page!',
                    app_id: placement_id
                });
                await pblog.save();
                msg = 'You are not allowed to use this page!';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 0) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    FluentPostback: async (req, res) => {
        try {
            let msg;
            const {
                s2: uid,
                sid: hash,
            } = req.body;

            const network = 'Fluent';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;


            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 0) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    fusionPostback: async (req, res) => {
        try {
            let msg;
            const {
                supplierSessionId: hash,
            } = req.body;

            const network = 'fusion';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status: null,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            const uid = offerProcess.uid;
            const status = 1;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;
            const password = 'CPA12321';


            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            if (offerProcess.uid !== uid && !offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    hangmyadsPostback: async (req, res) => {
        try {
            let msg;
            const {
                subid: hash,
                payout: reward,
                goalname: event_name,
                goalid: e_id,
            } = req.body;

            const network = 'Hangmyads';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            let status;
            if (req.body.status) {
                status = req.body.status;
            } else {
                status = 1;
            }

            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status: null,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            const uid = offerProcess.uid;
            let points = offerProcess.credits;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sid = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            if (offerProcess.uid !== uid && !offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offerId = offer._id;
            let events = JSON.parse(offer.adgatemedia_events);
            events = events.filter(item => item.payout !== 0);
            const totalEvents = events.length;
            let userPoints = 0;
            let offer_ratio;
            let currency;
            let split_currency;
            let pointIntoDollar;
            let defaultCut;


            if (reward) {
                points = reward;
                const app = await App.findOne({ _id: placement_id });
                if (app) {
                    offer_ratio = app.ratio;
                    currency = app.currency;
                    split_currency = app.split_currency;
                    pointIntoDollar = reward / split_currency;
                    defaultCut = pointIntoDollar * (70 / 100);  // OFFER_RATE is 70
                } else {
                    const user = await User.findOne({ _id: uid });
                    offer_ratio = user.offerwall_ratio;
                    currency = user.offerwall_currency;
                    split_currency = user.split_currency;
                    pointIntoDollar = reward / split_currency;
                    defaultCut = pointIntoDollar * (70 / 100);  // OFFER_RATE is 70

                }
                points = (reward / 100) * (70 / 100);

                if (offer_ratio == split_currency) {
                    userPoints = reward;
                } else {
                    if (offer_ratio == 100) {
                        userPoints = (reward / 100) * split_currency;
                    } else {
                        userPoints = ((points / 100) * offer_ratio) * split_currency;
                    }
                }

                points = points;
                userPoints = userPoints;
            } else if (reward == 0) {
                points = 0.00;
                userPoints = 0.00;
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            
            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }


            if (status === 0) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id, e_id, event_name);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const pub_payout = points;
            const user_payout_event = userPoints * split_currency;
            const offerEvent = new OfferEvents({
                uid,
                event_id: e_id,
                event_name,
                offer_id: offerId,
                pub_payout,
                user_payout: user_payout_event,
                sid,
                datetime: new Date()
            });
            await offerEvent.save();
            offerProcess.total_success_credit += points;
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sid, sid2, sid3, sid4, sid5, ip, hash, placement_id, e_id, event_name);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    innovatePostback: async (req, res) => {
        try {
            let msg;
            const {
                sid,
                TK: pid,
                PID: hash,
            } = req.body;

            const network = 'innovativeLiveSurvey';
            
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            if(!hash){
                msg = 'Invalid response.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status: null,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            const camp_id = offerProcess.campaign_id;
            const uid = offerProcess.uid;
            const status = 1;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;
           


            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            if (offerProcess.uid !== uid && !offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    inovatedmPostback: async (req, res) => {
        try {
            let msg;
            const {
                cid: camp_id,
                status,
                aff_sub2: uid,
                sid: hash,
            } = req.body;

            const network = 'inovatedm';
            
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            const offerProcess = await OfferProcess.findOne({ uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    // const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    kochavaPostback: async (req, res) => {
        try {
            let msg;
            const {
                click_id: hash,
                event_name,
                revenue: reward,
                device_ip,
                ios_idfa,
                timestamp,
                android_id,
                adid,
                creative_id,
                site_id,
                tracking_partner,
                can_claim,
            } = req.body;

            const network = 'Kochava';
            let status = req.body.status;
            if(status){
                status = status;
            }else{
                status = 1;
            }
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const uid = offerProcess.uid;
            const camp_id = offerProcess.campaign_id;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offerId = offer._id;
            let events = JSON.parse(offer.adgatemedia_events);
            events = events.filter(item => item.payout !== 0);
            const totalEvents = events.length;

            let userPoints = 0;
            let offer_ratio;
            let currency;
            let split_currency;
            let pointIntoDollar;
            let defaultCut;
            let pubCut;

            if (reward) {
                const app = await App.findOne({ _id: placement_id });
                if (app) {
                    offer_ratio = app.ratio;
                    currency = app.currency;
                    split_currency = app.split_currency;
                    pointIntoDollar = reward / split_currency;
                    defaultCut = pointIntoDollar * (70 / 100);  // OFFER_RATE is 70
                    pubCut = defaultCut * (offer_ratio);
                } else {
                    const user = await User.findOne({ _id: uid });
                    offer_ratio = user.offerwall_ratio;
                    currency = user.offerwall_currency;
                    split_currency = user.split_currency;
                    pointIntoDollar = reward / split_currency;
                    defaultCut = pointIntoDollar * (70 / 100);  // OFFER_RATE is 70
                    pubCut = defaultCut * (offer_ratio);
                }

                points = defaultCut;
                userPoints = pubCut;
            } else if (reward == 0) {
                points = 0.00;
                userPoints = 0.00;
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status > 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Invalid offer status.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Invalid offer status.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 0) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, userPoints, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.total_success_credit = points;
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const pub_payout = points;
            const user_payout_event = userPoints * split_currency;
            const offerEvent = new OfferEvents({
                uid,
                event_id: e_id,
                event_name,
                offer_id: offerId,
                pub_payout,
                user_payout: user_payout_event,
                sid,
                datetime: new Date()
            });
            await offerEvent.save();

            offerProcess.total_success_credit += points;
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, userPoints, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    listenpadPostback: async (req, res) => {
        try {
            let msg;
            let{
                sid: uid,
                tid: hash
            } = req.body;

            const network = 'ListenPad';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            uid = offerProcess.uid;
            const camp_id = offerProcess.campaign_id;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    mobsuccessPostback: async (req, res) => {
        try {
            let msg;
            let{
                pvs: uid,
                v: hash
            } = req.body;

            const network = 'Mobsuccess';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            uid = offerProcess.uid;
            const camp_id = offerProcess.campaign_id;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    PanelandPostback: async (req, res) => {
        try {
            let msg;
            const{
                Uid: hash
            } = req.body;

            const network = 'Paneland';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const offerProcess = await OfferProcess.findOne({ code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           const uid = offerProcess.uid;
            const camp_id = offerProcess.campaign_id;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    pollfishPostback: async (req, res) => {
        try {
            let msg;
            const{
                sub_id,
                click_id
            } = req.body;

            const network = 'Pollfish';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const request = json_encode(req.body);
            const test = new Test({ request });
            await test.save();
            const offerProcess = await OfferProcess.findOne({uid: sub_id, sid: click_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: null,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           const uid = offerProcess.uid;
           const camp_id = offerProcess.campaign_id;
           const hash = offerProcess.code;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            if (offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id && offerProcess.code !== hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && offerProcess.code == hash) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    redfirenetworkPostback: async (req, res) => {
        try {
            let msg;
            const{
                cid: camp_id,
                status,
                sid: hash,
                pid: uid
            } = req.body;

            const network = 'RedFireNetwork';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }
            const offerProcess = await OfferProcess.findOne({uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === '-1') {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && offerProcess.code == hash) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    RevenueclickPostback: async (req, res) => {
        try {
            let msg;
            let{
                sub1: hash,
                sub2: uid
            } = req.body;

            const network = 'RevenueClick';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const offerProcess = await OfferProcess.findOne({code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            uid = offerProcess.uid;
            const camp_id = offerProcess.campaign_id;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            if(offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id){
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && offerProcess.code == hash) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    romPostback: async (req, res) => {
        try {
            let msg;
            const{
                transaction_id: hash
            } = req.body;

            const network = 'rom';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const offerProcess = await OfferProcess.findOne({code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const uid = offerProcess.uid;
            const camp_id = offerProcess.campaign_id;
            const password = 'CPA12321';
            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            if(offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id){
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && offerProcess.code == hash) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    WannadsPostback: async (req, res) => {
        try {
            let msg;
            const{
                cid: camp_id,
                status,
                sub_id2: uid,
                subId: hash
            } = req.body;

            const network = 'Wannads';
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offerProcess = await OfferProcess.findOne({uid: uid, code: hash, campaign_id: camp_id, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && offerProcess.code == hash) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    xentrafficPostback: async (req, res) => {
        try {
            let msg;
            const{
                sub1: hash
            } = req.body;

            const network = 'XEntraffic';
            const status = 1;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            const offerProcess = await OfferProcess.findOne({code: hash, network: network });

            if (!offerProcess) {
                const pblog = new Pblog({
                    network,
                    campid: null,
                    sid1: null,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const uid = offerProcess.uid;
            const camp_id = offerProcess.campaign_id;

            if (!uid || !camp_id || !hash) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            if(offerProcess.uid !== uid && offerProcess.campaign_id !== camp_id){
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
           
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && offerProcess.code == hash) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1 || status !== 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
    
    yunoPostback: async (req, res) => {
        try {
            let msg;
            const{
                status,
                uid,
                hash
            } = req.body;
            const ip = req.ip;
            const uri = req.originalUrl;
            // console.log("uri: ", uri);
            // return false;
            if (!uid || !hash) {
                const pblog = new Pblog({
                    network: null,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Missing required variables',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Missing required variables.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const loginUser = await User.findOne({ _id: uid });
            if (!loginUser) {
                const pblog = new Pblog({
                    network: null,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Username',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Username.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            let loginUserReferrerId = loginUser.referrer_id;
            if (!loginUserReferrerId) {
                loginUserReferrerId = 0;
            }

            const offerProcess = await OfferProcess.findOne({uid: uid, code: hash});

            if (!offerProcess) {
                const pblog = new Pblog({
                    network: null,
                    campid: null,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer Process',
                    app_id: null
                });
                await pblog.save();

                msg = 'Invalid Offer Process.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const camp_id = offerProcess.campaign_id;
            const network = offerProcess.network;
            const offer_id = offerProcess.offer_id;
            let points = offerProcess.credits;
            let userPoints = points;
            const ref_points = offerProcess.ref_credits;
            const link_id = offerProcess.link_id;
            const country = offerProcess.country;
            const offerName = offerProcess.offer_name;
            const ipAddress = offerProcess.ip;
            const placement_id = offerProcess.app_id;
            const sId = offerProcess.sid;
            const sid2 = offerProcess.sid2;
            const sid3 = offerProcess.sid3;
            const sid4 = offerProcess.sid4;
            const sid5 = offerProcess.sid5;
            const currentStatus = offerProcess.status;

            checkNetwork = await Network.findOne({name: network});
            if(!checkNetwork){
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Advertiser not available. Please try other offer.',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Advertiser not available. Please try other offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const ips = checkNetwork.ips;
            if (ips) {
                let ip_arr = [];
    
                if (ips.includes(",")) {
                    ip_arr = ips.split(",");
                } else {
                    ip_arr.push(ips);
                }
    
                if (!ip_arr.includes(ip)) {
                    const pblog = new Pblog({
                        network,
                        campid: camp_id,
                        sid1: uid,
                        sid2: hash,
                        status,
                        ip,
                        date: new Date(),
                        request_uri: uri,
                        type: 'Regular',
                        user_payout: 0,
                        pub_payout: 0,
                        response: 'Invalid authentication.',
                        app_id: placement_id
                    });
                    await pblog.save();
    
                    msg = 'Invalid authentication.';
                    const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            }
    
            const offer = await Offer.findOne({ campaign_id: camp_id, active: 1, network: network });
            if (!offer) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: 0,
                    pub_payout: 0,
                    response: 'Invalid Offer',
                    app_id: placement_id
                });
                await pblog.save();

                msg = 'Invalid Offer.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 2) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been reversed.',
                    app_id: placement_id
                });

                await pblog.save();

                msg = 'Offer has been reversed.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (status === 2) {

                if (currentStatus === 1) {

                    const transaction = await Transaction.findOne({ uid: uid, offer_id: camp_id, network: network, hash: hash, type: 'credit' });
                    transaction.credits = 0.00;
                    transaction.type = 'Reversed';
                    transaction.date = new Date();
                    await transaction.save();
                    loginUser.balance -= points;
                    // loginUser.balance = loginUser.balance - points;
                    await loginUser.save();

                    if (offer.network == network && offer.leads > 0) {
                        offer.leads -= 1;
                        await offer.save();
                    }

                    await AdminEarnings.findOneAndDelete({ hash: hash, network: network, campaign_id: camp_id });

                    if (loginUserReferrerId) {
                        await Transaction.findOneAndDelete({
                            uid: loginUserReferrerId,
                            referral_id: uid, offer_id: camp_id, network: network, hash: hash,
                            type: 'credit'
                        });
                        const referrerUser = await User.findOne({ uid: loginUserReferrerId });
                        referrerUser.balance -= ref_points;
                    }
                    const postbackUrl = await sendPostback(uid, offer_id, 2, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);
                }

                if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && offerProcess.code == hash) {
                    offerProcess.status = 2;
                    offerProcess.date = new Date();
                    await offerProcess.save();
                }
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer not Approved.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer not Approved..';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (currentStatus === 1) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Offer has been processed already.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Offer has been processed already.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (offerProcess.campaign_id == camp_id && offerProcess.status !== 2 && offerProcess.uid == uid && offerProcess.network == network && status == 0) {
            offerProcess.status = 1;
            offerProcess.date = new Date();
            await offerProcess.save();
            }
            loginUser.balance += points;
            // loginUser.balance = loginUser.balance + points;
            const userBalanceUpdate = await loginUser.save();
            if (!userBalanceUpdate) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while crediting user.',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while crediting user.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const newTransaction = new Transaction({
                uid,
                link_id,
                gw_id: 0,
                referral_id: 0,
                offer_id: camp_id,
                offer_name: offerName,
                credits: points,
                type: 'credit',
                date: new Date(),
                network,
                hash,
                ip,
                country,
                app_id: placement_id
            });
            await newTransaction.save();

            if (!newTransaction) {
                const pblog = new Pblog({
                    network,
                    campid: camp_id,
                    sid1: uid,
                    sid2: hash,
                    status,
                    ip,
                    date: new Date(),
                    request_uri: uri,
                    type: 'Regular',
                    user_payout: userPoints,
                    pub_payout: points,
                    response: 'Error occured while adding user earning log',
                    app_id: placement_id
                });

                await pblog.save();
                msg = 'Error occured while adding user earning log.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            if (offer.network == network && offer.campaign_id == camp_id) {
                offer.leads += 1;
                await offer.save();
            }

            const readyDownload = new ReadyDownloads({
                hash,
                file_id: link_id,
                date: new Date(),
                download_type: 'Regular'
            });
            await readyDownload.save();

            const postbackUrl = await sendPostback(uid, offer_id, status, camp_id, network, points, sId, sid2, sid3, sid4, sid5, ip, hash, placement_id);


            msg = 'Postback url';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, postbackUrl);
            return res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

};