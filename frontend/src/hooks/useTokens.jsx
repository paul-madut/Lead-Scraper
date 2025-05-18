import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db} from '../firebase/config'; // Your Firebase config
import { functions } from '../firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export const useTokens = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Firebase functions
  const checkTokenBalance = httpsCallable(functions, 'checkTokenBalance');
  const deductTokens = httpsCallable(functions, 'deductTokens');

  // Get current token balance
  useEffect(() => {
    const fetchTokens = async () => {
      if (!user) {
        setTokens(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setTokens(userSnap.data().tokens || 0);
        } else {
          setError('User data not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [user]);

  // Validate and process a search request
  const processSearch = async (searchParams, expectedResults) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Step 1: Check if user has enough tokens
    try {
      const tokenCheck = await checkTokenBalance({
        requestedTokens: expectedResults
      });
      
      if (!tokenCheck.data.sufficient) {
        throw new Error('Insufficient tokens');
      }
      
      // Step 2: Process the search (you would put your Google Places API call here)
      // ... your search logic ...
      
      // Step 3: Deduct tokens based on actual results
      const deduction = await deductTokens({
        tokensToDeduct: expectedResults,
        searchParams
      });
      
      // Update local state
      setTokens(deduction.data.newBalance);
      
      return {
        success: true,
        newBalance: deduction.data.newBalance
      };
    } catch (error) {
      console.error('Error processing search:', error);
      throw error;
    }
  };

  return { tokens, loading, error, processSearch };
};