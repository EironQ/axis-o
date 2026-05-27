import { db } from './src/config/database'
import { settings } from './src/db/schema'
import { eq } from 'drizzle-orm'

async function checkPayPalConfig() {
  console.log('Checking PayPal configuration in database...')
  
  try {
    const paypalSettings = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(eq(settings.key, 'paypal_client_id'))
    
    if (paypalSettings.length > 0) {
      const clientId = paypalSettings[0].value
      console.log(`PayPal Client ID found: ${clientId ? 'SET (length: ' + clientId.length + ')' : 'EMPTY'}`)
      
      if (!clientId || clientId.trim() === '') {
        console.log('\n❌ ERROR: PayPal Client ID is empty!')
        console.log('Please configure PayPal in Admin > Settings > Payment')
      } else {
        console.log('\n✅ PayPal Client ID is configured')
      }
    } else {
      console.log('\n❌ ERROR: PayPal Client ID not found in database!')
      console.log('Please configure PayPal in Admin > Settings > Payment')
    }
    
    // Check other PayPal settings
    const allSettings = await db.select().from(settings)
    const paypalKeys = allSettings.filter(s => s.key.startsWith('paypal_'))
    console.log('\n--- All PayPal settings ---')
    paypalKeys.forEach(s => {
      const maskedValue = s.key.includes('secret') ? '***' : (s.value?.substring(0, 20) + '...')
      console.log(`${s.key}: ${maskedValue}`)
    })
    
  } catch (error) {
    console.error('Error checking PayPal config:', error)
  } finally {
    process.exit(0)
  }
}

checkPayPalConfig()