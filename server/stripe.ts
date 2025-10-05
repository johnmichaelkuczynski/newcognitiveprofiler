import Stripe from 'stripe';
import { db } from './storage';
import { transactions, users } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export interface StripeCreditPackage {
  id: string;
  provider: 'zhi1' | 'zhi2' | 'zhi3' | 'zhi4';
  providerName: string;
  price: number; // in dollars
  words: number;
  priceId?: string; // Stripe price ID if using Stripe products
}

// Price schedule based on user requirements
export const stripeCreditPackages: StripeCreditPackage[] = [
  // ZHI 1 (DeepSeek) packages
  { id: 'zhi1_5', provider: 'zhi1', providerName: 'Zhi1', price: 5, words: 4275000 },
  { id: 'zhi1_10', provider: 'zhi1', providerName: 'Zhi1', price: 10, words: 8977500 },
  { id: 'zhi1_25', provider: 'zhi1', providerName: 'Zhi1', price: 25, words: 23512500 },
  { id: 'zhi1_50', provider: 'zhi1', providerName: 'Zhi1', price: 50, words: 51300000 },
  { id: 'zhi1_100', provider: 'zhi1', providerName: 'Zhi1', price: 100, words: 115425000 },
  
  // ZHI 2 (OpenAI) packages
  { id: 'zhi2_5', provider: 'zhi2', providerName: 'Zhi2', price: 5, words: 106840 },
  { id: 'zhi2_10', provider: 'zhi2', providerName: 'Zhi2', price: 10, words: 224360 },
  { id: 'zhi2_25', provider: 'zhi2', providerName: 'Zhi2', price: 25, words: 587625 },
  { id: 'zhi2_50', provider: 'zhi2', providerName: 'Zhi2', price: 50, words: 1282100 },
  { id: 'zhi2_100', provider: 'zhi2', providerName: 'Zhi2', price: 100, words: 2883400 },
  
  // ZHI 3 (Anthropic) packages
  { id: 'zhi3_5', provider: 'zhi3', providerName: 'Zhi3', price: 5, words: 702000 },
  { id: 'zhi3_10', provider: 'zhi3', providerName: 'Zhi3', price: 10, words: 1474200 },
  { id: 'zhi3_25', provider: 'zhi3', providerName: 'Zhi3', price: 25, words: 3861000 },
  { id: 'zhi3_50', provider: 'zhi3', providerName: 'Zhi3', price: 50, words: 8424000 },
  { id: 'zhi3_100', provider: 'zhi3', providerName: 'Zhi3', price: 100, words: 18954000 },
  
  // ZHI 4 (Perplexity) packages
  { id: 'zhi4_5', provider: 'zhi4', providerName: 'Zhi4', price: 5, words: 6410255 },
  { id: 'zhi4_10', provider: 'zhi4', providerName: 'Zhi4', price: 10, words: 13461530 },
  { id: 'zhi4_25', provider: 'zhi4', providerName: 'Zhi4', price: 25, words: 35256400 },
  { id: 'zhi4_50', provider: 'zhi4', providerName: 'Zhi4', price: 50, words: 76923050 },
  { id: 'zhi4_100', provider: 'zhi4', providerName: 'Zhi4', price: 100, words: 173176900 },
];

export async function createCheckoutSession(
  userId: number,
  packageId: string
): Promise<string> {
  const creditPackage = stripeCreditPackages.find(p => p.id === packageId);
  if (!creditPackage) {
    throw new Error('Invalid package ID');
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${creditPackage.providerName} Credits`,
            description: `${creditPackage.words.toLocaleString()} words for ${creditPackage.providerName}`,
          },
          unit_amount: Math.round(creditPackage.price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/?payment=success`,
    cancel_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/?payment=cancel`,
    metadata: {
      userId: userId.toString(),
      packageId: creditPackage.id,
      provider: creditPackage.provider,
      words: creditPackage.words.toString(),
    },
  });

  // Store pending transaction
  const creditsObj = {
    credits_zhi1: creditPackage.provider === 'zhi1' ? creditPackage.words : 0,
    credits_zhi2: creditPackage.provider === 'zhi2' ? creditPackage.words : 0,
    credits_zhi3: creditPackage.provider === 'zhi3' ? creditPackage.words : 0,
    credits_zhi4: creditPackage.provider === 'zhi4' ? creditPackage.words : 0,
  };

  await db.insert(transactions).values({
    user_id: userId,
    amount: Math.round(creditPackage.price * 100), // Store in cents
    credits: 0, // Legacy field
    ...creditsObj,
    provider: creditPackage.provider,
    stripe_payment_intent_id: session.id,
    status: 'pending'
  });

  return session.url!;
}

export async function handleWebhook(
  body: string,
  signature: string,
  webhookSecret: string
): Promise<{ success: boolean; userId?: number; creditsAdded?: any }> {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract metadata
      const userId = parseInt(session.metadata?.userId || '0');
      const provider = session.metadata?.provider as 'zhi1' | 'zhi2' | 'zhi3' | 'zhi4';
      const words = parseInt(session.metadata?.words || '0');

      if (!userId || !provider || !words) {
        throw new Error('Invalid session metadata');
      }

      // Find the transaction
      const transaction = await db.select().from(transactions)
        .where(eq(transactions.stripe_payment_intent_id, session.id))
        .limit(1);

      if (transaction.length === 0) {
        throw new Error('Transaction not found');
      }

      const txn = transaction[0];
      
      // Update transaction status
      await db.update(transactions)
        .set({ status: 'completed' })
        .where(eq(transactions.id, txn.id));

      // Add credits to user based on provider
      const creditField = `credits_${provider}` as const;
      await db.update(users)
        .set({ 
          [creditField]: sql`${users[creditField]} + ${words}` 
        })
        .where(eq(users.id, userId));

      return {
        success: true,
        userId,
        creditsAdded: { [provider]: words }
      };
    }

    return { success: false };
  } catch (error) {
    console.error('Stripe webhook error:', error);
    throw error;
  }
}

export { stripe };
