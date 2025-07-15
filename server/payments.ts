import paypal from '@paypal/checkout-server-sdk';
import { db } from './storage';
import { transactions, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// PayPal environment setup
const environment = process.env.NODE_ENV === 'production' 
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!);

const client = new paypal.core.PayPalHttpClient(environment);

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // Price in USD
  description: string;
}

export const creditPackages: CreditPackage[] = [
  {
    id: 'pack_5',
    name: '5 Credits',
    credits: 5,
    price: 5.00,
    description: 'Perfect for trying out the service'
  },
  {
    id: 'pack_20',
    name: '20 Credits',
    credits: 20,
    price: 15.00,
    description: 'Great for regular users'
  },
  {
    id: 'pack_50',
    name: '50 Credits',
    credits: 50,
    price: 30.00,
    description: 'Best value for power users'
  }
];

export async function createPayPalOrder(userId: number, packageId: string): Promise<string> {
  const creditPackage = creditPackages.find(p => p.id === packageId);
  if (!creditPackage) {
    throw new Error('Invalid package ID');
  }

  // Create PayPal order
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: creditPackage.price.toFixed(2)
      },
      description: `${creditPackage.name} - ${creditPackage.description}`
    }]
  });

  try {
    const order = await client.execute(request);
    const orderId = order.result.id;

    // Store pending transaction
    await db.insert(transactions).values({
      user_id: userId,
      amount: Math.round(creditPackage.price * 100), // Store in cents
      credits: creditPackage.credits,
      paypal_transaction_id: orderId,
      status: 'pending'
    });

    return orderId;
  } catch (error) {
    console.error('PayPal order creation failed:', error);
    throw new Error('Failed to create payment order');
  }
}

export async function capturePayPalOrder(orderId: string): Promise<{ success: boolean; userId?: number; creditsAdded?: number }> {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    
    if (capture.result.status === 'COMPLETED') {
      // Find the transaction
      const transaction = await db.select().from(transactions)
        .where(eq(transactions.paypal_transaction_id, orderId))
        .limit(1);

      if (transaction.length === 0) {
        throw new Error('Transaction not found');
      }

      const txn = transaction[0];
      
      // Update transaction status
      await db.update(transactions)
        .set({ status: 'completed' })
        .where(eq(transactions.id, txn.id));

      // Add credits to user
      await db.update(users)
        .set({ 
          credits: sql`${users.credits} + ${txn.credits}` 
        })
        .where(eq(users.id, txn.user_id));

      return {
        success: true,
        userId: txn.user_id,
        creditsAdded: txn.credits
      };
    }

    return { success: false };
  } catch (error) {
    console.error('PayPal capture failed:', error);
    
    // Update transaction status to failed
    await db.update(transactions)
      .set({ status: 'failed' })
      .where(eq(transactions.paypal_transaction_id, orderId));

    return { success: false };
  }
}

export async function getUserCredits(userId: number): Promise<number> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user.length > 0 ? user[0].credits : 0;
}