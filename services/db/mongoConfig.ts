// Unified MongoDB configuration to prevent TLS/SSL conflicts
import { MongoClientOptions } from "mongodb";

/**
 * Parse MongoDB URI to check for existing TLS/SSL parameters
 * This prevents conflicts when both URI and options specify TLS settings
 */
function parseMongoUri(uri: string): {
  hasSSLParams: boolean;
  cleanUri: string;
  extractedOptions: Partial<MongoClientOptions>;
} {
  try {
    const url = new URL(uri);
    const params = url.searchParams;
    
    // Check for SSL/TLS parameters in the URI
    const sslParams = [
      'ssl', 'tls', 'sslValidate', 'sslCA', 'sslCert', 'sslKey',
      'sslPass', 'sslCRL', 'allowInvalidCertificates', 'allowInvalidHostnames',
      'tlsAllowInvalidCertificates', 'tlsAllowInvalidHostnames',
      'tlsCAFile', 'tlsCertificateKeyFile', 'tlsCertificateKeyFilePassword',
      'tlsInsecure'
    ];
    
    const hasSSLParams = sslParams.some(param => params.has(param));
    
    const extractedOptions: Partial<MongoClientOptions> = {};
    
    if (hasSSLParams) {
      // Extract TLS options from URI to avoid conflicts
      if (params.has('ssl')) extractedOptions.tls = params.get('ssl') === 'true';
      if (params.has('tls')) extractedOptions.tls = params.get('tls') === 'true';
      if (params.has('tlsAllowInvalidCertificates')) {
        extractedOptions.tlsAllowInvalidCertificates = params.get('tlsAllowInvalidCertificates') === 'true';
      }
      if (params.has('tlsAllowInvalidHostnames')) {
        extractedOptions.tlsAllowInvalidHostnames = params.get('tlsAllowInvalidHostnames') === 'true';
      }
    }
    
    return {
      hasSSLParams,
      cleanUri: uri, // Keep original URI - let MongoDB handle it
      extractedOptions
    };
  } catch (error) {
    console.warn('Error parsing MongoDB URI:', error);
    return {
      hasSSLParams: false,
      cleanUri: uri,
      extractedOptions: {}
    };
  }
}

/**
 * Get standardized MongoDB connection options
 * Handles TLS/SSL conflicts by intelligently merging URI and option settings
 */
export function getMongoOptions(connectionString?: string): MongoClientOptions {
  const uri = connectionString || process.env.MONGODB_URI || '';
  const { hasSSLParams, extractedOptions } = parseMongoUri(uri);
  
  // Base options that work for most configurations
  const baseOptions: MongoClientOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true,
    maxIdleTimeMS: 30000,
    maxConnecting: 5,
    directConnection: false,
  };
  
  // Smart TLS handling based on URI analysis
  let tlsOptions: Partial<MongoClientOptions> = {};
  
  if (hasSSLParams) {
    // URI has SSL/TLS params - use extracted options or minimal defaults
    tlsOptions = {
      ...extractedOptions,
      // Only set if not already in URI to avoid conflicts
      ...(extractedOptions.tls === undefined && { tls: true })
    };
  } else {
    // No SSL params in URI - apply our defaults for Atlas/secure connections
    const isAtlas = uri.includes('mongodb.net') || uri.includes('cloud.mongodb.com');
    const isLocalhost = uri.includes('localhost') || uri.includes('127.0.0.1');
    
    if (isAtlas) {
      // Atlas requires TLS
      tlsOptions = {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
      };
    } else if (!isLocalhost) {
      // Non-localhost, non-Atlas - probably needs TLS
      tlsOptions = {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
      };
    }
    // For localhost, don't add TLS options (leave default behavior)
  }
  
  const finalOptions = {
    ...baseOptions,
    ...tlsOptions
  };
  
  console.log(`🔧 MongoDB Config: URI has SSL params: ${hasSSLParams}, Final TLS settings:`, {
    tls: finalOptions.tls,
    tlsAllowInvalidCertificates: finalOptions.tlsAllowInvalidCertificates,
    tlsAllowInvalidHostnames: finalOptions.tlsAllowInvalidHostnames
  });
  
  return finalOptions;
}

/**
 * Get database name from environment or default
 */
export function getDbName(customName?: string): string {
  return customName || process.env.MONGODB_DB || "myVercelAppDB";
}

/**
 * Check if a MongoDB URI is valid
 */
export function isValidMongoUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === 'mongodb:' || url.protocol === 'mongodb+srv:';
  } catch {
    return false;
  }
}
