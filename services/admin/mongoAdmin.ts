import { MongoClient, Db } from "mongodb";
import { getMongoOptions } from "../db/mongoConfig";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "myVercelAppDB";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getAdminDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }
  if (!cachedClient) {
    const mongoOptions = getMongoOptions(uri);
    cachedClient = new MongoClient(uri, mongoOptions);
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

// Export adminDb for backward compatibility
export const adminDb = getAdminDb;
