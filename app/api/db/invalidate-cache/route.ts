import { NextRequest, NextResponse } from 'next/server';
import { invalidateUserDatabaseCache } from '@/services/db/dynamicConnection';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Invalidate the database cache for this user
    await invalidateUserDatabaseCache(userId);

    return NextResponse.json({
      success: true,
      message: 'Database cache invalidated successfully'
    });

  } catch (error: any) {
    console.error('Error invalidating database cache:', error);
    return NextResponse.json(
      { 
        error: 'Failed to invalidate database cache',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
