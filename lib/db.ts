import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let database: Db;

// Shared MongoDB connection options to fix TLS conflicts
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  // TLS/SSL options to fix Atlas connection issues
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  // Additional connection stability options
  maxIdleTimeMS: 30000,
  maxConnecting: 5,
  directConnection: false,
};

export async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI || '', mongoOptions);
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
