// tokenService.ts
import { db } from '../firebase/config';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Reference to the "tokens" collection
const tokensCollection = collection(db, 'tokens');

export const createTokenDocument = async (userId: string): Promise<void> => {
  try {
    const tokenRef = doc(tokensCollection, userId);
    await setDoc(tokenRef, {
      balance: 200,
    });
  } catch (error) {
    console.error('Error creating token document:', error);
    throw error;
  }
};

export const updateTokenBalance = async (userId: string, amount: number): Promise<void> => {
  try {
    const tokenRef = doc(tokensCollection, userId);
    const tokenDoc = await getDoc(tokenRef);

    if (tokenDoc.exists()) {
      const currentBalance = tokenDoc.data()?.balance ?? 0;
      const newBalance = currentBalance + amount;

      await updateDoc(tokenRef, {
        balance: newBalance,
      });
    } else {
      await createTokenDocument(userId);
      // Set initial amount after creating
      await updateDoc(tokenRef, {
        balance: amount,
      });
    }
  } catch (error) {
    console.error('Error updating token balance:', error);
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
      return 0;
    }
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
};