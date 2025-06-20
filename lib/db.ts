import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let database: Db;

export async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI || '');
    await client.connect();
    database = client.db();
  }
  
  return { db: database, client };
}

// Alternative export for compatibility
export const db = {
  // Add your database connection methods here
  connect: connectDB,
};
