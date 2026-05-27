declare module 'nodemailer' {
  export interface TransporterOptions {
    host?: string
    port?: number
    secure?: boolean
    auth?: {
      user?: string
      pass?: string
    }
    tls?: {
      rejectUnauthorized?: boolean
    }
  }

  export interface MailOptions {
    from?: string
    to?: string
    subject?: string
    text?: string
    html?: string
  }

  export interface SentMessageInfo {
    messageId: string
    envelope?: {
      from: string
      to: string[]
    }
    accepted?: string[]
    rejected?: string[]
    pending?: string[]
    response?: string
  }

  export interface Transporter {
    sendMail(options: MailOptions): Promise<SentMessageInfo>
    close(): void
  }

  export function createTransport(options: TransporterOptions): Transporter
}
