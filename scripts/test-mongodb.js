#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * 
 * This script tests the MongoDB Atlas connection with various configurations
 * to help diagnose SSL/TLS connection issues.
 */

const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function testConnection(options, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`⚙️  Options:`, JSON.stringify(options, null, 2));
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI, options);
    
    const startTime = Date.now();
    await client.connect();
    const connectTime = Date.now() - startTime;
    
    const db = client.db();
    
    const pingStart = Date.now();
    await db.admin().ping();
    const pingTime = Date.now() - pingStart;
    
    const listStart = Date.now();
    const collections = await db.listCollections().toArray();
    const listTime = Date.now() - listStart;
    
    console.log(`✅ Success! Connection time: ${connectTime}ms, Ping: ${pingTime}ms, List: ${listTime}ms`);
    console.log(`📊 Database: ${db.databaseName}, Collections: ${collections.length}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Failed:`, error.message);
    if (error.cause) {
      console.log(`🔍 Root cause:`, error.cause.message);
    }
    return false;
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.log(`⚠️  Warning closing connection:`, closeError.message);
      }
    }
  }
}

async function main() {
  console.log('🚀 MongoDB Atlas Connection Test');
  console.log('================================');
  console.log(`🔗 URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

  const testConfigurations = [
    {
      description: "Basic Connection (Default)",
      options: {}
    },
    {
      description: "With Explicit TLS",
      options: {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false
      }
    },
    {
      description: "Extended Timeouts",
      options: {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000
      }
    },
    {
      description: "Production Configuration (Recommended)",
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true,
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        maxIdleTimeMS: 30000,
        maxConnecting: 3,
        directConnection: false,
        journal: true
      }
    },
    {
      description: "Legacy Compatibility",
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: true
      }
    }
  ];

  let successCount = 0;
  
  for (const config of testConfigurations) {
    const success = await testConnection(config.options, config.description);
    if (success) successCount++;
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✅ Successful: ${successCount}/${testConfigurations.length}`);
  console.log(`❌ Failed: ${testConfigurations.length - successCount}/${testConfigurations.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 At least one configuration worked! Your MongoDB Atlas connection is functional.');
    console.log('💡 Use the working configuration in your application.');
  } else {
    console.log('\n⚠️  All configurations failed. Please check:');
    console.log('1. Your MongoDB Atlas cluster is running');
    console.log('2. Your IP address is whitelisted (0.0.0.0/0 for testing)');
    console.log('3. Your username and password are correct');
    console.log('4. Your connection string is valid');
    console.log('5. Your internet connection is stable');
  }
  
  process.exit(successCount > 0 ? 0 : 1);
}

main().catch(console.error);
