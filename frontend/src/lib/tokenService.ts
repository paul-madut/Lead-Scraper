import { db } from '@/firebase/config';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  runTransaction, 
  serverTimestamp, 
  arrayUnion 
} from 'firebase/firestore';
import { UserTokenData } from '@/lib/types';

// Check if user has enough tokens
export async function checkUserTokens(
  userId: string, 
  requiredTokens: number
): Promise<{sufficient: boolean, currentBalance: number}> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as UserTokenData;
    const currentTokens = userData.tokens || 0;
    
    return {
      sufficient: currentTokens >= requiredTokens,
      currentBalance: currentTokens
    };
  } catch (error) {
    console.error('Error checking user tokens:', error);
    throw error;
  }
}

// Deduct tokens after a successful search
export async function deductTokens(
  userId: string,
  tokensToDeduct: number,
  searchDetails: {
    keyword: string;
    location: string;
    radius: number;
    max_results: number;
  },
  resultsFound: number
): Promise<{success: boolean, newBalance: number}> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data() as UserTokenData;
      const currentTokens = userData.tokens || 0;
      
      // Verify token balance again (in case it changed)
      if (currentTokens < tokensToDeduct) {
        throw new Error(`Insufficient tokens. You have ${currentTokens} tokens but need ${tokensToDeduct}.`);
      }
      
      // Update tokens with transaction
      transaction.update(userRef, {
        tokens: currentTokens - tokensToDeduct,
        tokenHistory: arrayUnion({
          amount: -tokensToDeduct,
          timestamp: serverTimestamp(),
          type: 'search',
          details: searchDetails,
          resultsFound
        })
      });
      
      return {
        success: true,
        newBalance: currentTokens - tokensToDeduct
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error deducting tokens:', error);
    throw error;
  }
}

// Add tokens to a user (for admin or purchase functionality)
export async function addTokens(
  userId: string,
  tokensToAdd: number,
  reason: string
): Promise<{success: boolean, newBalance: number}> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as UserTokenData;
    const currentTokens = userData.tokens || 0;
    
    await updateDoc(userRef, {
      tokens: currentTokens + tokensToAdd,
      tokenHistory: arrayUnion({
        amount: tokensToAdd,
        timestamp: serverTimestamp(),
        type: reason,
        details: { reason }
      })
    });
    
    return {
      success: true,
      newBalance: currentTokens + tokensToAdd
    };
  } catch (error) {
    console.error('Error adding tokens:', error);
    throw error;
  }
}

// Initialize tokens for a new user
export async function initializeUserTokens(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    // Only initialize if tokens field doesn't exist
    if (userDoc.exists() && userDoc.data().tokens === undefined) {
      await updateDoc(userRef, {
        tokens: 100, // Default token amount
        tokenHistory: arrayUnion({
          amount: 100,
          timestamp: serverTimestamp(),
          type: 'initial',
          details: { reason: 'New user registration' }
        })
      });
    }
  } catch (error) {
    console.error('Error initializing user tokens:', error);
    throw error;
  }
}

// 3. MODIFY THE SEARCH COMPONENT TO USE TOKENS