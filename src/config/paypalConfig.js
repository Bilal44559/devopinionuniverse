import paypal from 'paypal-rest-sdk';

paypal.configure({
    mode: 'sandbox', // Set to 'live' when you're ready to go live
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

export default paypal;