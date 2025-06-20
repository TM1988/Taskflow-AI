import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get database configuration from Firestore user profile
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Return default configuration (official database)
      return NextResponse.json({
        config: {
          useOfficialMongoDB: true,
          useCustomMongoDB: false,
          connectionString: '',
          databaseName: '',
          includeOrganizations: false,
        }
      });
    }

    const userData = userDoc.data();
    const databaseConfig = userData.databaseConfig;

    if (!databaseConfig) {
      // Return default configuration (official database)
      return NextResponse.json({
        config: {
          useOfficialMongoDB: true,
          useCustomMongoDB: false,
          connectionString: '',
          databaseName: '',
          includeOrganizations: false,
        }
      });
    }

    // Don't return the actual connection string for security
    return NextResponse.json({
      config: {
        useOfficialMongoDB: databaseConfig.useOfficialMongoDB || false,
        useCustomMongoDB: databaseConfig.useCustomMongoDB || false,
        connectionString: databaseConfig.useCustomMongoDB ? '[CONFIGURED]' : '',
        databaseName: databaseConfig.databaseName || '',
        includeOrganizations: databaseConfig.includeOrganizations || false,
      }
    });

  } catch (error) {
    console.error('Error fetching database config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database configuration' },
      { status: 500 }
    );
  }
}