import sgMail from '@sendgrid/mail';

// Initialize SendGrid with the API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SendGrid API key not found. Email functionality will not work.');
}

interface EmailOptions {
  to: string;
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

    // Get the sender email from the options or use the default
    const fromEmail = options.from || process.env.SENDGRID_VERIFIED_SENDER || 'test@example.com';
    
    const message = {
      to: options.to,
      from: fromEmail, // This needs to be a verified sender in SendGrid
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