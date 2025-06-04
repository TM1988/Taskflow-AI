const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://tan135admin:hzxu9467@tan135.hackclub.app:27018/myVercelAppDB?authSource=myVercelAppDB&tls=false';
const DB_NAME = 'myVercelAppDB';

async function testConnection() {
  let client;
  
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Test ping
    await db.admin().ping();
    console.log('✅ Database ping successful');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections:', collections.map(c => c.name));
    
    // Test write operation
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    console.log('✅ Test write successful, ID:', result.insertedId);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Test cleanup successful');
    
    console.log('🎉 Database is ready to use!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connection closed');
    }
  }
}

testConnection();
