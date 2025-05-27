import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`🔄 [${requestId}] GitHub connection-status API called`);
  
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");

    console.log(`🔍 [${requestId}] Request details:`);
    console.log(`  - URL: ${request.url}`);
    console.log(`  - Method: ${request.method}`);
    console.log(`  - User ID: ${userId}`);
    console.log(`  - Headers: ${JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2)}`);

    if (!userId) {
      console.error(`❌ [${requestId}] Missing userId parameter`);
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔄 [${requestId}] Getting admin database...`);
    const adminDb = await getAdminDb();

    if (!adminDb) {
      console.error(`❌ [${requestId}] MongoDB connection failed - adminDb is null/undefined`);
      throw new Error("MongoDB connection failed");
    }

    console.log(`✅ [${requestId}] Database connected successfully`);
    console.log(`  - Database name: ${adminDb.databaseName}`);

    console.log(`🔍 [${requestId}] Querying githubTokens collection for userId: ${userId}`);
    const tokenDoc = await adminDb.collection("githubTokens").findOne({ userId });
    
    console.log(`🔍 [${requestId}] Query result:`);
    console.log(`  - Document found: ${!!tokenDoc}`);
    console.log(`  - Document ID: ${tokenDoc?._id}`);
    console.log(`  - Has access token: ${!!tokenDoc?.accessToken}`);
    
    const result = {
      isConnected: !!tokenDoc
    };
    
    console.log(`✅ [${requestId}] Returning result:`, result);
    return NextResponse.json(result);
  } catch (error: unknown) {
    // Cast error to a type that has the properties we need
    const err = error as Error;
    
    console.error(`❌ [${requestId}] Error in GitHub connection-status API:`);
    console.error(`  - Error type: ${err?.constructor?.name}`);
    console.error(`  - Error message: ${err?.message}`);
    console.error(`  - Error code: ${(err as any)?.code}`);
    console.error(`  - Error stack: ${err?.stack}`);
    console.error(`  - Process env MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
    console.error(`  - Process env MONGODB_URI length: ${process.env.MONGODB_URI?.length || 0}`);
    
    return NextResponse.json(
      { 
        isConnected: false,
        error: err?.message || 'Unknown error',
        requestId 
      },
      { status: 200 }
    );
  }
}
