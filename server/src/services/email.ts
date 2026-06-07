import { env } from '../config'
import { getSettingsCache } from './settingsCache'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface OrderEmailData {
  orderNumber: string
  orderId: string
  customerName: string
  email: string
  items: Array<{
    name: string
    variant: string
    quantity: number
    price: string
    total: string
  }>
  subtotal: string
  shippingCost: string
  taxAmount: string
  discountAmount: string
  total: string
  currency: string
  shippingAddress: {
    firstName: string
    lastName: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
  }
  createdAt: Date
}

export const EmailService = {
  getEmailConfig: async (): Promise<{
    sendgridApiKey: string
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    fromEmail: string
    fromName: string
  }> => {
    const settings = await getSettingsCache()
    return {
      sendgridApiKey: settings.sendgrid_api_key || env.SENDGRID_API_KEY || '',
      smtpHost: settings.smtp_host || process.env.SMTP_HOST || 'smtp.qq.com',
      smtpPort: parseInt(settings.smtp_port || process.env.SMTP_PORT || '587'),
      smtpUser: settings.smtp_user || process.env.SMTP_USER || '',
      smtpPass: settings.smtp_password || process.env.SMTP_PASS || '',
      fromEmail: settings.smtp_from_email || env.EMAIL_FROM || 'axis-o@qq.com',
      fromName: settings.smtp_from_name || 'AXIS O',
    }
  },

  send: async (options: EmailOptions, smtpConfig?: {
    host?: string
    port?: number
    user?: string
    pass?: string
    fromEmail?: string
    fromName?: string
  }): Promise<{ success: boolean; error?: string }> => {
    const config = await EmailService.getEmailConfig()
    
    const effectiveConfig = {
      smtpHost: smtpConfig?.host || config.smtpHost,
      smtpPort: smtpConfig?.port || config.smtpPort,
      smtpUser: smtpConfig?.user || config.smtpUser,
      smtpPass: smtpConfig?.pass || config.smtpPass,
      fromEmail: smtpConfig?.fromEmail || config.fromEmail,
      fromName: smtpConfig?.fromName || config.fromName,
    }
    
    if (!effectiveConfig.smtpHost || !effectiveConfig.smtpUser || !effectiveConfig.smtpPass) {
      console.error(`[EmailService] SMTP configuration not properly set. Recipient: ${options.to}, Subject: ${options.subject}`)
      return { success: false, error: 'SMTP configuration not properly set' }
    }

    try {
      const nodemailer = await import('nodemailer')
      
      const transporter = nodemailer.createTransport({
        host: effectiveConfig.smtpHost,
        port: effectiveConfig.smtpPort,
        secure: effectiveConfig.smtpPort === 465,
        auth: {
          user: effectiveConfig.smtpUser,
          pass: effectiveConfig.smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })

      const info = await transporter.sendMail({
        from: `"${effectiveConfig.fromName}" <${effectiveConfig.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        html: options.html,
      })

      console.log(`Email sent successfully to ${options.to}, Message ID: ${info.messageId}`)
      return { success: true }
    } catch (error) {
      console.error('Email send error:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  sendOrderConfirmation: async (data: OrderEmailData): Promise<{ success: boolean; error?: string }> => {
    const html = generateOrderConfirmationTemplate(data)
    const subject = `Order Confirmation - #${data.orderNumber}`

    return await EmailService.send({
      to: data.email,
      subject,
      html,
    })
  },

  sendTestEmail: async (toEmail: string, smtpConfig?: {
    host?: string
    port?: number
    user?: string
    pass?: string
    fromEmail?: string
    fromName?: string
  }): Promise<{ success: boolean; error?: string }> => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email - AXIS O</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f7fafc; }
    .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 15px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
    .header h1 { color: white; margin: 0; font-size: 20px; }
    .content { color: #4a5568; }
    .content h2 { color: #2d3748; margin: 0 0 10px 0; }
    .content p { margin: 10px 0; }
    .success { color: #48bb78; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AXIS O</h1>
    </div>
    <div class="content">
      <h2>✓ Email Configuration Test</h2>
      <p>This is a test email to verify that your email configuration is working correctly.</p>
      <p class="success">Your email settings are properly configured!</p>
      <p>If you received this email, the SMTP integration is working as expected.</p>
    </div>
  </div>
</body>
</html>
    `

    const subject = 'AXIS O - Email Configuration Test'

    return await EmailService.send({
      to: toEmail,
      subject,
      html,
    }, smtpConfig)
  },

  checkHealth: async (): Promise<{ healthy: boolean; message: string }> => {
    const config = await EmailService.getEmailConfig()
    
    if (!config.smtpHost) {
      return {
        healthy: false,
        message: 'SMTP server not configured',
      }
    }

    if (!config.smtpUser) {
      return {
        healthy: false,
        message: 'SMTP username not configured',
      }
    }

    if (!config.smtpPass) {
      return {
        healthy: false,
        message: 'SMTP password not configured',
      }
    }

    if (!config.fromEmail) {
      return {
        healthy: false,
        message: 'From email address not configured',
      }
    }

    return {
      healthy: true,
      message: 'Email service is properly configured',
    }
  },
}

function generateOrderConfirmationTemplate(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <h4 style="margin: 0 0 8px 0; color: #2d3748;">${item.name}</h4>
          <p style="margin: 0 0 8px 0; color: #718096; font-size: 14px;">${item.variant}</p>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          <span style="color: #2d3748;">${item.quantity}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          <span style="color: #2d3748;">${data.currency} ${item.price}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          <span style="color: #2d3748;">${data.currency} ${item.total}</span>
        </td>
      </tr>
    `
    )
    .join('')

  const formattedDate = new Date(data.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - AXIS O</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f7fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
    }
    .greeting {
      margin-bottom: 24px;
    }
    .greeting h2 {
      color: #2d3748;
      margin: 0 0 8px 0;
      font-size: 20px;
    }
    .greeting p {
      color: #718096;
      margin: 0;
      font-size: 16px;
    }
    .order-info {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .order-info p {
      margin: 8px 0;
      color: #4a5568;
      font-size: 14px;
    }
    .order-info strong {
      color: #2d3748;
    }
    .order-info .order-number {
      font-size: 18px;
      font-weight: 600;
      color: #667eea;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      text-align: left;
      padding: 12px;
      background: #edf2f7;
      color: #4a5568;
      font-weight: 600;
      font-size: 14px;
    }
    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }
    .items-table th:nth-child(2),
    .items-table td:nth-child(2) {
      text-align: center;
    }
    .total-row {
      background: #f7fafc;
    }
    .total-row td {
      padding: 16px 12px !important;
    }
    .total-label {
      font-weight: 600;
      color: #2d3748;
      font-size: 16px;
    }
    .total-amount {
      font-weight: 700;
      color: #667eea;
      font-size: 20px;
    }
    .shipping-address {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .shipping-address h3 {
      color: #2d3748;
      margin: 0 0 12px 0;
      font-size: 16px;
    }
    .shipping-address p {
      margin: 4px 0;
      color: #4a5568;
      font-size: 14px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #a0aec0;
      font-size: 14px;
      margin: 0 0 8px 0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AXIS O</h1>
    </div>
    <div class="content">
      <div class="greeting">
        <h2>Thank You for Your Order, ${data.customerName}!</h2>
        <p>We're excited to process your order. Here's a summary of your purchase:</p>
      </div>
      
      <div class="order-info">
        <p class="order-number">Order #${data.orderNumber}</p>
        <p><strong>Order Date:</strong> ${formattedDate}</p>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr>
            <td colspan="3" style="padding: 12px; text-align: right;"><strong>Subtotal</strong></td>
            <td style="padding: 12px; text-align: right;">${data.currency} ${data.subtotal}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 12px; text-align: right;"><strong>Shipping</strong></td>
            <td style="padding: 12px; text-align: right;">${data.currency} ${data.shippingCost}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 12px; text-align: right;"><strong>Tax</strong></td>
            <td style="padding: 12px; text-align: right;">${data.currency} ${data.taxAmount}</td>
          </tr>
          ${data.discountAmount !== '0' ? `
          <tr>
            <td colspan="3" style="padding: 12px; text-align: right;"><strong>Discount</strong></td>
            <td style="padding: 12px; text-align: right; color: #48bb78;">-${data.currency} ${data.discountAmount}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="3" class="total-label" style="text-align: right;">Total</td>
            <td class="total-amount">${data.currency} ${data.total}</td>
          </tr>
        </tbody>
      </table>

      <div class="shipping-address">
        <h3>Shipping Address</h3>
        <p>${data.shippingAddress.firstName} ${data.shippingAddress.lastName}</p>
        <p>${data.shippingAddress.line1}${data.shippingAddress.line2 ? '<br>' + data.shippingAddress.line2 : ''}</p>
        <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
        <p>${data.shippingAddress.country}</p>
        <p>Phone: ${data.shippingAddress.phone}</p>
      </div>

      <div class="footer">
        <p>You can view your order details by logging into your account.</p>
        <p>If you have any questions, please contact us at <a href="mailto:axis-o@qq.com">axis-o@qq.com</a>.</p>
        <p>Thank you for shopping with AXIS O!</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}
