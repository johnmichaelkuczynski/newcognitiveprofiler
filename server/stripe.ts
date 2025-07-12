import Stripe from 'stripe';
import { storage } from './storage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export interface TokenPackage {
  priceId: string;
  amount: number; // in cents
  tokens: number;
  name: string;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    priceId: 'price_1000_tokens',
    amount: 100, // $1.00
    tokens: 1000,
    name: 'Starter Pack - 1,000 tokens'
  },
  {
    priceId: 'price_20000_tokens',
    amount: 1000, // $10.00
    tokens: 20000,
    name: 'Professional Pack - 20,000 tokens'
  },
  {
    priceId: 'price_500000_tokens',
    amount: 10000, // $100.00
    tokens: 500000,
    name: 'Enterprise Pack - 500,000 tokens'
  },
  {
    priceId: 'price_10000000_tokens',
    amount: 100000, // $1,000.00
    tokens: 10000000,
    name: 'Ultimate Pack - 10,000,000 tokens'
  }
];

export async function createCheckoutSession(userId: string, packageIndex: number): Promise<string> {
  const tokenPackage = TOKEN_PACKAGES[packageIndex];
  if (!tokenPackage) {
    throw new Error('Invalid package selected');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: tokenPackage.name,
            description: `${tokenPackage.tokens.toLocaleString()} tokens for cognitive analysis`,
          },
          unit_amount: tokenPackage.amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/purchase-cancelled`,
    metadata: {
      userId,
      tokens: tokenPackage.tokens.toString(),
      packageIndex: packageIndex.toString(),
    },
  });

  return session.url || '';
}

export async function handleWebhook(body: string, signature: string): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_COGNITIVEPROFILER;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw new Error('Webhook signature verification failed');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const tokens = parseInt(session.metadata?.tokens || '0');

    if (userId && tokens > 0) {
      await storage.addTokens(userId, tokens, session.payment_intent as string);
      console.log(`Added ${tokens} tokens to user ${userId}`);
    }
  }
}

export async function calculateTokenCost(inputTokens: number, outputTokens: number): Promise<number> {
  return Math.ceil(inputTokens + outputTokens);
}

export async function calculateDocumentTokens(wordCount: number): Promise<number> {
  // 1 token per 100 words, min 100, max 10,000
  const tokens = Math.ceil(wordCount / 100);
  return Math.max(100, Math.min(10000, tokens));
}

export { stripe };