// app/api/test-admin/route.ts
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test admin auth
    const users = await adminAuth.listUsers(1);
    
    // Test admin firestore
    const testDoc = await adminDb.collection('test').doc('admin-test').get();
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin is working!',
      userCount: users.users.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error
    }, { status: 500 });
  }
}