import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDb } from "@/services/singleton";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing MongoDB connection...");
    
    // Test initialization
    const startTime = Date.now();
    await initializeMongoDB();
    const initTime = Date.now() - startTime;
    
    // Test database access
    const dbStartTime = Date.now();
    const { mongoDb } = await getMongoDb();
    const dbTime = Date.now() - dbStartTime;
    
    // Test basic operations
    const opStartTime = Date.now();
    await mongoDb.admin().ping();
    const collections = await mongoDb.listCollections().toArray();
    const opTime = Date.now() - opStartTime;
    
    const totalTime = Date.now() - startTime;
    
    console.log("✅ MongoDB test completed successfully");
    
    return NextResponse.json({
      success: true,
      message: "MongoDB connection test successful",
      timing: {
        initialization: `${initTime}ms`,
        database_access: `${dbTime}ms`,
        operations: `${opTime}ms`,
        total: `${totalTime}ms`
      },
      database: {
        name: mongoDb.databaseName,
        collections: collections.map(c => c.name),
        collection_count: collections.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ MongoDB test failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
