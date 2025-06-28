// services/tokenService.ts - Frontend token service for API calls only
import { auth } from '../firebase/config';

// Helper function to get auth token
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

// Get token balance from backend API
export const getTokenBalance = async (): Promise<number> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch('/api/tokens/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get token balance');
    }

    return data.balance;
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
};

// Create token document for new users (handled automatically by getTokenBalance)
export const createTokenDocument = async (): Promise<void> => {
  try {
    // Simply call getTokenBalance - it will create the document if it doesn't exist
    await getTokenBalance();
  } catch (error) {
    console.error('Error creating token document:', error);
    throw error;
  }
};