// services/adminTokenService.ts - Server-side only operations
// This file should ONLY be imported in API routes, never in client components

// Dynamic import to ensure it only runs on server
const getAdminDb = async () => {
    if (typeof window !== 'undefined') {
      throw new Error('Admin services should only be used on the server side');
    }
    
    const { adminDb } = await import('../lib/firebase-admin');
    return adminDb;
  };
  
  export class AdminTokenService {
    static async getTokenBalance(userId: string): Promise<number> {
      try {
        const adminDb = await getAdminDb();
        const tokenRef = adminDb.collection('tokens').doc(userId);
        const tokenDoc = await tokenRef.get();
  
        if (tokenDoc.exists) {
          const data = tokenDoc.data();
          return data?.balance ?? 0;
        } else {
          // Create new token document with initial balance
          await tokenRef.set({
            balance: 200,
            createdAt: new Date(),
            lastUpdated: new Date()
          });
          return 200;
        }
      } catch (error) {
        console.error('Error getting token balance (admin):', error);
        throw error;
      }
    }
  
    static async deductTokens(userId: string, tokensToDeduct: number): Promise<number> {
      try {
        const adminDb = await getAdminDb();
        
        const result = await adminDb.runTransaction(async (transaction) => {
          const tokenRef = adminDb.collection('tokens').doc(userId);
          const tokenDoc = await transaction.get(tokenRef);
          
          if (!tokenDoc.exists) {
            // Create new document if it doesn't exist
            const newBalance = 200 - tokensToDeduct;
            if (newBalance < 0) {
              throw new Error(`Insufficient tokens for new user. Required: ${tokensToDeduct}, Available: 200`);
            }
            
            transaction.set(tokenRef, {
              balance: newBalance,
              createdAt: new Date(),
              lastUpdated: new Date()
            });
            return newBalance;
          }
          
          const data = tokenDoc.data();
          const currentBalance = data?.balance ?? 0;
          
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
        console.error('Error deducting tokens (admin):', error);
        throw error;
      }
    }
  
    static async addTokens(userId: string, tokensToAdd: number): Promise<number> {
      try {
        const adminDb = await getAdminDb();
        
        const result = await adminDb.runTransaction(async (transaction) => {
          const tokenRef = adminDb.collection('tokens').doc(userId);
          const tokenDoc = await transaction.get(tokenRef);
          
          if (!tokenDoc.exists) {
            transaction.set(tokenRef, {
              balance: tokensToAdd,
              createdAt: new Date(),
              lastUpdated: new Date()
            });
            return tokensToAdd;
          }
          
          const data = tokenDoc.data();
          const currentBalance = data?.balance ?? 0;
          const newBalance = currentBalance + tokensToAdd;
          
          transaction.update(tokenRef, {
            balance: newBalance,
            lastUpdated: new Date()
          });
          
          return newBalance;
        });
        
        return result;
      } catch (error) {
        console.error('Error adding tokens (admin):', error);
        throw error;
      }
    }
  }