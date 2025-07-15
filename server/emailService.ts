import sgMail from '@sendgrid/mail';

// Re-initialize SendGrid with the API key (important when keys are updated)
if (process.env.SENDGRID_API_KEY) {
  // Make sure we're using the latest API key
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

    // Construct proper SendGrid email format
    const message = {
      to: options.to,
      from: {
        email: process.env.SENDGRID_VERIFIED_SENDER,
        name: "Cognitive Profile App"
      },
      subject: options.subject,
      text: options.text || '',
      html: options.html || ''
    };

    await sgMail.send(message);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}