import { MongoClient, Db } from "mongodb";

let adminClient: MongoClient | null = null;
let adminDb: Db | null = null;

async function initializeAdminMongoDB() {
  console.log("🔄 initializeAdminMongoDB: Starting MongoDB initialization...");

  if (adminClient && adminDb) {
    console.log("✅ initializeAdminMongoDB: Using existing connection");
    return adminDb;
  }

  const uri = process.env.MONGODB_URI;
  console.log("🔍 initializeAdminMongoDB: Environment check:");
  console.log("  - MONGODB_URI exists:", !!uri);
  console.log("  - MONGODB_URI length:", uri?.length || 0);
  console.log("  - MONGODB_URI prefix:", uri?.substring(0, 30) + "...");

  if (!uri) {
    console.error("❌ initializeAdminMongoDB: MONGODB_URI environment variable is not set");
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    console.log("🔗 initializeAdminMongoDB: Creating MongoClient...");
    adminClient = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    console.log("🔗 initializeAdminMongoDB: Attempting to connect...");
    await adminClient.connect();

    console.log("🔗 initializeAdminMongoDB: Getting database instance...");
    // Explicitly use "Taskflow" database
    adminDb = adminClient.db('Taskflow');

    console.log("🔗 initializeAdminMongoDB: Testing database connection...");
    await adminDb.admin().ping();

    console.log("✅ Admin MongoDB connected successfully");
    console.log("  - Database name:", adminDb.databaseName);

    return adminDb;
  } catch (error) {
    console.error("❌ Failed to connect to admin MongoDB:");
    console.error("  - Error type:", error?.constructor?.name);
    console.error("  - Error message:", (error as Error)?.message);
    console.error("  - Error code:", (error as any)?.code);
    console.error("  - Error stack:", (error as Error)?.stack);

    // Cleanup on error
    if (adminClient) {
      try {
        await adminClient.close();
      } catch (closeError) {
        console.error("  - Error closing client:", (closeError as Error)?.message);
      }
      adminClient = null;
    }
    adminDb = null;

    throw error;
  }
}

// Export a function that ensures connection
export async function getAdminDb() {
  console.log("🔄 getAdminDb: Called");

  if (!adminDb) {
    console.log("🔄 getAdminDb: No existing connection, initializing...");
    await initializeAdminMongoDB();
  } else {
    console.log("✅ getAdminDb: Using existing connection");
  }

  console.log("🔄 getAdminDb: Returning database:", !!adminDb);
  return adminDb;
}

// For backwards compatibility, but this should be replaced with getAdminDb()
export { adminDb };
