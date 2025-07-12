import { storage } from './storage';
import { type SessionInfo } from './auth';

export interface TokenCost {
  analysis: number;
  upload: number;
  storage: number;
}

export const TOKEN_COSTS: TokenCost = {
  analysis: 100,  // Cost per analysis
  upload: 1,      // Cost per 100 words
  storage: 1      // Cost per 250 words per month
};

export interface TokenUsageResult {
  success: boolean;
  remainingBalance: number;
  error?: string;
}

// Calculate token cost for text analysis
export function calculateAnalysisCost(text: string): number {
  return TOKEN_COSTS.analysis;
}

// Calculate token cost for file upload
export function calculateUploadCost(wordCount: number): number {
  const cost = Math.ceil(wordCount / 100) * TOKEN_COSTS.upload;
  return Math.max(100, Math.min(10000, cost)); // Min 100, Max 10,000
}

// Calculate monthly storage cost
export function calculateStorageCost(wordCount: number): number {
  return Math.ceil(wordCount / 250) * TOKEN_COSTS.storage;
}

// Use tokens for registered user
export async function useTokens(
  sessionInfo: SessionInfo,
  tokenCost: number,
  action: string
): Promise<TokenUsageResult> {
  if (!sessionInfo.user) {
    return {
      success: false,
      remainingBalance: 0,
      error: 'User not found'
    };
  }

  const currentBalance = sessionInfo.user.token_balance || 0;
  
  if (currentBalance < tokenCost) {
    return {
      success: false,
      remainingBalance: currentBalance,
      error: 'Insufficient tokens'
    };
  }

  const newBalance = currentBalance - tokenCost;
  
  try {
    // Update user balance
    await storage.updateUserTokenBalance(sessionInfo.userId, newBalance);
    
    // Log token usage
    await storage.logTokenUsage({
      user_id: sessionInfo.userId,
      session_id: sessionInfo.sessionId,
      tokens_used: tokenCost,
      remaining_balance: newBalance,
      action
    });
    
    // Update session user data
    if (sessionInfo.user) {
      sessionInfo.user.token_balance = newBalance;
    }
    
    return {
      success: true,
      remainingBalance: newBalance
    };
  } catch (error) {
    return {
      success: false,
      remainingBalance: currentBalance,
      error: 'Failed to deduct tokens'
    };
  }
}

// Add tokens to user balance (for purchases)
export async function addTokens(
  userId: string,
  tokensToAdd: number,
  action: string = 'purchase'
): Promise<TokenUsageResult> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        success: false,
        remainingBalance: 0,
        error: 'User not found'
      };
    }

    const currentBalance = user.token_balance || 0;
    const newBalance = currentBalance + tokensToAdd;
    
    // Update user balance
    await storage.updateUserTokenBalance(userId, newBalance);
    
    // Log token addition
    await storage.logTokenUsage({
      user_id: userId,
      session_id: null,
      tokens_used: -tokensToAdd, // Negative to indicate addition
      remaining_balance: newBalance,
      action
    });
    
    return {
      success: true,
      remainingBalance: newBalance
    };
  } catch (error) {
    return {
      success: false,
      remainingBalance: 0,
      error: 'Failed to add tokens'
    };
  }
}

// Check if user has enough tokens
export function hasEnoughTokens(user: any, requiredTokens: number): boolean {
  return (user?.token_balance || 0) >= requiredTokens;
}

// Get token pricing tiers
export const TOKEN_PACKAGES = [
  { price: 1, tokens: 1000, priceId: 'price_1000_tokens' },
  { price: 10, tokens: 20000, priceId: 'price_20000_tokens' },
  { price: 100, tokens: 500000, priceId: 'price_500000_tokens' },
  { price: 1000, tokens: 10000000, priceId: 'price_10000000_tokens' }
];

// Word count utilities
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function truncateText(text: string, maxWords: number = 50): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

// Preview message for unregistered users
export function getPreviewMessage(): string {
  return '🔒 This is a real preview of your result. [Register & Unlock Full Access]';
}

// Generate preview for unregistered users
export function generatePreview(fullResult: any): any {
  if (typeof fullResult === 'string') {
    return {
      preview: truncateText(fullResult, 50),
      message: getPreviewMessage()
    };
  }
  
  // For cognitive analysis results
  if (fullResult.detailedAnalysis) {
    return {
      ...fullResult,
      detailedAnalysis: truncateText(fullResult.detailedAnalysis, 50),
      isPreview: true,
      message: getPreviewMessage()
    };
  }
  
  return {
    ...fullResult,
    isPreview: true,
    message: getPreviewMessage()
  };
}