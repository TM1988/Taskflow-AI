import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Shared MongoDB connection options to fix TLS conflicts
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  // TLS/SSL options to fix Atlas connection issues
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  // Additional connection stability options
  maxIdleTimeMS: 30000,
  maxConnecting: 5,
  directConnection: false,
};

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName, userId } = await request.json();

    if (!connectionString || !databaseName) {
      return NextResponse.json(
        { error: 'Connection string and database name are required' },
        { status: 400 }
      );
    }

    const client = new MongoClient(connectionString, mongoOptions);
    
    try {
      await client.connect();
      const db = client.db(databaseName);

      console.log(`Initializing database: ${databaseName} (non-destructive mode)`);

      // Get list of existing collections first
      const existingCollectionsList = await db.listCollections().toArray();
      const existingCollectionNames = existingCollectionsList.map(col => col.name);
      console.log('Existing collections:', existingCollectionNames);

      // Create required collections with proper schema validation and indexes
      // Note: Task-related collections always go in custom database
      // Organizations are optional based on user preference
      // Projects, users, auth data etc. stay in official Firestore/MongoDB
      const collections = [
        {
          name: 'tasks',
          indexes: [
            { projectId: 1 },
            { columnId: 1 },
            { status: 1 },
            { priority: 1 },
            { order: 1 },
            { createdAt: -1 },
            { updatedAt: -1 }
          ] as Array<{ [key: string]: 1 | -1 }>
        },
        {
          name: 'columns',
          indexes: [
            { projectId: 1 },
            { order: 1 },
            { name: 1 }
          ] as Array<{ [key: string]: 1 | -1 }>
        },
        {
          name: 'comments',
          indexes: [
            { taskId: 1 },
            { authorId: 1 },
            { createdAt: -1 }
          ] as Array<{ [key: string]: 1 | -1 }>
        }
      ];

      // Create collections and indexes (non-destructive)
      let collectionsCreated = 0;
      let indexesCreated = 0;
      
      for (const collectionConfig of collections) {
        try {
          // Check if collection exists
          const collectionExists = existingCollectionNames.includes(collectionConfig.name);
          
          if (!collectionExists) {
            await db.createCollection(collectionConfig.name);
            console.log(`✅ Created collection: ${collectionConfig.name}`);
            collectionsCreated++;
          } else {
            console.log(`ℹ️  Collection already exists: ${collectionConfig.name}`);
          }

          const collection = db.collection(collectionConfig.name);

          // Get existing indexes to avoid duplicates
          const existingIndexes = await collection.listIndexes().toArray();
          const existingIndexKeys = existingIndexes.map(idx => JSON.stringify(idx.key));

          // Create missing indexes only
          for (const indexSpec of collectionConfig.indexes) {
            try {
              const indexKey = JSON.stringify(indexSpec);
              
              if (!existingIndexKeys.includes(indexKey)) {
                await collection.createIndex(indexSpec);
                console.log(`✅ Created index on ${collectionConfig.name}:`, indexSpec);
                indexesCreated++;
              } else {
                console.log(`ℹ️  Index already exists on ${collectionConfig.name}:`, indexSpec);
              }
            } catch (indexError: any) {
              // Only log warning if it's not a "duplicate index" error
              if (!indexError.message?.includes('already exists')) {
                console.warn(`⚠️  Index creation warning for ${collectionConfig.name}:`, indexError.message);
              }
            }
          }
        } catch (collectionError: any) {
          console.warn(`⚠️  Collection setup warning for ${collectionConfig.name}:`, collectionError.message);
        }
      }

      // Create default project and columns ONLY if user has no existing data
      let defaultDataCreated = false;
      
      if (userId) {
        console.log(`Checking existing columns for user: ${userId}`);
        
        // Note: We no longer create default projects here since projects are in Firestore
        // We only check if the user needs default columns for existing projects
        
        // Get projects from Firestore (not from this database)
        // For now, we'll just create some basic columns that can be used with any project
        const existingColumns = await db.collection('columns').find({}).toArray();
        console.log(`Found ${existingColumns.length} existing columns in custom database`);
        
        if (existingColumns.length === 0) {
          console.log('No existing columns found, creating basic column templates...');
          
          // Create basic column templates (without specific projectId - will be assigned when projects use them)
          const basicColumns = [
            { name: 'To Do', order: 0, createdAt: new Date(), updatedAt: new Date(), isTemplate: true },
            { name: 'In Progress', order: 1, createdAt: new Date(), updatedAt: new Date(), isTemplate: true },
            { name: 'Review', order: 2, createdAt: new Date(), updatedAt: new Date(), isTemplate: true },
            { name: 'Done', order: 3, createdAt: new Date(), updatedAt: new Date(), isTemplate: true }
          ];

          await db.collection('columns').insertMany(basicColumns);
          
          console.log(`✅ Created basic column templates in custom database`);
          defaultDataCreated = true;
        } else {
          console.log(`ℹ️  Custom database already has ${existingColumns.length} column(s), preserving existing data`);
        }
      }

      // Count existing data to provide feedback
      const dataStats: any = {
        tasks: await db.collection('tasks').countDocuments(),
        columns: await db.collection('columns').countDocuments(),
        comments: await db.collection('comments').countDocuments()
      };

      console.log(`Database initialization complete for ${databaseName}:`);
      console.log(`- Collections created: ${collectionsCreated}`);
      console.log(`- Indexes created: ${indexesCreated}`);
      console.log(`- Default data created: ${defaultDataCreated}`);
      console.log(`- Total data in DB:`, dataStats);

      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully (non-destructive)',
        databaseName,
        stats: {
          collectionsCreated,
          indexesCreated,
          defaultDataCreated,
          existingData: dataStats,
          preservedExistingData: true, // Always true since we're non-destructive
          message: collectionsCreated > 0 || indexesCreated > 0 || defaultDataCreated 
            ? `Custom database setup completed. Task data will be stored here. Projects and user profiles remain in Firestore.`
            : `Custom database was already properly set up. All existing task data preserved.`
        }
      });

    } finally {
      await client.close();
    }

  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
