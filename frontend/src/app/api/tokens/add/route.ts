import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { AdminTokenService } from '@/services/adminTokenService';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Add tokens
    const newBalance = await AdminTokenService.addTokens(userId, amount);

    return NextResponse.json({
      success: true,
      newBalance,
      added: amount
    });

  } catch (error) {
    console.error('Error adding tokens:', error);
    
    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error')) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add tokens' },
      { status: 500 }
    );
  }
}