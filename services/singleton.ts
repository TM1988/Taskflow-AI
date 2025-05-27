import { MongoClient, Db } from 'mongodb';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

export function getMongoDb() {
  if (!mongoClient || !mongoDb) {
    throw new Error('MongoDB not initialized. Call initializeMongoDB first.');
  }
  
  return { mongoClient, mongoDb };
}

export async function initializeMongoDB() {
  if (mongoClient && mongoDb) {
    return { mongoClient, mongoDb };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    
    console.log('MongoDB connected successfully');
    return { mongoClient, mongoDb };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function closeMongoDB() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
  }
}
