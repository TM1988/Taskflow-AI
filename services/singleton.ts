import { MongoClient, Db } from "mongodb";

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isInitialized = false;
let isConnecting = false;

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "myVercelAppDB";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// MongoDB connection options for better reliability
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
};

export async function initializeMongoDB(): Promise<void> {
  if (isInitialized && mongoClient && mongoDb) {
    return;
  }

  if (isConnecting) {
    // Wait for ongoing connection attempt
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (isInitialized && mongoClient && mongoDb) {
      return;
    }
  }

  isConnecting = true;

  try {
    console.log("🔄 Initializing MongoDB connection...");
    console.log("🔗 Connection URI:", MONGODB_URI.replace(/\/\/.*@/, "//***:***@"));
    console.log("🗄️ Target Database:", DB_NAME);
    
    // Close existing connection if any
    if (mongoClient) {
      await mongoClient.close();
    }

    mongoClient = new MongoClient(MONGODB_URI, mongoOptions);
    await mongoClient.connect();
    
    mongoDb = mongoClient.db(DB_NAME);
    
    // Test the connection
    await mongoDb.admin().ping();
    console.log("✅ Database ping successful");
    
    // List collections to verify database access
    const collections = await mongoDb.listCollections().toArray();
    console.log("📋 Available collections:", collections.map(c => c.name));
    
    // Create indexes for better performance (only if collections don't exist)
    await createInitialCollections();
    
    isInitialized = true;
    console.log("✅ MongoDB connected successfully to database:", DB_NAME);

    // Handle connection events
    mongoClient.on('serverClosed', () => {
      console.log("⚠️ MongoDB server connection closed");
      isInitialized = false;
    });

    mongoClient.on('error', (error) => {
      console.error("❌ MongoDB connection error:", error);
      isInitialized = false;
    });

  } catch (error) {
    console.error("❌ Failed to initialize MongoDB:", error);
    console.error("Error details:", {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    isInitialized = false;
    mongoClient = null;
    mongoDb = null;
    throw error;
  } finally {
    isConnecting = false;
  }
}

async function createInitialCollections(): Promise<void> {
  if (!mongoDb) return;

  try {
    const collections = await mongoDb.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Create projects collection with indexes
    if (!collectionNames.includes('projects')) {
      await mongoDb.createCollection('projects');
      await mongoDb.collection('projects').createIndex({ ownerId: 1 });
      await mongoDb.collection('projects').createIndex({ members: 1 });
      console.log("✅ Created 'projects' collection with indexes");
    }

    // Create tasks collection with indexes
    if (!collectionNames.includes('tasks')) {
      await mongoDb.createCollection('tasks');
      await mongoDb.collection('tasks').createIndex({ projectId: 1 });
      await mongoDb.collection('tasks').createIndex({ assignee: 1 });
      await mongoDb.collection('tasks').createIndex({ columnId: 1 });
      console.log("✅ Created 'tasks' collection with indexes");
    }

    // Create columns collection with indexes
    if (!collectionNames.includes('columns')) {
      await mongoDb.createCollection('columns');
      await mongoDb.collection('columns').createIndex({ projectId: 1 });
      console.log("✅ Created 'columns' collection with indexes");
    }

    // Create comments collection with indexes
    if (!collectionNames.includes('comments')) {
      await mongoDb.createCollection('comments');
      await mongoDb.collection('comments').createIndex({ taskId: 1 });
      await mongoDb.collection('comments').createIndex({ authorId: 1 });
      console.log("✅ Created 'comments' collection with indexes");
    }

  } catch (error) {
    console.error("Error creating initial collections:", error);
  }
}

export async function getMongoDb(): Promise<{ mongoDb: Db }> {
  if (!isInitialized || !mongoDb || !mongoClient) {
    console.log("🔄 MongoDB not initialized, attempting to reconnect...");
    await initializeMongoDB();
  }

  if (!mongoDb) {
    throw new Error("MongoDB not initialized. Call initializeMongoDB first.");
  }

  // Test connection before returning
  try {
    await mongoDb.admin().ping();
  } catch (error) {
    console.log("🔄 MongoDB connection lost, reconnecting...");
    await initializeMongoDB();
    if (!mongoDb) {
      throw new Error("Failed to reconnect to MongoDB");
    }
  }

  return { mongoDb };
}

export async function closeMongoDB(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
    isInitialized = false;
  }
}

// For backward compatibility
export const getAdminDb = getMongoDb;
