const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

// Set up and return PayPal environment with your client id and secret
function environment() {
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

// Set up PayPal HTTP client instance with environment that has access credentials context
function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

module.exports = { client };