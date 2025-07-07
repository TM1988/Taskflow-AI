import { NextRequest, NextResponse } from "next/server";
import { MongoClient, IndexSpecification, CreateIndexesOptions } from "mongodb";

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

// Organization database collections and their required indexes
interface IndexConfig {
  key: IndexSpecification;
  options?: CreateIndexesOptions;
}

interface CollectionConfig {
  name: string;
  indexes: IndexConfig[];
}

const ORGANIZATION_COLLECTIONS: CollectionConfig[] = [
  {
    name: 'organizations',
    indexes: [
      { key: { ownerId: 1 } },
      { key: { members: 1 } },
      { key: { createdAt: 1 } },
      { key: { name: 1 } }
    ]
  },
  {
    name: 'projects',
    indexes: [
      { key: { organizationId: 1 } },
      { key: { ownerId: 1 } },
      { key: { members: 1 } },
      { key: { createdAt: 1 } },
      { key: { name: 1 } }
    ]
  },
  {
    name: 'tasks',
    indexes: [
      { key: { projectId: 1 } },
      { key: { organizationId: 1 } },
      { key: { assignedTo: 1 } },
      { key: { status: 1 } },
      { key: { priority: 1 } },
      { key: { dueDate: 1 } },
      { key: { createdAt: 1 } },
      { key: { updatedAt: 1 } },
      { key: { columnId: 1 } },
      { key: { order: 1 } },
      { key: { createdBy: 1 } }
    ]
  },
  {
    name: 'columns',
    indexes: [
      { key: { projectId: 1 } },
      { key: { organizationId: 1 } },
      { key: { order: 1 } },
      { key: { name: 1 } }
    ]
  },
  {
    name: 'taskComments',
    indexes: [
      { key: { taskId: 1 } },
      { key: { projectId: 1 } },
      { key: { organizationId: 1 } },
      { key: { userId: 1 } },
      { key: { createdAt: 1 } }
    ]
  },
  {
    name: 'organizationInvitations',
    indexes: [
      { key: { organizationId: 1 } },
      { key: { email: 1 } },
      { key: { token: 1 }, options: { unique: true } },
      { key: { createdAt: 1, expiresAt: 1 } }
    ]
  }
];

export async function POST(request: NextRequest) {
  try {
    const { organizationId, connectionString, databaseName } = await request.json();

    if (!organizationId || !connectionString || !databaseName) {
      return NextResponse.json(
        { error: "Organization ID, connection string, and database name are required" },
        { status: 400 }
      );
    }

    console.log(`Initializing database for organization ${organizationId}:`, {
      databaseName,
      connectionString: connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') // Hide credentials in logs
    });

    const client = new MongoClient(connectionString, mongoOptions);
    
    try {
      await client.connect();
      console.log(`Connected to MongoDB for organization ${organizationId}`);
      
      const db = client.db(databaseName);
      
      let collectionsCreated = 0;
      let indexesCreated = 0;
      
      // Create collections and indexes
      for (const collectionConfig of ORGANIZATION_COLLECTIONS) {
        try {
          // Check if collection exists
          const collections = await db.listCollections({ name: collectionConfig.name }).toArray();
          
          if (collections.length === 0) {
            // Create collection
            await db.createCollection(collectionConfig.name);
            collectionsCreated++;
            console.log(`Created collection: ${collectionConfig.name}`);
          }
          
          const collection = db.collection(collectionConfig.name);
          
          // Create indexes
          for (const indexConfig of collectionConfig.indexes) {
            try {
              await collection.createIndex(indexConfig.key, indexConfig.options || {});
              indexesCreated++;
              console.log(`Created index on ${collectionConfig.name}:`, indexConfig.key);
            } catch (indexError) {
              // Index might already exist, which is fine
              console.log(`Index on ${collectionConfig.name} might already exist:`, indexConfig.key);
            }
          }
        } catch (collectionError) {
          console.error(`Error setting up collection ${collectionConfig.name}:`, collectionError);
          // Continue with other collections
        }
      }
      
      // Create the organization document in the self-hosted database with correct data
      try {
        console.log(`Creating organization document for ${organizationId} in self-hosted database`);
        const orgCollection = db.collection('organizations');
        
        // Check if organization already exists
        const existingOrg = await orgCollection.findOne({ _id: organizationId });
        console.log(`Existing org check for ${organizationId}:`, existingOrg ? 'exists' : 'not found');
        
        if (!existingOrg) {
          // Get the organization data from Firestore to ensure we have the correct info
          const { db: firestoreDb } = await import('@/lib/firebase');
          const { doc, getDoc } = await import('firebase/firestore');
          
          console.log(`Fetching organization data from Firestore for ${organizationId}`);
          const orgDocRef = doc(firestoreDb, 'organizations', organizationId);
          const orgDoc = await getDoc(orgDocRef);
          
          if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            console.log(`Organization data found in Firestore:`, {
              name: orgData.name,
              ownerId: orgData.ownerId,
              membersCount: orgData.members?.length || 0
            });
            const now = new Date();
            
            // Create organization document with correct data from Firestore
            const orgToInsert = {
              _id: organizationId,
              name: orgData.name || `Organization ${organizationId}`,
              description: orgData.description || "Self-hosted organization",
              ownerId: orgData.ownerId || null,
              members: orgData.members || [],
              memberRoles: orgData.memberRoles || {},
              memberCount: orgData.memberCount || 1,
              projects: orgData.projects || [],
              settings: {
                ...orgData.settings,
                useSelfHosting: true
              },
              createdAt: orgData.createdAt?.toDate?.() || now,
              updatedAt: now
            };
            
            console.log(`Inserting organization into MongoDB:`, {
              name: orgToInsert.name,
              ownerId: orgToInsert.ownerId,
              membersCount: orgToInsert.members.length
            });
            
            await orgCollection.insertOne(orgToInsert);
            console.log(`✅ Created organization document for ${organizationId} with correct data`);
          } else {
            console.warn(`⚠️ Organization ${organizationId} not found in Firestore, creating with minimal data`);
            const now = new Date();
            await orgCollection.insertOne({
              _id: organizationId,
              name: `Organization ${organizationId}`,
              description: "Self-hosted organization",
              ownerId: null,
              members: [],
              memberRoles: {},
              memberCount: 1,
              projects: [],
              settings: {
                isPublic: false,
                allowMemberInvites: false,
                requireApprovalForJoining: true,
                useSelfHosting: true
              },
              createdAt: now,
              updatedAt: now
            });
            console.log(`Created minimal organization document for ${organizationId}`);
          }
        } else {
          console.log(`Organization ${organizationId} already exists in self-hosted database`);
        }
      } catch (orgError) {
        console.error(`❌ Error creating organization document for ${organizationId}:`, orgError);
        // Not critical, continue
      }
      
      // Create default columns for new projects
      try {
        const columnsCollection = db.collection('columns');
        
        // Check if default columns template exists
        const existingTemplate = await columnsCollection.findOne({ 
          projectId: '__default_template__',
          organizationId: organizationId 
        });
        
        if (!existingTemplate) {
          const defaultColumns = [
            {
              projectId: '__default_template__',
              organizationId: organizationId,
              name: 'To Do',
              order: 0,
              role: 'todo',
              color: '#94a3b8',
              isTemplate: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              projectId: '__default_template__',
              organizationId: organizationId,
              name: 'In Progress',
              order: 1,
              role: null,
              color: '#3b82f6',
              isTemplate: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              projectId: '__default_template__',
              organizationId: organizationId,
              name: 'In Review',
              order: 2,
              role: null,
              color: '#f59e0b',
              isTemplate: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              projectId: '__default_template__',
              organizationId: organizationId,
              name: 'Done',
              order: 3,
              role: 'done',
              color: '#10b981',
              isTemplate: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          
          await columnsCollection.insertMany(defaultColumns);
          console.log('Created default column templates');
        }
      } catch (templateError) {
        console.error('Error creating default column templates:', templateError);
        // Not critical, continue
      }
      
      console.log(`Database initialization completed for organization ${organizationId}. Collections: ${collectionsCreated}, Indexes: ${indexesCreated}`);
      
      return NextResponse.json({
        success: true,
        message: "Database initialized successfully",
        collectionsCreated,
        indexesCreated,
        databaseName
      });
      
    } finally {
      await client.close();
    }
    
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Database initialization failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
