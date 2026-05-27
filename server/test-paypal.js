const { getSettingsCache, getCachedSetting } = require('./dist/services/settingsCache');

async function testPayPalConfig() {
  console.log('Testing PayPal configuration...');
  
  try {
    await getSettingsCache();
    
    const clientId = getCachedSetting('paypal_client_id');
    const clientSecret = getCachedSetting('paypal_client_secret');
    const mode = getCachedSetting('paypal_mode');
    
    console.log('PayPal Client ID:', clientId ? 'SET (length: ' + clientId.length + ')' : 'NOT SET');
    console.log('PayPal Client Secret:', clientSecret ? 'SET (length: ' + clientSecret.length + ')' : 'NOT SET');
    console.log('PayPal Mode:', mode || 'NOT SET');
    
    if (!clientId || !clientSecret) {
      console.log('\nERROR: PayPal credentials are not configured!');
      console.log('Please configure PayPal in Admin > Settings > Payment');
    } else {
      console.log('\nSUCCESS: PayPal credentials are configured!');
    }
  } catch (error) {
    console.error('Error checking PayPal config:', error.message);
  }
}

testPayPalConfig();