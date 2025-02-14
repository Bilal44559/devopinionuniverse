import express, { query } from "express";

import mongoose from 'mongoose';
import { makeApiResponse } from '../../lib/response.js';
import { StatusCodes } from 'http-status-codes';
import userService from "../../services/user.service.js";
import User from '../../models/user.model.js';
import { getJWTToken } from '../../lib/utils.js';
import Admin from '../../models/admin.model.js';
import AdminEarnings from '../../models/adminearnings.model.js';
import Adminpermissions from '../../models/adminpermissions.model.js';
import AdminRoles from '../../models/adminRoles.model.js';
import AdminRolePermissions from '../../models/adminRolesPermissions.model.js';
import AdsCreditTransactionsHistory from '../../models/adsCreditTransactionsHistory.model.js';
import AdvertiserApp from '../../models/advertiserApps.model.js';
import AdvertiserCampaign from '../../models/advertiserCampaigns.model.js';
import AdvertiserFundsHistory from '../../models/advertiserFundsHistory.model.js';
import ApiKey from '../../models/apiKeys.model.js';
import App from '../../models/apps.model.js';
import CampaignProcess from '../../models/campaignProcess.model.js';
import BannedOffer from '../../models/bannedOffers.model.js';
import CampaignSpendHistory from '../../models/campaignSpendHistory.model.js';
import CashoutLog from '../../models/cashoutlogs.model.js';
import ContactMessage from '../../models/contactMessages.model.js';
import cronjobHistory from '../../models/cronJobHistory.model.js';
import deletedOffer from '../../models/deletedOffers.model.js';
import EmailQueues from '../../models/emailQueues.model.js';
import EmailQueuesHistory from '../../models/emailQueueHistory.model.js';
import Gateway from '../../models/gateways.model.js';
import GwSession from '../../models/gw_sessions.model.js';
import GwStats from '../../models/gw_stats.model.js';
import Ipban from '../../models/ipbans.model.js';
import IsPbRecieved from '../../models/is_pb_recievered.model.js';
import Links from '../../models/links.model.js';
import LiveSurveyQuestion from '../../models/liveSurveyQuestionaries.model.js';
import LiveSurveyQuestionlibrary from '../../models/liveSurveyQuestionariesLibarary.model.js';
import Message from '../../models/messages.model.js';
import Network from '../../models/networks.model.js';
import NetworkSetting from '../../models/networkSettings.model.js';
import News from '../../models/news.model.js';
import Offer from '../../models/offers.model.js';
// import OfferWallApiKey from '../../models/offerwallapikeys.model.js';
import OfferEvents from '../../models/offerevents.model.js';
import OfferProcess from '../../models/offerprocess.model.js';
import PbLog from '../../models/pblog.model.js';
import PbSent from '../../models/pb_sent.model.js';
import PbSettings from '../../models/pbsettings.model.js';
import PendingUsers from '../../models/pendingusers.model.js';
import PublisherHiddenOffer from '../../models/publisher_hidden_offers.model.js';
import QuestionnariesResult from '../../models/questionnaire_results.model.js';
import ReadyDownloads from '../../models/ready_downloads.model.js';
import Setting from '../../models/settings.model.js';
import Transaction from '../../models/transactions.model.js';
import Test from '../../models/test.model.js';
import UserDemography from '../../models/userDemography.model.js';
import userQuestionsAttempt from '../../models/userQuestionAttempts.model.js';
import UserRejectedOffer from '../../models/userRejectedOffers.model.js';
import Campaign from '../../models/campaigns.model.js';
import crypto from 'crypto';
import capLimit from "../../models/capLimit.model.js";


export default {

    async login(req, res) {
        try {
            console.log('try');
        } catch (err) {
            console.log('error: ', err);
        }
    },

    async testModals(req, res) {
        try {

            const { modal, run } = req.body;

            if (modal == 'admin' && run) {
                const newAdmin = new Admin({
                    aid: 1,
                    admin_user: 'adminUser',
                    admin_password: 'adminPass',
                    active: 1,
                    date: new Date(),
                    admin_role_id: 1
                });

                await newAdmin.save();
                console.log('Admin inserted successfully');

            }
            else if (modal == 'adminearnings' && run) {
                const newAdminEarnings = new AdminEarnings({
                    id: 1001,
                    credits: 'adfa',
                    campaign_id: 'CMP1234567',
                    network: 'NetworkName',
                    offer_name: 'Special Offer',
                    uid: 1234567890,
                    date: new Date(),
                    hash: 'abcdef1234567890',
                    offer_id: 2002,
                    country: 'USA'
                });
                await newAdminEarnings.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'campaign' && run) {
                const Campaigns = new Campaign({
                    title: 'Summer Sale',
                    description: 'Huge discounts on summer items!',
                    ads_url: 'http://example.com/summer-sale',
                    image: 'http://example.com/summer-sale.jpg',
                    no_of_views: 1500,
                    duration: '30 days',
                    pid: 101,
                    status: 1,
                    datetime: new Date(),
                    country: 'USA',
                    payout: 150.00,
                    per_click_value: 0.10,
                    views: 1500,
                    views_amount: 150.00,
                });
                await Campaigns.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'adminpermissions' && run) {
                const adminPermissions = new Adminpermissions({
                    id: 1,

                    name: 'Jhon',
                    type: 'newType',

                });
                await adminPermissions.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'userRejectedOffer' && run) {
                const userRejectedOffers = new UserRejectedOffer({
                    id: 1,
                    uid: 10001,
                    country_code: 'US',
                    campid: 'CAMP001',
                    network: 'NetworkA'
                });
                await userRejectedOffers.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'userQuestionsAttempts' && run) {
                const userQuestionsAttempts = new userQuestionsAttempt({
                    id: 1,
                    uid: 1001,
                    sid: 'SID001',
                    qid: 10,
                    answer_status: 'Correct',
                    datetime: new Date('2024-07-01T10:00:00Z'),
                    answer: 'A',
                    user_answer: 'A'
                });
                await userQuestionsAttempts.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'test' && run) {
                const Tests = new Test({
                    id: 1,

                    request: 'test1,test2',


                });
                await Tests.save();
                console.log('test inserted successfully');
            }
            else if (modal == 'transaction' && run) {
                const Transactions = new Transaction({
                    id: 12,
                    uid: 12,
                    link_id: '123456789012345678901234',
                    gw_id: '123456789012345678901234',
                    referral_id: '123456789012345678901234',
                    offer_id: '123456789012345678901234',
                    offer_name: 'Special Offer',
                    credits: 50.00,
                    type: 'CREDIT',
                    date: new Date(),
                    network: 'Network A',
                    hash: 'abc123hash',
                    ip: '192.168.1.1',
                    country: 'US',
                    app_id: 1


                });
                await Transactions.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'pbLog' && run) {
                const PbLogs = new PbLog({
                    id: 1,
                    network: 'NetworkName',
                    campid: 12345,
                    sid1: 'SID12345',
                    sid2: 'SID67890',
                    status: true,
                    ip: '192.168.1.1',
                    date: new Date(),
                    request_uri: '/api/request/uri',
                    type: 'SampleType',
                    user_payout: 50.75,
                    pub_payout: 100.50,
                    response: 'Sample response',
                    app_id: 789
                });
                await PbLogs.save();
                console.log('pb Logs inserted successfully');
            }
            // else if (modal == 'offerwallapiKey' && run) {
            //     const OfferWallApiKeys = new OfferWallApiKey({
            //         id: 1,
            //         api_key: 'sample-api-key-123456',
            //         status: 'active',
            //         datetime: new Date()
            //     });

            //     await OfferWallApiKeys.save();
            //     console.log('Offer wall api key inserted successfully');
            // }
            else if (modal == 'pbsent' && run) {
                const PbSents = new PbSent({
                    id: 1,
                    uid: 1234567890,
                    campid: 'CMP12345',
                    network: 'NetworkName',
                    url: 'http://example.com',
                    status: 1,
                    date: new Date(),
                    pb_response: 'Sample PB response',
                    offer_id: 9876543210,
                    payout: 100.50,
                    sid: 'SID1',
                    sid2: 'SID2',
                    sid3: 'SID3',
                    sid4: 'SID4',
                    sid5: 'SID5',
                    ip: '192.168.1.1',
                    tid: 'TID12345',
                    event_id: 'EVT12345',
                    event_name: 'EventName',
                    app_id: 789
                });

                await PbSents.save();
                console.log('Offer wall api key inserted successfully');
            }
            else if (modal == 'adminroles' && run) {
                const adminRoles = new AdminRoles({
                    id: 1,

                    name: 'Jhon',


                });
                await adminRoles.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'userDemography' && run) {
                const UserDemographys = new UserDemography({
                    id: 1,
                    pubid: 101,
                    date: new Date('2024-07-01'),
                    status: 1,
                    sid: 'SID001',
                    question: 'What is your favorite color?',
                    answer: 'Blue',
                    question_key: 'color',
                    survey_platform: 'SurveyMonkey'
                });
                await UserDemographys.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'network' && run) {
                const Networks = new Network({
                    id: 1,
                    name: 'mike',
                    active: 1,
                    parameter: 'Sample Parameter',
                    ips: '192.168.1.1',
                    complete: 1,
                    reversal: null
                });

                await Networks.save();
                console.log('Network data inserted successfully');
            }
            else if (modal == 'networksettings' && run) {
                const NetworkSettings = new NetworkSetting({
                    adscend_pub_id: 'sample_adscend_pub_id',
                    adscend_key: 'sample_adscend_key',
                    adgate_url: 'http://example.com/adgate',
                    adwork_url: 'http://example.com/adwork',
                    cpalead_url: 'http://example.com/cpalead',
                    cpagrip_url: 'http://example.com/cpagrip',
                    bluetrackmedia_url: 'http://example.com/bluetrackmedia',
                    firalmedia_url: 'http://example.com/firalmedia'
                });
                await NetworkSettings.save();
                console.log('Network data inserted successfully');
            }
            else if (modal == 'cronjobhistory' && run) {
                const cronjobHistorry = new cronjobHistory({
                    id: 1,
                    file_name: 'example_file.txt',
                    time: '12:30:45',
                    date: new Date('2024-07-26')

                });
                await cronjobHistorry.save();
                console.log('Admin earnings inserted successfully');
            }

            else if (modal == 'settings' && run) {
                const Settings = new Setting({
                    option: "abc",
                    value: "def"
                });
                await Settings.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'news' && run) {
                const New = new News({
                    id: 1,
                    title: 'Sample Article Title',
                    written_by: 'John Doe',
                    description: 'This is a sample description for the article.',
                    date: new Date(),
                    img: 'http://example.com/sample-image.jpg'
                });
                await New.save();
                console.log('News inserted successfully');
            }
            else if (modal == 'contractmessages' && run) {
                const ContactMessages = new ContactMessage({
                    id: 1,
                    contact_name: 'John Doe',
                    contact_email: 'johndoe@example.com',
                    contact_subject: 'Inquiry about services',
                    contact_message: 'I would like to know more about your services.',
                    contact_date: new Date(),
                    reply: 0,
                    reply_id: null
                });
                await ContactMessages.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'adminpermissionroles' && run) {
                const adminPermissionRoles = new AdminRolePermissions({
                    id: 1,

                    admin_permission_id: 12,
                    admin_role_id: 45,


                });
                await adminPermissionRoles.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'offerprocess' && run) {
                const OfferProcesses = new OfferProcess({
                    id: 1,
                    campaign_id: 'campaign-001',
                    offer_name: 'Sample Offer',
                    uid: 12,
                    code: 'XYZ123',
                    status: 1,
                    date: new Date(),
                    completed_date: new Date(),
                    reversed_date: new Date(),
                    ip: '192.168.1.1',
                    credits: 100.50,
                    ref_credits: 50.25,
                    network: 'SampleNetwork',
                    offer_id: 'offer-123',
                    link_id: 9876543210,
                    gw_id: 1234567890,
                    credit_mode: 'default',
                    country: 'USA',
                    source: 'web',
                    unique: 1,
                    user_agent: 'Mozilla/5.0',
                    sid: 'sample-sid',
                    sid2: 'sample-sid2',
                    sid3: 'sample-sid3',
                    sid4: 'sample-sid4',
                    sid5: 'sample-sid5',
                    total_success_credit: 200.75,
                    app_id: 789
                });
                await OfferProcesses.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'adscredittransactionsHistory' && run) {
                const adscredittransactionshistory = new AdsCreditTransactionsHistory({
                    id: 1,
                    uid: 23,

                    response: 'yes',
                    datetime: new Date(),
                    type: 'new',
                    amount: 450,


                });
                await adscredittransactionshistory.save();
                console.log('Admin earnings inserted successfully');
            }
            else if (modal == 'offers' && run) {
                const offersData = new Offer({
                    id: 2,
                    name: 'Sample Offer Name',
                    description: 'This is a sample description for the offer.',
                    link: 'http://example.com/sample-offer',
                    active: 1,
                    credits: '100',
                    hits: 1234,
                    limit: 10,
                    countries: 'US, CA',
                    date: new Date(),
                    network: 'SampleNetwork',
                    campaign_id: 'CAMPAIGN123',
                    leads: 567,
                    epc: '0.50',
                    mobile: 1,
                    categories: 'Category1, Category2',
                    cr: '1.00',
                    views: 7890,
                    conv: '0.25',
                    browsers: 'Chrome, Firefox',
                    uid: 12,
                    preview: 'http://example.com/preview-image.jpg',
                    adgatemedia_events: 'Some long text data',
                    offer_requirements: 'Some offer requirements',
                    offer_preview_url: 'http://example.com/offer-preview',
                    deleted_bit: 0,
                    deleted_date: null
                });

                await offersData.save();
                console.log('Offers data inserted successfully');
            }
            else if (modal == 'advertiserapp' && run) {
                const AdvertiserApps = new AdvertiserApp({
                    id: 1,
                    name: 'Example App',
                    image: 'https://example.com/image.png',
                    description: 'This is a description of the example app.',
                    app_id: 'example-app-id',
                    url: 'https://example.com',
                    store: 'Example Store',
                    country_code: 'US',
                    language: 'English',
                    status: 1,
                    uid: 23,
                    events: 'Example events data',
                    attribution: 'appsFlyer',
                    attribution_link: 'https://example.com/attribution',
                    datetime: new Date()

                });
                await AdvertiserApps.save();
                console.log('Advertiser Apps inserted successfully');
            }
            else if (modal == 'advertisercampaign' && run) {
                const AdvertiserCampaigns = new AdvertiserCampaign({
                    id: 1,
                    advertiser_app_id: 123,
                    campaign_name: 'Summer Sale Campaign',
                    start_date: new Date('2024-08-01T00:00:00Z'),
                    end_date: new Date('2024-08-31T23:59:59Z'),
                    daily_budget: 1000.00,
                    total_budget: 30000.00,
                    operation_system: 'iOS',
                    min_version: 14,
                    max_version: 16,
                    platforms: 'iPhone, iPad',
                    countries: 'US, CA',
                    paid_event_id: 'event123',
                    event_paid_value: '50.00',
                    campaign_description: 'A campaign to promote our summer sale.',
                    campaign_requirements: 'Must use discount code SUMMER2024',
                    status: 1,
                    uid: 45,
                    datetime: new Date()

                });
                await AdvertiserCampaigns.save();
                console.log('Advertiser Campaigns inserted successfully');
            }
            else if (modal == 'advertiserfundshistory' && run) {
                const AdvertiserFundsHistories = new AdvertiserFundsHistory({
                    id: 1,
                    uid: 23,

                    amount: 450,

                    type: 'new',

                    datetime: new Date(),
                });
                await AdvertiserFundsHistories.save();
                console.log('Advertiser Campaigns inserted successfully');
            }
            else if (modal == 'offerevents' && run) {
                const OfferEvent = new OfferEvents({
                    id: 1,
                    uid: 123,
                    event_id: 'event-001',
                    event_name: 'Sample Event',
                    offer_id: 456,
                    pub_payout: 100.50,
                    user_payout: 75.25,
                    sid: 'sample-sid-789',
                    datetime: new Date() // Use the current date and time
                });
                await OfferEvent.save();
                console.log('offer Events inserted successfully');
            }
            else if (modal == 'campaignspendhistory' && run) {
                const CampaignSpendHistories = new CampaignSpendHistory({
                    id: 1,
                    camp_id: 23,

                    amount: 450,
                    uid: 23,



                    datetime: new Date(),
                });
                await CampaignSpendHistories.save();
                console.log('Advertiser Campaigns inserted successfully');
            }
            else if (modal == 'readydownload' && run) {
                const ReadyDownload = new ReadyDownloads({
                    id: 1,
                    hash: 'samplehash1234567890',
                    file_id: 9367345645,
                    date: new Date(),
                    download_type: 'regular'
                });

                await ReadyDownload.save();
                console.log('Advertiser Campaigns inserted successfully');
            }
            else if (modal == 'questionnariesresults' && run) {
                const CampaignSpendHistories = new QuestionnariesResult({
                    id: 1,
                    uid: 12345,
                    sid: 'exampleSID',
                    result: 'Passed',
                    marks: 85,
                    datetime: new Date()
                });

                await CampaignSpendHistories.save();
                console.log('Advertiser Campaigns inserted successfully');
            }
            else if (modal == 'cashoutlog' && run) {
                const CashoutLogs = new CashoutLog({
                    id: 1,
                    uid: 23,
                    amount: 450,

                    datetime: new Date(),
                });
                await CashoutLogs.save();
                console.log('Advertiser Campaigns inserted successfully');
            }
            else if (modal == 'campaignProcess' && run) {
                const campaignProcess = new CampaignProcess({
                    id: 1,
                    camp_id: 101,
                    title: 'Sample Campaign Title',
                    description: 'This is a sample description for the campaign.',
                    ads_url: 'https://example.com/ad',
                    image: 'https://example.com/image.png',
                    no_of_views: 1000,
                    duration: '30 days',
                    pid: 500,
                    status: 1,
                    datetime: new Date(),
                    completed_datetime: new Date(),
                    reversed_datetime: new Date(),
                    country: 'USA',
                    payout: '123',
                    per_click_value: '345',
                    views: 1000,
                    views_amount: '457',
                    code: 'XYZ123',
                    sid: 'sid1',
                    sid2: 'sid2',
                    sid3: 'sid3',
                    sid4: 'sid4',
                    sid5: 'sid5',
                    ip: '192.168.1.1',
                    source: 'Google Ads',
                    user_agent: 'Mozilla/5.0',
                    app_id: 10
                });
                await campaignProcess.save();
                console.log('Campaigns Process inserted successfully');
            }
            else if (modal == 'advertiserfundshistory' && run) {
                const Apps = new App({
                    id: 1,
                    uid: 45,
                    app_name: 'Sample App',
                    unique_id: 'unique123',
                    website_url: 'https://example.com',
                    datetime: new Date(),
                    currency: 'USD',
                    split_currency: 1,
                    ratio: 100,
                    logo: 'logo.png',
                    categories: 'All',
                    primary_clr: '#FF0000',
                    secondary_clr: '#00FF00',
                    text_clr: '#0000FF',
                    api_key: 'apikey123456',
                    api_key_status: 1,
                    postback_url: 'https://example.com/postback',
                    currency_status: 1,
                    ip: 1234567890
                });
                await Apps.save();
                console.log('Advertiser Campaigns inserted successfully');
            }
            else if (modal == 'apiKey' && run) {
                const ApiKeys = new ApiKey({
                    id: 1,
                    uid: 23,

                    apikey: '450',

                    status: 'new',

                    requestBit: '0',
                });
                await ApiKeys.save();
                console.log('Advertiser Campaigns inserted successfully');
            }
            else if (modal == 'pbSettings' && run) {
                const PbSetting = new PbSettings({
                    id: 1,
                    uid: 1234567890,
                    pb_type: 'global',
                    url: 'http://example.com',
                    check_ip: 1,
                    date: new Date()
                });

                await PbSetting.save();
                console.log('PB Settings inserted successfully');
            }
            else if (modal == 'publisherHiddenOffers' && run) {
                const PublisherHiddenOfferss = new PublisherHiddenOffer({
                    id: 1,
                    uid: 154,
                    offer_id: 154,

                });

                await PublisherHiddenOfferss.save();
                console.log('PB Settings inserted successfully');
            }
            else if (modal == 'pendingusers' && run) {
                const PendingUser = new PendingUsers({

                    email: "email.123@gmal.com",
                    token: '23%#25jsths256dt57adfa3',

                });

                await PendingUser.save();
                console.log('Pending user inserted successfully');
            }
            else if (modal == 'liveSurveyQuestion' && run) {
                const LiveSurveyQuestions = new LiveSurveyQuestion({
                    id: 1,
                    uid: 1001,
                    question: 'What is the capital of France?',
                    options: 'A) Berlin, B) Madrid, C) Paris, D) Rome',
                    answer: 'C) Paris',
                    status: 1,
                    date: new Date()
                });

                await LiveSurveyQuestions.save();
                console.log('Question document inserted successfully');
            }
            else if (modal == 'liveSurveyQuestionlibrary' && run) {
                const LiveSurveyQuestionlibraries = new LiveSurveyQuestionlibrary({
                    id: 1,
                    question_id: 101,
                    question_text: 'What is your favorite color?',
                    question_type: 'Multiple Choice',
                    question_response: 'Options include Red, Blue, Green, Yellow.',
                    country_code: 'US',
                    language: 'English',
                    question_key: 'color_preference',
                    option_response: 'Red, Blue, Green, Yellow',
                    status: 0,
                    survey_platform: 'innovateLiveSurvey'
                });

                await LiveSurveyQuestionlibraries.save();
                console.log('live Survey lib  inserted successfully');
            }
            else if (modal == 'bannedoffer' && run) {
                const BannedOffers = new BannedOffer({
                    id: 1,
                    camp_id: 12,

                    network: 'abcdef',

                    date: new Date(),


                });
                await BannedOffers.save();
                console.log('Advertiser Campaigns inserted successfully');
            }
            else if (modal == 'emailqueues' && run) {
                const emailqueue = new EmailQueues({
                    id: 1,
                    recipient: 'abcdefghijklmnop',
                    subject: 'abcdef',
                    body: 'abcdefg',
                    status: 'pending'
                });

                await emailqueue.save();
                console.log('EmailQueue document inserted successfully');


            }
            else if (modal == 'emailqueueshistory' && run) {
                const emailqueuehistories = new EmailQueuesHistory({
                    id: 1,
                    recipient: 'abcdefghijklmnop',
                    subject: 'abcdef',
                    body: 'abcdefg',
                    status: 'pending'
                });

                await emailqueuehistories.save();
                console.log('EmailQueue document inserted successfully');


            }
            else if (modal == 'gwSessions' && run) {
                const Gwsession = new GwSession({
                    id: 1,
                    uid: 1001,
                    gid: 2001,
                    session_id: 'abc123',
                    complete: 1,
                    ip: '192.168.1.1',
                    date: new Date()
                });

                await Gwsession.save();
                console.log('Session document inserted successfully');


            }
            else if (modal == 'gwstats' && run) {
                const GwStat = new GwStats({
                    id: 1,
                    gid: 1001,
                    offer_camp_id: 'offer123',
                    credits: 1234.56,
                    date: new Date(),
                    hash: 'abc123hash',
                    network: 'networkName'
                });

                await GwStat.save();
                console.log('Credits document inserted successfully');


            }
            else if (modal == 'isPbRecieveds' && run) {
                const IsPbRecieveds = new IsPbRecieved({
                    id: 1,
                    network: 'networkName',
                    time: new Date(),



                });

                await IsPbRecieveds.save();
                console.log('Credits document inserted successfully');


            }
            else if (modal == 'links' && run) {
                const Link = new Links({
                    id: 1,
                    uid: 12345,
                    code: 'example_code',
                    hits: 100,
                    downloads: 50,
                    dateadded: new Date(),
                    last_download_date: new Date(),
                    description: 'This is a sample description.',
                    url: 'http://example.com'
                });

                await Link.save();
                console.log('Item document inserted successfully');


            }
            else if (modal == 'ipban' && run) {
                const Ipbans = new Ipban({

                    ip: 'offer123',
                    scope: 'abc123hash',

                    date: new Date(),

                });

                await Ipbans.save();
                console.log('ipban document inserted successfully');


            }
            else if (modal == 'messages' && run) {
                const message = new Message({
                    msg_id: 1,
                    sender: 'sender@example.com',
                    receiver: 'receiver@example.com',
                    subject: 'Sample Subject',
                    message: 'This is a sample message content.',
                    date: new Date(),
                    read: 0
                });

                await message.save();
                console.log('Message document inserted successfully');


            }
            else if (modal == 'gateway' && run) {
                const gateway = new Gateway({
                    gid: 1,
                    uid: 1001,
                    name: 'Sample Gateway',
                    title: 'Sample Title',
                    instructions: 'Sample Instructions',
                    min_offer_required: 50,
                    countries: 'US,CA',
                    background_img_url: 'https://example.com/image.jpg',
                    background_color: '#ffffff',
                    overlay_color: '#000000',
                    overlay_opacity: 50,
                    width: 300,
                    height: 250,
                    title_color: '#ff0000',
                    title_size: 18,
                    title_font: 'Arial',
                    offer_color: '#00ff00',
                    offer_size: 16,
                    offer_bold: 1,
                    offer_font: 'Verdana',
                    instructions_color: '#0000ff',
                    instructions_size: 14,
                    instructions_font: 'Tahoma',
                    border_color: '#ff00ff',
                    border_size: 2,
                    unlock_period: 30,
                    ip_lock: 1,
                    redirect_url: 'https://example.com/redirect',
                    start_delay: 10,
                    include_close: 1,
                    date: new Date(),
                    ip: '192.168.1.1',
                    wid: 2001,
                    offers_show: 10,
                    period_type: 'monthly'
                });

                await gateway.save();
                console.log('Gateway document inserted successfully');


            }
            else if (modal == 'cashout' && run) {
                const sampleData = new Payment({
                    id: 1,
                    uid: mongoose.Types.Long.fromString('123456789012345678'),
                    amount: mongoose.Types.Decimal128.fromString('1234.56'),
                    status: 'Unpaid',
                    method: 'paypal',
                    user_notes: 'Sample user notes',
                    pm_bank_owner: 'John Doe',
                    pm_bank_name: 'Sample Bank',
                    pm_bank_address: '1234 Bank St',
                    pm_bank_ifsc: 'IFSC12345',
                    admin_notes: 'Sample admin notes',
                    request_date: new Date(),
                    payment_date: new Date(),
                    email_address: 'user@example.com',
                    priority: 'normal',
                    fee: mongoose.Types.Decimal128.fromString('0.00'),
                    type: 'u.s',
                    check_payto: 'John Doe',
                    check_address: '1234 Check St',
                    check_address2: 'Apt 567',
                    check_country: 'USA',
                    first_name: 'John',
                    last_name: 'Doe',
                    dd_address: '1234 Address St',
                    city: 'Sample City',
                    state: 'Sample State',
                    zip: '12345',
                    routing_number: '123456789',
                    account_number: '987654321',
                    bank_name: 'Sample Bank',
                    bank_address: '1234 Bank St',
                    bank_city: 'Sample City',
                    bank_state: 'Sample State',
                    bank_zip: '12345',
                    bank_country: 'USA',
                    bank_routing: '123456',
                    bank_account_number: '654321',
                    benef_bank_name: 'Beneficiary Bank',
                    benef_bank_address: '5678 Beneficiary St',
                    benef_account_number: '123456',
                    benef_swift: 'SWIFT123',
                    correspondent_bank: 'Correspondent Bank'
                });

                await sampleData.save();
                console.log('Payment data inserted successfully');
            }
            else if (modal == 'advertiserfundshistory' && run) {
                const sampleData = new Campaign({
                    id: 1,
                    camp_id: 100,
                    title: 'Sample Campaign',
                    description: 'Description of the sample campaign',
                    ads_url: 'https://example.com/ads',
                    image: 'image.png',
                    no_of_views: 1000,
                    duration: '30 days',
                    pid: 123,
                    status: 1,
                    datetime: new Date(),
                    completed_datetime: new Date(),
                    reversed_datetime: new Date(),
                    country: 'US',
                    payout: mongoose.Types.Decimal128.fromString('10.00'),
                    per_click_value: mongoose.Types.Decimal128.fromString('0.50'),
                    views: 500,
                    views_amount: mongoose.Types.Decimal128.fromString('250.00'),
                    code: 'ABC123',
                    sid: 'SID001',
                    sid2: 'SID002',
                    sid3: 'SID003',
                    sid4: 'SID004',
                    sid5: 'SID005',
                    ip: '192.168.1.1',
                    source: 'Google',
                    user_agent: 'Mozilla/5.0',
                    app_id: 45
                });

                await sampleData.save();
                console.log('Campaign data inserted successfully');
                res.status(201).json({ message: 'Campaign data inserted successfully' });
            }
            res.status(StatusCodes.OK).json(req.body);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    signup: async (req, res) => {
        try {

            const { error, value } = userService.validateSignupData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            const {
                firstname,
                lastname,
                email_address,
                password,
                salt,
                address,
                city,
                state,
                zip,
                country,
                phone,
                websites,
                gender,
                referrer_id,
                active,
                ip_address,
                date_registration,
                offer_rate,
                referral_rate,
                premium_rate,
                isBan,
                isLocked,
                l_hideuser,
                l_hideEarnings,
                balance,
                promotional_methods,
                website,
                hearby,
                email_verified,
                payment_method,
                payment_cycle,
                payment_method_details,
                pm_bank_owner,
                pm_bank_name,
                pm_bank_address,
                pm_bank_ifsc,
                pm_wire_swift_code,
                pm_wire_iban_no,
                offerwall_ratio,
                offerwall_currency,
                user_type,
                logo,
                primary_color,
                secondary_color,
                text_color,
                offer_categories,
                offerwall_iframe_preview,
                split_currency,
                currency_status,
                c_first_name,
                c_last_name,
                company_name,
                c_tax_number,
                c_country,
                c_city,
                c_address,
                c_zip,
                c_phone,
                c_skype,
                c_telegram,
                ads_credit,
                signature_image,
                account_type,
                registeration_number,
                registeration_step,
                user_designation,
                currency_type,
                currency,
                funds
            } = req.body;


            let user = await User.findOne({ email_address });
            let msg = '';
            if (user) {

                user = await User.findOneAndUpdate(
                    { email_address }, // filter
                    {
                        firstname,
                        lastname,
                        password,
                        salt,
                        address,
                        city,
                        state,
                        zip,
                        country,
                        phone,
                        websites,
                        gender,
                        referrer_id,
                        active,
                        ip_address,
                        date_registration,
                        offer_rate,
                        referral_rate,
                        premium_rate,
                        isBan,
                        isLocked,
                        l_hideuser,
                        l_hideEarnings,
                        balance,
                        promotional_methods,
                        website,
                        hearby,
                        email_verified,
                        payment_method,
                        payment_cycle,
                        payment_method_details,
                        pm_bank_owner,
                        pm_bank_name,
                        pm_bank_address,
                        pm_bank_ifsc,
                        pm_wire_swift_code,
                        pm_wire_iban_no,
                        offerwall_ratio,
                        offerwall_currency,
                        user_type,
                        logo,
                        primary_color,
                        secondary_color,
                        text_color,
                        offer_categories,
                        offerwall_iframe_preview,
                        split_currency,
                        currency_status,
                        c_first_name,
                        c_last_name,
                        company_name,
                        c_tax_number,
                        c_country,
                        c_city,
                        c_address,
                        c_zip,
                        c_phone,
                        c_skype,
                        c_telegram,
                        ads_credit,
                        signature_image,
                        account_type,
                        registeration_number,
                        registeration_step,
                        user_designation,
                        currency_type,
                        currency,
                        funds
                    },
                    { new: true }
                );
                msg = 'User has been updated successfully.';
            } else {

                user = new User({
                    firstname,
                    lastname,
                    email_address,
                    password,
                    salt,
                    address,
                    city,
                    state,
                    zip,
                    country,
                    phone,
                    websites,
                    gender,
                    referrer_id,
                    active,
                    ip_address,
                    date_registration,
                    offer_rate,
                    referral_rate,
                    premium_rate,
                    isBan,
                    isLocked,
                    l_hideuser,
                    l_hideEarnings,
                    balance,
                    promotional_methods,
                    website,
                    hearby,
                    email_verified,
                    payment_method,
                    payment_cycle,
                    payment_method_details,
                    pm_bank_owner,
                    pm_bank_name,
                    pm_bank_address,
                    pm_bank_ifsc,
                    pm_wire_swift_code,
                    pm_wire_iban_no,
                    offerwall_ratio,
                    offerwall_currency,
                    user_type,
                    logo,
                    primary_color,
                    secondary_color,
                    text_color,
                    offer_categories,
                    offerwall_iframe_preview,
                    split_currency,
                    currency_status,
                    c_first_name,
                    c_last_name,
                    company_name,
                    c_tax_number,
                    c_country,
                    c_city,
                    c_address,
                    c_zip,
                    c_phone,
                    c_skype,
                    c_telegram,
                    ads_credit,
                    signature_image,
                    account_type,
                    registeration_number,
                    registeration_step,
                    user_designation,
                    currency_type,
                    currency,
                    funds
                });


                await user.save();
                msg = 'User has been created successfully.';
            }


            let result = makeApiResponse(msg, 1, StatusCodes.OK, user);

            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    stepTwoSignup: async (req, res) => {
        try {

            const { error, value } = userService.validateSignupData(req.body);
            if (error) {
                let result = makeApiResponse(error.message, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }


            const {
                email_address,
                address,
                city,
                state,
                zip,
                country,
                ip_address,
                registeration_step,
            } = req.body;


            let user = await User.findOne({ email_address });
            let msg = '';
            if (user) {

                user = await User.findOneAndUpdate(
                    { email_address },
                    {
                        address,
                        city,
                        state,
                        zip,
                        country,
                        registeration_step,
                        ip_address,
                    },
                    { new: true }
                );
                msg = 'User has been updated successfully.';
            }
            msg = 'User has been created successfully.';

            console.log(user._id);
            // let user = await User.findOne({ email_address });


            let result = makeApiResponse(msg, 1, StatusCodes.OK, user);

            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    async verifyOPT(req, res) {
        try {

            const userQury = { email: req.body.email, otp: req.body, otp };
            let user = await UserModel.findOne(userQury);
            if (!user) {
                let result = MakeApiResponce('Invalid otp', 1, BAD_REQUEST)
                return res.status(BAD_REQUEST).json(result);
            }
            user.statusBit = true;
            const token = await getJWTToken({ id: user._id });
            let userResponce;
            userResponce = {
                userData: user,
                token: token
            }
        } catch (err) {
            console.log(err);
            let result = makeApiResponce('INTERNAL_SERVER_ERROR', 0, INTERNAL_SERVER_ERROR);
            return res.status(INTERNAL_SERVER_ERROR).json(result)
        }
    },

    getAllOffers: async (req, res) => {
        try {
            let msg;
            let { page, limit, search = null } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            search = search || '';

            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            let searchQuery = {
                // deleted_bit: 0
            };
            if (search) {
                searchQuery.$or = [
                    { offer_id: search },
                ];
            }

            const offers = await Offer.find(searchQuery).skip((page - 1) * limit).limit(limit);
            const totalOffers = await Offer.countDocuments(searchQuery);
            const totalPages = Math.ceil(totalOffers / limit);

            msg = 'Get all Offers successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalOffers,
                offers
            });
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getSingleOffer: async (req, res) => {
        try {
            let msg;
            const { offer_id } = req.body;
            if (!offer_id) {
                msg = 'offer_id is required.';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            const offer = await Offer.findOne({ _id: offer_id, deleted_bit: 0 });
            msg = 'Get Single Offer successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, offer);
            res.status(StatusCodes.OK).json(result);

        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    searchOffers: async (req, res) => {
        try {
            let msg;
            let { page, limit, search, countries, categories, browsers, } = req.body;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            search = search || "";
            countries = countries || null;
            categories = categories || null;
            browsers = browsers || null;

            if (page < 1 || limit < 1) {
                msg = 'Page and limit must be positive integers';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            if (countries && !Array.isArray(countries)) countries = [countries];
            if (categories && !Array.isArray(categories)) categories = [categories];
            if (browsers && !Array.isArray(browsers)) browsers = [browsers];

            let searchQuery = {
                $and: [
                    {
                        $or: [
                            { offer_id: search },
                            { name: { $regex: search, $options: 'i' } },
                            { countries: { $regex: search, $options: 'i' } }
                        ]
                    },
                    { deleted_bit: 0 }
                ]
            };

            if (countries) {
                searchQuery.$and.push({ countries: { $in: countries } });
            }

            if (categories) {
                searchQuery.$and.push({ categories: { $in: categories } });
            }

            if (browsers) {
                searchQuery.$and.push({ browsers: { $in: browsers } });
            }

            const offers = await Offer.find(searchQuery).skip((page - 1) * limit).limit(limit);
            const totalOffers = await Offer.countDocuments(searchQuery);
            const totalPages = Math.ceil(totalOffers / limit);

            msg = 'Offers search successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, {
                page,
                limit,
                totalPages,
                totalOffers,
                offers
            });
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    generateApiKey: async (req, res) => {
        try {
            let msg;
            await ApiKey.findOneAndDelete({ uid: req.userId });

            // const uniqueId = Date.now().toString() + crypto.randomBytes(16).toString('hex');
            // const hash = crypto.createHash('md5').update(uniqueId).digest('hex');
            // const randomNum = Math.floor(Math.random() * 100000000000000000);
            // const combinedString = hash + randomNum.toString();
            // const startIndex = Math.floor(Math.random() * 9); 
            // const apiKey = combinedString.substr(startIndex, 100);

            const apiKeyLength = 64;
            const apiKey = crypto.randomBytes(apiKeyLength).toString('hex').substring(0, 48);
            const newApiKey = new ApiKey({
                uid: req.userId,
                apikey: apiKey
            });
            await newApiKey.save();
            msg = 'Your request has been sent to the admin';
            const result = makeApiResponse(msg, 1, StatusCodes.OK);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },

    getApiKey: async (req, res) => {
        try {
            let msg;
            const getApiKey = await ApiKey.findOne({ uid: req.userId });
            if (getApiKey.status == 'inactive' || getApiKey.requestBit == 'pending') {
                msg = 'Your API key request was not approved by the Admin at this time.Please contact the Admin for further assistance';
                const result = makeApiResponse(msg, 0, StatusCodes.BAD_REQUEST);
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            msg = 'Get Apikey  successfully';
            const result = makeApiResponse(msg, 1, StatusCodes.OK, getApiKey);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }
    },
}