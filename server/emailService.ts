import sgMail from '@sendgrid/mail';

// Initialize SendGrid with the API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API key configured successfully');
} else {
  console.warn('SendGrid API key not found. Email functionality will not work.');
}

// Verify that we have a verified sender
if (process.env.SENDGRID_VERIFIED_SENDER) {
  console.log(`Using verified sender: ${process.env.SENDGRID_VERIFIED_SENDER}`);
} else {
  console.warn('SendGrid verified sender not found. Email functionality will not work properly.');
}

interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Sends an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }
    
    if (!process.env.SENDGRID_VERIFIED_SENDER) {
      throw new Error('SendGrid verified sender not configured');
    }

    // Always use the verified sender from environment
    const message = {
      to: options.to,
      from: process.env.SENDGRID_VERIFIED_SENDER,
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
      attachments: options.attachments || [],
    };

    await sgMail.send(message);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}