import Stripe from 'stripe';
import { addTokens } from './auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export interface PricingTier {
  price: number;
  tokens: number;
  priceId?: string;
}

export const PRICING_TIERS: PricingTier[] = [
  { price: 100, tokens: 1000 },      // $1.00 for 1,000 tokens
  { price: 1000, tokens: 20000 },    // $10.00 for 20,000 tokens  
  { price: 10000, tokens: 500000 },  // $100.00 for 500,000 tokens
  { price: 100000, tokens: 10000000 }, // $1,000.00 for 10,000,000 tokens
];

export async function createCheckoutSession(
  userId: string,
  email: string,
  tokens: number,
  priceInCents: number
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tokens.toLocaleString()} Analysis Credits`,
              description: 'Credits for AI cognitive analysis',
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}?payment=cancelled`,
      customer_email: email,
      metadata: {
        userId,
        tokens: tokens.toString(),
      },
    });

    return session.url || '';
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

export async function handleWebhook(payload: string, signature: string): Promise<void> {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId;
      const tokens = parseInt(session.metadata?.tokens || '0');
      
      if (userId && tokens > 0) {
        await addTokens(userId, tokens);
        console.log(`Added ${tokens} tokens to user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}

export function getPricingTier(tokens: number): PricingTier | null {
  return PRICING_TIERS.find(tier => tier.tokens === tokens) || null;
}