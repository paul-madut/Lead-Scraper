import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { AdminTokenService } from '@/services/adminTokenService';

export async function GET(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get token balance
    const balance = await AdminTokenService.getTokenBalance(userId);

    return NextResponse.json({
      success: true,
      balance
    });

  } catch (error) {
    console.error('Error getting token balance:', error);
    
    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error')) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to get token balance' },
      { status: 500 }
    );
  }
}