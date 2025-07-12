import Stripe from 'stripe';
import { addTokens, TOKEN_PACKAGES } from './tokens';

// Initialize Stripe only when the API key is available
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20'
    });
  }
  return stripe!;
}

export interface PaymentResult {
  success: boolean;
  clientSecret?: string;
  error?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  tokens: number;
  userId: string;
  status: string;
}

// Store payment intents temporarily
const paymentIntents = new Map<string, PaymentIntent>();

// Create payment intent for token purchase
export async function createPaymentIntent(
  userId: string,
  packageIndex: number
): Promise<PaymentResult> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        success: false,
        error: 'Stripe is not configured'
      };
    }

    const tokenPackage = TOKEN_PACKAGES[packageIndex];
    if (!tokenPackage) {
      return {
        success: false,
        error: 'Invalid package selected'
      };
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: tokenPackage.price * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        tokens: tokenPackage.tokens.toString(),
        packageIndex: packageIndex.toString()
      }
    });

    // Store payment intent info
    paymentIntents.set(paymentIntent.id, {
      id: paymentIntent.id,
      amount: tokenPackage.price,
      tokens: tokenPackage.tokens,
      userId,
      status: 'pending'
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret || undefined
    };
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return {
      success: false,
      error: 'Failed to create payment intent'
    };
  }
}

// Handle successful payment
export async function handlePaymentSuccess(paymentIntentId: string): Promise<boolean> {
  try {
    const paymentInfo = paymentIntents.get(paymentIntentId);
    if (!paymentInfo) {
      console.error('Payment intent not found:', paymentIntentId);
      return false;
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      console.error('Payment not successful:', paymentIntent.status);
      return false;
    }

    // Add tokens to user account
    const result = await addTokens(
      paymentInfo.userId,
      paymentInfo.tokens,
      'purchase'
    );

    if (result.success) {
      // Update payment status
      paymentInfo.status = 'completed';
      paymentIntents.set(paymentIntentId, paymentInfo);
      
      console.log(`Added ${paymentInfo.tokens} tokens to user ${paymentInfo.userId}`);
      return true;
    } else {
      console.error('Failed to add tokens:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Payment handling failed:', error);
    return false;
  }
}

// Get payment status
export function getPaymentStatus(paymentIntentId: string): PaymentIntent | null {
  return paymentIntents.get(paymentIntentId) || null;
}

// Webhook handler for Stripe events
export async function handleStripeWebhook(
  body: any,
  signature: string
): Promise<boolean> {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe webhook secret not configured');
      return false;
    }

    const event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        return await handlePaymentSuccess(paymentIntent.id);
      
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        break;
      
      default:
        console.log('Unhandled event type:', event.type);
    }

    return true;
  } catch (error) {
    console.error('Webhook handling failed:', error);
    return false;
  }
}

// Clean up old payment intents
export function cleanupPaymentIntents(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, intent] of paymentIntents.entries()) {
    // Remove old pending payments (payment intents expire after 24 hours)
    if (intent.status === 'pending' && Date.now() - parseInt(id.split('_')[1]) > oneHourAgo) {
      paymentIntents.delete(id);
    }
  }
}