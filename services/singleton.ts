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
      this.mongoClient = new MongoClient(process.env.MONGODB_URI || "", mongoOptions);
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

// MongoDB connection options for better reliability and TLS support
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000, // Increased from 15000 to 30000
  socketTimeoutMS: 60000, // Increased from 45000 to 60000
  connectTimeoutMS: 30000, // Added explicit connect timeout
  heartbeatFrequencyMS: 10000, // Added heartbeat frequency
  retryWrites: true,
  retryReads: true,
  // TLS/SSL options to fix Atlas connection issues
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  // Removed tlsInsecure as it conflicts with tlsAllowInvalidCertificates
  // Additional connection stability options
  maxIdleTimeMS: 30000,
  maxConnecting: 5, // Increased from 3 to 5
  directConnection: false,
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
      try {
        await mongoClient.close();
      } catch (closeError) {
        console.warn("Warning closing existing MongoDB connection:", closeError);
      }
    }

    // Retry connection logic
    let lastError: Error | null = null;
    const maxRetries = 5; // Increased from 3 to 5
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 MongoDB connection attempt ${attempt}/${maxRetries}`);
        
        mongoClient = new MongoClient(MONGODB_URI, mongoOptions);
        
        // Add connection timeout wrapper
        const connectPromise = mongoClient.connect();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
        });
        
        await Promise.race([connectPromise, timeoutPromise]);

        mongoDb = mongoClient.db(DB_NAME);

        // Test the connection with a more comprehensive ping
        await mongoDb.admin().ping();
        await mongoDb.listCollections().toArray(); // Additional connectivity test

        // Create indexes for better performance (only if collections don't exist)
        await createInitialCollections();

        isInitialized = true;
        console.log("✅ MongoDB connected successfully");

        // Handle connection events
        mongoClient.on("serverClosed", () => {
          console.log("⚠️ MongoDB server connection closed");
          isInitialized = false;
        });

        mongoClient.on("error", (error) => {
          console.error("❌ MongoDB connection error:", error);
          isInitialized = false;
        });

        break; // Success, exit retry loop
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error);
        
        if (mongoClient) {
          try {
            await mongoClient.close();
          } catch (closeError) {
            console.warn("Warning closing failed connection:", closeError);
          }
          mongoClient = null;
          mongoDb = null;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!isInitialized) {
      throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    }

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
  // Check if we need to initialize or reconnect
  if (!isInitialized || !mongoDb || !mongoClient) {
    console.log("🔄 MongoDB not initialized, attempting to connect...");
    await initializeMongoDB();
  }

  if (!mongoDb) {
    throw new Error("MongoDB not initialized. Call initializeMongoDB first.");
  }

  // Test connection before returning with retry logic
  const maxPingRetries = 2;
  for (let i = 0; i < maxPingRetries; i++) {
    try {
      await mongoDb.admin().ping();
      return { mongoDb };
    } catch (error) {
      console.log(`🔄 MongoDB ping failed (attempt ${i + 1}/${maxPingRetries}), reconnecting...`);
      
      if (i < maxPingRetries - 1) {
        // Reset state and try to reconnect
        isInitialized = false;
        await initializeMongoDB();
        
        if (!mongoDb) {
          throw new Error("Failed to reconnect to MongoDB");
        }
      } else {
        // Last attempt failed
        throw new Error(`MongoDB connection test failed after ${maxPingRetries} attempts: ${error}`);
      }
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
