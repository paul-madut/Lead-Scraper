// services/tokenService.ts - Client-side only operations
import { db } from '../firebase/config';
import { collection, doc, setDoc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';

// Client-side token operations (for frontend use)
const tokensCollection = collection(db, 'tokens');

export const createTokenDocument = async (userId: string): Promise<void> => {
  try {
    const tokenRef = doc(tokensCollection, userId);
    await setDoc(tokenRef, {
      balance: 200,
      createdAt: new Date(),
      lastUpdated: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error creating token document:', error);
    throw error;
  }
};

export const getTokenBalance = async (userId: string): Promise<number> => {
  try {
    const tokenRef = doc(tokensCollection, userId);
    const tokenDoc = await getDoc(tokenRef);

    if (tokenDoc.exists()) {
      return tokenDoc.data()?.balance ?? 0;
    } else {
      await createTokenDocument(userId);
      return 200;
    }
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
};

export const deductTokens = async (userId: string, tokensToDeduct: number): Promise<number> => {
  try {
    const tokenRef = doc(tokensCollection, userId);
    
    const result = await runTransaction(db, async (transaction) => {
      const tokenDoc = await transaction.get(tokenRef);
      
      if (!tokenDoc.exists()) {
        transaction.set(tokenRef, {
          balance: 200 - tokensToDeduct,
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        return 200 - tokensToDeduct;
      }
      
      const currentBalance = tokenDoc.data()?.balance ?? 0;
      
      if (currentBalance < tokensToDeduct) {
        throw new Error(`Insufficient tokens. Current: ${currentBalance}, Required: ${tokensToDeduct}`);
      }
      
      const newBalance = currentBalance - tokensToDeduct;
      
      transaction.update(tokenRef, {
        balance: newBalance,
        lastUpdated: new Date()
      });
      
      return newBalance;
    });
    
    return result;
  } catch (error) {
    console.error('Error deducting tokens:', error);
    throw error;
  }
};

export const addTokens = async (userId: string, tokensToAdd: number): Promise<number> => {
  try {
    const tokenRef = doc(tokensCollection, userId);
    
    const result = await runTransaction(db, async (transaction) => {
      const tokenDoc = await transaction.get(tokenRef);
      
      if (!tokenDoc.exists()) {
        transaction.set(tokenRef, {
          balance: tokensToAdd,
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        return tokensToAdd;
      }
      
      const currentBalance = tokenDoc.data()?.balance ?? 0;
      const newBalance = currentBalance + tokensToAdd;
      
      transaction.update(tokenRef, {
        balance: newBalance,
        lastUpdated: new Date()
      });
      
      return newBalance;
    });
    
    return result;
  } catch (error) {
    console.error('Error adding tokens:', error);
    throw error;
  }
};