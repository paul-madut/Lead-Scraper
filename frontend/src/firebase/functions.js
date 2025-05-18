export const functions = require('firebase-functions');
export const admin = require('firebase-admin');
admin.initializeApp();

// Function to check if user has enough tokens
exports.checkTokenBalance = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { requestedTokens } = data;
  const userId = context.auth.uid;

  // Get user document
  const userRef = admin.firestore().collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  const currentTokens = userData.tokens || 0;

  if (currentTokens < requestedTokens) {
    throw new functions.https.HttpsError(
      'resource-exhausted', 
      `Insufficient tokens. You have ${currentTokens} tokens but need ${requestedTokens}.`
    );
  }

  return { 
    sufficient: true, 
    currentBalance: currentTokens,
    requested: requestedTokens
  };
});

// Function to deduct tokens after a successful search
exports.deductTokens = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { tokensToDeduct, searchParams } = data;
  const userId = context.auth.uid;

  // Run in a transaction to ensure data consistency
  try {
    const result = await admin.firestore().runTransaction(async (transaction) => {
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }
      
      const userData = userDoc.data();
      const currentTokens = userData.tokens || 0;
      
      // Double-check token balance
      if (currentTokens < tokensToDeduct) {
        throw new functions.https.HttpsError(
          'resource-exhausted', 
          `Insufficient tokens. You have ${currentTokens} tokens but need ${tokensToDeduct}.`
        );
      }
      
      // Update tokens
      transaction.update(userRef, { 
        tokens: currentTokens - tokensToDeduct,
        tokenHistory: admin.firestore.FieldValue.arrayUnion({
          amount: -tokensToDeduct,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type: 'search',
          details: searchParams
        })
      });
      
      return { 
        success: true, 
        newBalance: currentTokens - tokensToDeduct 
      };
    });
    
    return result;
  } catch (error) {
    throw new functions.https.HttpsError('aborted', error.message);
  }
});