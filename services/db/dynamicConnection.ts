import { MongoClient, Db } from "mongodb";
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const officialUri = process.env.MONGODB_URI!;
const officialDbName = process.env.MONGODB_DB || "myVercelAppDB";

// Cache for database connections
const connectionCache = new Map<string, { client: MongoClient; db: Db }>();

export async function getUserDatabaseConnection(userId: string, forceRefresh: boolean = false): Promise<Db> {
  // If force refresh is requested, invalidate cache first
  if (forceRefresh) {
    await invalidateUserDatabaseCache(userId);
  }

  // Get user's database configuration from Firestore
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);
  
  let useCustomDB = false;
  let customConnectionString = '';
  let customDatabaseName = '';
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const databaseConfig = userData.databaseConfig;
    
    if (databaseConfig && databaseConfig.useCustomMongoDB) {
      useCustomDB = true;
      customConnectionString = databaseConfig.connectionString;
      customDatabaseName = databaseConfig.databaseName || 'taskflow';
    }
  }
  
  if (useCustomDB && customConnectionString) {
    // Use custom database
    const cacheKey = `custom_${userId}`;
    
    if (connectionCache.has(cacheKey)) {
      console.log(`Using cached custom database connection for user ${userId}`);
      return connectionCache.get(cacheKey)!.db;
    }
    
    console.log(`Creating new custom database connection for user ${userId} to ${customDatabaseName}`);
    try {
      const client = new MongoClient(customConnectionString);
      await client.connect();
      const database = client.db(customDatabaseName);
      
      connectionCache.set(cacheKey, { client, db: database });
      console.log(`[getUserDatabaseConnection] Successfully connected to custom database: ${customDatabaseName}`);
      return database;
    } catch (error) {
      console.error(`[getUserDatabaseConnection] Failed to connect to custom database:`, error);
      throw error;
    }
  } else {
    // Use official database
    const cacheKey = 'official';
    
    if (connectionCache.has(cacheKey)) {
      return connectionCache.get(cacheKey)!.db;
    }
    
    try {
      const client = new MongoClient(officialUri);
      await client.connect();
      const database = client.db(officialDbName);
      
      connectionCache.set(cacheKey, { client, db: database });
      return database;
    } catch (error) {
      console.error(`[getUserDatabaseConnection] Failed to connect to official database:`, error);
      throw error;
    }
  }
}

// New function to get database connection for an organization
export async function getOrganizationDatabaseConnection(organizationId: string, forceRefresh: boolean = false): Promise<Db> {
  // If force refresh is requested, invalidate cache first
  if (forceRefresh) {
    await invalidateOrganizationDatabaseCache(organizationId);
  }

  // Get organization's database configuration from Firestore
  const orgDocRef = doc(db, 'organizations', organizationId);
  const orgDoc = await getDoc(orgDocRef);
  
  let useCustomDB = false;
  let customConnectionString = '';
  let customDatabaseName = '';
  
  if (orgDoc.exists()) {
    const orgData = orgDoc.data();
    const settings = orgData.settings;
    
    if (settings && (settings.useSelfHosting || settings.useCustomDatabase || settings.storageType === 'self-hosted')) {
      useCustomDB = true;
      // Check for connection string in multiple possible locations
      customConnectionString = settings.mongoUrl || 
                              settings.connectionString || 
                              settings.customMongoUrl || 
                              settings.databaseUrl ||
                              settings.database?.mongoUrl || // NESTED STRUCTURE
                              settings.database?.connectionString;
      
      // Check for database name in multiple possible locations  
      customDatabaseName = settings.databaseName || 
                          settings.customDatabaseName || 
                          settings.database?.databaseName || // NESTED STRUCTURE
                          'DATABASE';
      
      
      // Special handling if the database name is exactly "DATABASE" from UI
      if (customDatabaseName === 'DATABASE' || !customDatabaseName) {
        customDatabaseName = 'DATABASE';
      }
    }
  }
  
  if (useCustomDB && customConnectionString) {
    // Use organization's self-hosted database
    const cacheKey = `org_${organizationId}`;
    
    if (connectionCache.has(cacheKey)) {
      return connectionCache.get(cacheKey)!.db;
    }
    
    try {
      const client = new MongoClient(customConnectionString);
      await client.connect();
      const database = client.db(customDatabaseName);
      
      connectionCache.set(cacheKey, { client, db: database });
      return database;
    } catch (error) {
      console.error(`[getOrganizationDatabaseConnection] Failed to connect to organization database:`, error);
      throw error;
    }
  } else {
    // Use official database
    const cacheKey = 'official';
    
    if (connectionCache.has(cacheKey)) {
      return connectionCache.get(cacheKey)!.db;
    }
    
    try {
      const client = new MongoClient(officialUri);
      await client.connect();
      const database = client.db(officialDbName);
      
      connectionCache.set(cacheKey, { client, db: database });
      return database;
    } catch (error) {
      console.error(`[getOrganizationDatabaseConnection] Failed to connect to official database:`, error);
      throw error;
    }
  }
}

// Helper function to get user ID from request headers
export function getUserIdFromRequest(request: Request): string | null {
  // You might need to adjust this based on how user authentication is handled
  // This could come from JWT token, session, or other auth mechanism
  const userId = request.headers.get('x-user-id') || 
                 request.headers.get('authorization')?.replace('Bearer ', '') ||
                 new URL(request.url).searchParams.get('userId');
  
  return userId;
}

// Fallback to admin DB when user ID is not available
export async function getAdminDb(): Promise<Db> {
  const cacheKey = 'official';
  
  if (connectionCache.has(cacheKey)) {
    return connectionCache.get(cacheKey)!.db;
  }
  
  const client = new MongoClient(officialUri);
  await client.connect();
  const database = client.db(officialDbName);
  
  connectionCache.set(cacheKey, { client, db: database });
  return database;
}

// Function to invalidate cache for a specific user
export async function invalidateUserDatabaseCache(userId: string): Promise<void> {
  const cacheKey = `custom_${userId}`;
  
  if (connectionCache.has(cacheKey)) {
    const cached = connectionCache.get(cacheKey);
    try {
      await cached!.client.close();
    } catch (error) {
      console.warn('Error closing cached connection:', error);
    }
    connectionCache.delete(cacheKey);
    console.log(`Cache invalidated for user: ${userId}`);
  }
}

// Function to invalidate cache for a specific organization
export async function invalidateOrganizationDatabaseCache(organizationId: string): Promise<void> {
  const cacheKey = `org_${organizationId}`;
  
  if (connectionCache.has(cacheKey)) {
    const cached = connectionCache.get(cacheKey);
    try {
      await cached!.client.close();
    } catch (error) {
      console.warn('Error closing cached connection:', error);
    }
    connectionCache.delete(cacheKey);
    console.log(`Cache invalidated for organization: ${organizationId}`);
  }
}

// Function to clear all cached connections (useful for development/debugging)
export async function clearAllConnectionCache(): Promise<void> {
  const keys = Array.from(connectionCache.keys());
  
  for (const key of keys) {
    const cached = connectionCache.get(key);
    if (cached) {
      try {
        await cached.client.close();
      } catch (error) {
        console.warn(`Error closing cached connection for ${key}:`, error);
      }
    }
  }
  connectionCache.clear();
  console.log('All connection cache cleared');
}
