import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get database configuration from user profile
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const databaseConfig = userData.databaseConfig || {};
      
      return NextResponse.json({ 
        success: true, 
        config: databaseConfig
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        config: {}
      });
    }

  } catch (error: any) {
    console.error('Database configuration fetch failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch database configuration',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { userId, config } = requestData;
    
    // Extract config data from the structure sent by DatabaseStep
    const {
      useOfficialMongoDB,
      useCustomMongoDB,
      connectionString,
      databaseName,
      performanceWarningAcknowledged
    } = config;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Save database configuration to user profile
    const userDocRef = doc(db, 'users', userId);
    const configData = {
      databaseConfig: {
        useOfficialMongoDB: useOfficialMongoDB || false,
        useCustomMongoDB: useCustomMongoDB || false,
        connectionString: useCustomMongoDB ? connectionString : '',
        databaseName: useCustomMongoDB ? (databaseName || 'taskflow') : '',
        performanceWarningAcknowledged: performanceWarningAcknowledged || false,
        configuredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    };

    await setDoc(userDocRef, configData, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: 'Database configuration saved successfully'
    });

  } catch (error: any) {
    console.error('Database configuration save failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save database configuration',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
