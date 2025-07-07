import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "myVercelAppDB";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

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

export async function getAdminDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, mongoOptions);
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

// Export adminDb for backward compatibility
export const adminDb = getAdminDb;
