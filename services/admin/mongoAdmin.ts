import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "myVercelAppDB";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getAdminDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      // optional: adjust poolSize or tls options here
      // poolSize: 10,
      // tls: true,
    });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

// Export adminDb for backward compatibility
export const adminDb = getAdminDb;
