
import Offers from '../../models/offers.model.js';
import NetworkSetting from '../../models/networkSettings.model.js';
import { StatusCodes } from 'http-status-codes';

import axios from 'axios';
import strip_tags from 'striptags';
import crypto from 'crypto';
import he from 'he';
import cheerio from 'cheerio';
import { link } from 'joi';
export default {


    adgate: async (req, res) => {
        try {
            // const adgate_urll  =  await NetworkSetting.findOne({ adgate_url: { $exists: true } });
            //const adgateUrl =  adgate_urll.adgate_url;

            const adgateUrl = 'https://api.adgatemedia.com/v3/offers?aff=114895&api_key=8811ae8701bc97d5a56510e7c668c308&wall_code=naeTrGs';


            const urls = {
                iPhone: `${adgateUrl}&categories=11`,
                iPad: `${adgateUrl}&categories=10`,
                Android: `${adgateUrl}&categories=1`,
                Surveys: `${adgateUrl}&categories=16`,
            };
            const network = 'Adgatemedia';
            let offers = [];

            const keys = Object.keys(urls);
            for (let i = 0; i < keys.length; i++) {
                const ua = keys[i];
                const url = urls[ua];

                const response = await axios.get(url);
                const arrOffers = response.data;

                if (Array.isArray(arrOffers.data)) {
                    for (let offer of arrOffers.data) {
                        if (!offer.click_url || offer.payout === 0) {
                            continue;
                        }

                        const countries = offer.geo_targeting.countries;
                        let countryCodes = '';

                        for (let i = 0; i < countries.length; i++) {
                            countryCodes += countries[i].country_code;
                            if (i < countries.length - 1) {
                                countryCodes += '|';
                            }
                        }
                        const payout = offer.events.reduce((sum, event) => sum + event.payout, 0);

                        offers.push({
                            id: offer.id,
                            name: strip_tags(offer.anchor.trim()),
                            ua,
                            url: offer.click_url,
                            description: strip_tags(offer.description),
                            country: countryCodes,
                            payout,
                            epc: offer.epc,
                            preview: offer.creatives.icon,
                            events: JSON.stringify(offer.events),
                            requirements: JSON.stringify(offer.requirements),
                            preview_url: JSON.stringify(offer.preview_url),
                            network,

                        });
                    }
                }

            }


            const tableOffersData = await Offers.find();
            const existingOfferIds = [];
            for (let i = 0; i < tableOffersData.length; i++) {
                existingOfferIds.push(tableOffersData[i].offer_id);
            }

            let newOffers = [];
            let existingOffers = [];

            const fetchedOfferIds = [];
            for (let i = 0; i < offers.length; i++) {
                fetchedOfferIds.push(offers[i].id);
            }

            for (let offer of offers) {

                if (existingOfferIds.includes(offer.id)) {
                    console.log(`Offer with ID ${offer.id} already exists. Skipping.`);
                    existingOffers.push(offer);
                    continue;
                }

                console.log(`New offer found with ID ${offer.id}. Saving.`);
                newOffers.push({
                    offer_id: offer.id,
                    name: offer.name,
                    active: 1,
                    limit: 0,
                    mobile: 0,
                    browsers: offer.ua,
                    link: offer.url,
                    description: offer.description,
                    countries: offer.country,
                    credits: offer.payout,
                    epc: offer.epc,
                    preview: offer.preview,
                    adgatemedia_events: offer.events,
                    offer_requirements: offer.requirements,
                    offer_preview_url: offer.preview_url,
                    network: offer.network,

                });
            }

            if (newOffers.length) {
                await Offers.insertMany(newOffers);
            }


            const offersToUpdate = existingOfferIds.filter(id => !fetchedOfferIds.includes(id));
            await Offers.updateMany({ offer_id: { $in: offersToUpdate } }, { deleted_bit: 1 });

            console.log(`New offers saved: ${newOffers.length}`);
            console.log(`Existing offers skipped: ${existingOffers.length}`);
            console.log(`Offers marked as inactive: ${offersToUpdate.length}`);

            res.status(StatusCodes.OK).json({ newOffers, existingOffers, offersToUpdate });
        }
        catch (error) {
            console.error(`Error processing offers:`, error.message);

            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error processing offers' });
        }
    },



    farly: async (req, res) => {
        try {
            // Function to format user agents
            const formatUserAgent = (devices) => {
                let formattedDevices = [];
                for (let i = 0; i < devices.length; i++) {
                    let device = devices[i];
                    switch (device) {
                        case 'iphone':
                            formattedDevices.push('iPhone');
                            break;
                        case 'ipad':
                            formattedDevices.push('iPad');
                            break;
                        case 'ipod':
                            formattedDevices.push('iPod');
                            break;
                        case 'android_tablet':
                        case 'android_mobile':
                            formattedDevices.push('Android');
                            break;
                        default:
                            formattedDevices.push(device);
                            break;
                    }
                }
                return formattedDevices.join('|');
            };

            const network = 'Farly';
            const pubid = '3326';
            const apikey = 'Fmthgfpk1&>JmD(<[6Dh<p#3;anih[b|ANp;4]2XS1!is;8N&%CEqTD)!&+sZlTa';
            const timestamp = Math.floor(Date.now() / 1000);
            const hash = crypto.createHash('sha1').update(timestamp + apikey).digest('hex');

            const params = new URLSearchParams({
                pubid,
                timestamp,
                hash
            }).toString();

            const url = `https://www.farly.io/api/offers/v3/incent/?${params}`;
            const response = await axios.get(url);
            const arrOffers = response.data;

            if (!arrOffers) {
                throw new Error('No offers retrieved.');
            }

            const newOfferIds = [];
            const newOffers = [];
            const existingOffers = [];
            const fetchedOfferIds = [];

            const tableOffersData = await Offers.find();
            const existingOfferIds = [];
            for (let i = 0; i < tableOffersData.length; i++) {
                existingOfferIds.push(tableOffersData[i].campaign_id);
            }

            for (const offer of arrOffers) {
                const name = strip_tags(offer.name.trim());
                const desc = strip_tags(he.decode(offer.tagline?.en || ''));
                const events = JSON.stringify(offer.actions || []);
                const country = (offer.geolocation?.country || []).join('|');
                const ua = formatUserAgent(offer.device || []);
                const payout = offer.total_payout?.amount || 0;
                const epc = offer.epc || 0;
                const preview = offer.icon || '';
                const preview_url = offer.preview_url || '';
                const requirements = offer.product_description || '';
                const category = offer.payout_model || '';

                if (!payout) continue;

                newOfferIds.push(offer.id);
                fetchedOfferIds.push(offer.id);

                if (existingOfferIds.includes(offer.id)) {
                    console.log(`Offer with ID ${offer.id} already exists. Skipping.`);
                    existingOffers.push(offer);
                    continue;
                }

                newOffers.push({
                    campaign_id: offer.id,
                    name,
                    description: desc,
                    link: offer.link,
                    status: 1,
                    credits: payout,
                    limit: 0,
                    countries: country,
                    created_at: new Date(),
                    network,
                    epc,
                    mobile: 0,
                    categories:category,
                    browsers: ua,
                    preview,
                    adgatemedia_events:events,
                    offer_requirements: requirements,
                    offer_preview_url: preview_url,
                });
            }

            if (newOffers.length) {
                await Offers.insertMany(newOffers);
            }

            const offersToUpdate = existingOfferIds.filter(id => !fetchedOfferIds.includes(id));
            await Offers.updateMany({ campaign_id: { $in: offersToUpdate } }, { deleted_bit: 1 });

            console.log(`New offers saved: ${newOffers.length}`);
            console.log(`Existing offers skipped: ${existingOffers.length}`);
            console.log(`Offers marked as inactive: ${offersToUpdate.length}`);
            res.status(StatusCodes.OK).json({ newOffers, existingOffers, offersToUpdate });
        } catch (error) {
            console.error('Error fetching offers:', error.message);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error fetching offers' });
        }
    },



    fetchListenpad: async (req, res) => {

        try {
            const url = 'https://listenpad.com/zip/mpmoffers.php';
            const network = 'ListenPad';

            const response = await axios.get(url);
            const data = response.data;

            const $ = cheerio.load(data);
            const resultArray = [];

            $('tr').each((index, element) => {
                const rowData = [];
                $(element).find('td').each((i, td) => {
                    rowData.push($(td).text().trim());
                });
                resultArray.push(rowData);
            });

            const offersfetched = resultArray;

            const newOfferIds = [];
            const offers = [];

            if (Array.isArray(offersfetched)) {
                offersfetched.forEach((offer, key) => {
                    if (key === 0) return;

                    if (offer[2].includes("Non Incentive") || offer[2].includes("NO Incentive")) {
                        return;
                    }

                    const name = offer[2].trim().replace(/<\/?[^>]+>/gi, '');
                    const desc = offer[6].trim().replace(/<\/?[^>]+>/gi, '').replace(/<br>/gi, ' ');
                    const country = offer[3];
                    const payout = offer[4].replace('$', '');

                    newOfferIds.push(offer[1]);
                    offers.push({
                        offer_id: offer[1],
                        name,
                        active: 1,
                        limit: 0,
                        mobile: 0,
                        browsers: 'ALL',
                        // ua: 'All',
                        // url: offer[5],
                        description: desc,
                        countries:country,
                        categories: '',
                        credits: payout,
                        epc: 0.1,
                        preview: offer[5],
                    });
                });

                const fetchedOfferIds = [];
                for (let i = 0; i < offers.length; i++) {
                    fetchedOfferIds.push(Number(offers[i].offer_id));

                }
                const tableOffersData = await Offers.find();

                const existingOfferIds = [];
                for (let i = 0; i < tableOffersData.length; i++) {
                    existingOfferIds.push(tableOffersData[i].offer_id);
           
                }

                let newOffers = [];
                let existingOffers = [];

                for (let offer of offers) {

                    if (existingOfferIds.includes(Number(offer.offer_id))) {
                        existingOffers.push(offer);
                        continue;
                    } else {

                        newOffers.push(offer);
                    }
                }
                if (newOffers.length) {
                    await Offers.insertMany(newOffers);
                }

                const offersToUpdate = existingOfferIds.filter(offer_id => !fetchedOfferIds.includes(offer_id));
                await Offers.updateMany({ offer_id: { $in: offersToUpdate } }, { deleted_bit: 1 });

                console.log(`New offers saved: ${newOffers.length}`);
                console.log(`Existing offers skipped: ${existingOffers.length}`);
                console.log(`Offers marked as inactive: ${offersToUpdate.length}`);

                res.status(StatusCodes.OK).json({ newOffers, existingOffers, offersToUpdate });
            } else {
                res.status(StatusCodes.OK).json({ message: 'No offers fetched' });
            }

        } catch (error) {
            console.error(`Error processing offers:`, error.message);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error processing offers' });
        }

    },



    

};