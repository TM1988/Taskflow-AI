import { MongoClient, Db } from "mongodb";

// Singleton service for managing shared resources
export class SingletonService {
  private static instance: SingletonService;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private isInitialized = false;
  private isConnecting = false;

  public static getInstance(): SingletonService {
    if (!SingletonService.instance) {
      SingletonService.instance = new SingletonService();
    }
    return SingletonService.instance;
  }

  // Export the getMongoDb function for direct use
  async getMongoDb(): Promise<{ mongoDb: Db; mongoClient: MongoClient }> {
    if (!this.mongoClient || !this.mongoDb) {
      this.mongoClient = new MongoClient(process.env.MONGODB_URI || "");
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db();
    }

    return {
      mongoDb: this.mongoDb,
      mongoClient: this.mongoClient,
    };
  }
}

export const singleton = SingletonService.getInstance();

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
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (isInitialized && mongoClient && mongoDb) {
      return;
    }
  }

  isConnecting = true;

  try {
    // Close existing connection if any
    if (mongoClient) {
      await mongoClient.close();
    }

    mongoClient = new MongoClient(MONGODB_URI, mongoOptions);
    await mongoClient.connect();

    mongoDb = mongoClient.db(DB_NAME);

    // Test the connection
    await mongoDb.admin().ping();

    // Create indexes for better performance (only if collections don't exist)
    await createInitialCollections();

    isInitialized = true;

    // Handle connection events
    mongoClient.on("serverClosed", () => {
      console.log("⚠️ MongoDB server connection closed");
      isInitialized = false;
    });

    mongoClient.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
      isInitialized = false;
    });
  } catch (error) {
    console.error("❌ Failed to initialize MongoDB:", error);
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
    const collectionNames = collections.map((c) => c.name);

    // Create projects collection with indexes
    if (!collectionNames.includes("projects")) {
      await mongoDb.createCollection("projects");
      await mongoDb.collection("projects").createIndex({ ownerId: 1 });
      await mongoDb.collection("projects").createIndex({ members: 1 });
    }

    // Create tasks collection with indexes
    if (!collectionNames.includes("tasks")) {
      await mongoDb.createCollection("tasks");
      await mongoDb.collection("tasks").createIndex({ projectId: 1 });
      await mongoDb.collection("tasks").createIndex({ assignee: 1 });
      await mongoDb.collection("tasks").createIndex({ columnId: 1 });
      console.log("✅ Created 'tasks' collection with indexes");
    }

    // Create columns collection with indexes
    if (!collectionNames.includes("columns")) {
      await mongoDb.createCollection("columns");
      await mongoDb.collection("columns").createIndex({ projectId: 1 });
      console.log("✅ Created 'columns' collection with indexes");
    }

    // Create comments collection with indexes
    if (!collectionNames.includes("comments")) {
      await mongoDb.createCollection("comments");
      await mongoDb.collection("comments").createIndex({ taskId: 1 });
      await mongoDb.collection("comments").createIndex({ authorId: 1 });
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
