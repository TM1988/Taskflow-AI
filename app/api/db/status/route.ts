import { NextRequest, NextResponse } from 'next/server';
import { getUserDatabaseConnection } from '@/services/db/dynamicConnection';
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

    // Check if user has organizations enabled
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    let includeOrganizations = false;
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const databaseConfig = userData.databaseConfig;
      includeOrganizations = databaseConfig?.includeOrganizations === true;
    }

    // Get the database connection for this user
    const database = await getUserDatabaseConnection(userId, true); // Force refresh
    
    // Count documents in each collection (task-related + optionally organizations)
    const stats: any = {
      tasks: await database.collection('tasks').countDocuments(),
      columns: await database.collection('columns').countDocuments(),
      comments: await database.collection('comments').countDocuments()
    };

    // Include organizations if enabled
    if (includeOrganizations) {
      stats.organizations = await database.collection('organizations').countDocuments();
    }

    // Get sample data (only from custom database)
    const sampleTasks = await database.collection('tasks')
      .find({})
      .limit(5)
      .toArray();

    const sampleColumns = await database.collection('columns')
      .find({})
      .limit(5)
      .toArray();

    const sampleData: any = {
      tasks: sampleTasks.map(t => ({ 
        id: t._id?.toString(), 
        title: t.title, 
        projectId: t.projectId,
        columnId: t.columnId 
      })),
      columns: sampleColumns.map(c => ({
        id: c._id?.toString(),
        name: c.name,
        projectId: c.projectId,
        order: c.order,
        isTemplate: c.isTemplate
      }))
    };

    // Add organizations sample if enabled
    if (includeOrganizations) {
      const sampleOrgs = await database.collection('organizations')
        .find({})
        .limit(5)
        .toArray();
        
      sampleData.organizations = sampleOrgs.map(o => ({
        id: o._id?.toString(),
        name: o.name,
        ownerId: o.ownerId
      }));
    }

    return NextResponse.json({
      success: true,
      databaseName: database.databaseName,
      type: `Custom Database (${includeOrganizations ? 'Tasks + Organizations' : 'Tasks Only'})`,
      note: `Projects and user data are stored in Firestore${includeOrganizations ? '' : '. Organizations are also in Firestore (enable in settings to store in custom DB)'}`,
      stats,
      sampleData
    });

  } catch (error: any) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check database status',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
