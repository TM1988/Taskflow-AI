import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName } = await request.json();

    if (!connectionString) {
      return NextResponse.json(
        { success: false, error: 'Connection string is required' },
        { status: 400 }
      );
    }

    // Test the connection
    const client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000,
    });

    try {
      // Connect to the MongoDB cluster
      await client.connect();
      console.log('Database connection successful');

      // Test database access with the specified database name
      const dbName = databaseName || 'taskflow';
      const db = client.db(dbName);

      // First try a lightweight command that only requires database connection
      await db.command({ ping: 1 });
      
      console.log(`Successfully connected to database: ${dbName}`);

      // Then test write access by creating and deleting a test document
      const testCollection = db.collection('connection_test');
      await testCollection.insertOne({
        test: true,
        timestamp: new Date(),
        _connectionTest: true,
      });

      // Clean up test document
      await testCollection.deleteMany({ _connectionTest: true });

      return NextResponse.json({
        success: true,
        message: `Connection successful to database "${dbName}"`,
        databaseName: dbName,
      });
    } catch (error: any) {
      console.error('Database connection test failed:', error);

      let errorMessage = error.message || 'Unknown error';
      let errorDetails = '';

      if (error.code === 13) {
        errorMessage =
          `Not authorized on database "${databaseName || 'taskflow'}": Your database user doesn't have write access`;
        errorDetails =
          `Make sure your MongoDB user has readWrite permissions specifically for the "${databaseName || 'taskflow'}" database.`;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorDetails,
          code: error.code,
        },
        { status: 400 }
      );
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error in test-connection route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
