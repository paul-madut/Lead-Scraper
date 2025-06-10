// lib/firebase-admin.ts - Server-side only
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Ensure this only runs on server-side
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK should only be used on the server side');
}

// Define the service account interface
interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

// Get configuration from environment variables
const getFirebaseAdminConfig = (): FirebaseAdminConfig => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin configuration is incomplete. Please check your environment variables.'
    );
  }

  return {
    projectId,
    clientEmail,
    // Firebase private keys in environment variables are usually escaped
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
};

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  // Check if any Firebase Admin apps are already initialized
  if (getApps().length > 0) {
    // Return the existing app
    return getApps()[0];
  }

  try {
    const { projectId, clientEmail, privateKey } = getFirebaseAdminConfig();

    // Create the service account object
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };

    // Initialize the Firebase Admin app
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });

    console.log('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
};

// Initialize the app
const adminApp = initializeFirebaseAdmin();

// Export the services you need
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export default adminApp;