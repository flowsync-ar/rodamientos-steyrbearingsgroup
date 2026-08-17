import 'server-only'
import nodemailer from 'nodemailer'

const HOST = process.env.SMTP_HOST
const PORT = Number(process.env.SMTP_PORT ?? 465)
const USER = process.env.SMTP_USER
const PASSWORD = process.env.SMTP_PASSWORD
const FROM_NAME = process.env.SMTP_FROM_NAME ?? 'Steyr Bearing Group'

export function isSmtpConfigured(): boolean {
  return Boolean(HOST && USER && PASSWORD)
}

function createTransporter() {
  return nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    auth: { user: USER!, pass: PASSWORD! },
  })
}

function fromAddress(): string {
  return `"${FROM_NAME}" <${USER}>`
}

/**
 * Sends an email via SMTP. If SMTP isn't configured, logs the send instead
 * of throwing — matches dev behavior in other Steyr/NODO projects so local
 * development doesn't require real credentials.
 */
export async function sendSmtpMail(params: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<{ sent: boolean }> {
  if (!isSmtpConfigured()) {
    console.warn('[SMTP] Not configured — skipping send. Would have sent:', {
      to: params.to,
      subject: params.subject,
    })
    return { sent: false }
  }

  const transporter = createTransporter()
  await transporter.sendMail({
    from: fromAddress(),
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })

  return { sent: true }
}
