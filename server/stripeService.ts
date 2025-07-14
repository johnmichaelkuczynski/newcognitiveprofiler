import Stripe from "stripe";
import { storage } from "./storage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

// Pricing tiers as defined in requirements
export const PRICING_TIERS = {
  tier1: { price: 5, credits: 5000, name: "Starter Pack" },
  tier2: { price: 10, credits: 20000, name: "Professional Pack" },
  tier3: { price: 100, credits: 500000, name: "Enterprise Pack" },
  tier4: { price: 1000, credits: 10000000, name: "Ultimate Pack" }
};

export type PricingTier = keyof typeof PRICING_TIERS;

/**
 * Create a payment intent for credit purchase
 */
export async function createPaymentIntent(
  userId: number,
  tier: PricingTier
): Promise<{ clientSecret: string; amount: number; credits: number }> {
  const tierInfo = PRICING_TIERS[tier];
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: tierInfo.price * 100, // Convert to cents
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: userId.toString(),
      tier,
      credits: tierInfo.credits.toString()
    },
    description: `${tierInfo.name} - ${tierInfo.credits.toLocaleString()} credits`
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    amount: tierInfo.price,
    credits: tierInfo.credits
  };
}

/**
 * Handle successful payment and add credits to user account
 */
export async function handleSuccessfulPayment(paymentIntentId: string): Promise<void> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === "succeeded") {
      const userId = parseInt(paymentIntent.metadata.userId);
      const credits = parseInt(paymentIntent.metadata.credits);
      const tier = paymentIntent.metadata.tier as PricingTier;
      const tierInfo = PRICING_TIERS[tier];
      
      // Add credits to user account
      await storage.addCreditTransaction({
        user_id: userId,
        amount: credits,
        type: "purchase",
        description: `Credit purchase: ${tierInfo.name}`,
        stripe_payment_id: paymentIntentId
      });
      
      console.log(`Successfully added ${credits} credits to user ${userId}`);
    }
  } catch (error) {
    console.error("Error handling successful payment:", error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): Stripe.Event | null {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_COGNITIVEPROFILER;
    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return null;
    }
    
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return null;
  }
}

/**
 * Get user's payment history
 */
export async function getUserPaymentHistory(userId: number) {
  const transactions = await storage.getCreditTransactions(userId);
  return transactions.filter(t => t.type === "purchase");
}

/**
 * Create a setup intent for saving payment methods (for future use)
 */
export async function createSetupIntent(userId: number): Promise<{ clientSecret: string }> {
  const setupIntent = await stripe.setupIntents.create({
    metadata: {
      userId: userId.toString()
    }
  });

  return {
    clientSecret: setupIntent.client_secret!
  };
}