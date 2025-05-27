// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs').promises;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('Make sure .env.local exists and contains MONGODB_URI');
  process.exit(1);
}

console.log('✅ MONGODB_URI loaded:', MONGODB_URI.substring(0, 30) + '...');

async function migrateData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('Taskflow');
    
    // Read your JSON data file
    const dataPath = '/Users/tan135/Downloads/tasks exp.json';
    const jsonData = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(jsonData);
    
    console.log('Migration started for:', data.metadata.projectName);
    console.log('🗑️  CLEARING ALL EXISTING DATA...');
    
    // Clear ALL existing collections
    const collections = ['organizations', 'projects', 'columns', 'tasks', 'metadata'];
    for (const collectionName of collections) {
      try {
        const result = await db.collection(collectionName).deleteMany({});
        console.log(`  - Cleared ${collectionName}: ${result.deletedCount} documents deleted`);
      } catch (error) {
        console.log(`  - Collection ${collectionName} doesn't exist or error: ${error.message}`);
      }
    }
    
    console.log('✅ All existing data cleared');
    
    // Create default organization
    const organizationsCollection = db.collection('organizations');
    
    const defaultOrgId = new ObjectId();
    const defaultOrganization = {
      _id: defaultOrgId,
      name: 'Default Organization',
      description: 'Auto-created during migration',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await organizationsCollection.insertOne(defaultOrganization);
    console.log('Created default organization');
    
    // Create project within organization
    const projectsCollection = db.collection('projects');
    
    const projectId = data.metadata.projectId; // Use original string ID
    const project = {
      _id: projectId, // Store as string, not ObjectId
      name: data.metadata.projectName,
      organizationId: defaultOrgId,
      description: 'Migrated from Firestore',
      ownerId: 'uzm3ZfgkFtMwbx4iFCEtZWr57p82',
      members: ['uzm3ZfgkFtMwbx4iFCEtZWr57p82'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await projectsCollection.insertOne(project);
    console.log('Created project:', data.metadata.projectName);
    
    // Migrate columns with original string IDs
    console.log('Migrating columns...');
    const columnsCollection = db.collection('columns');
    let columnCount = 0;
    
    for (const [columnId, columnData] of Object.entries(data.columns)) {
      const column = {
        _id: columnId, // Keep original string ID
        name: columnData.name,
        projectId: projectId, // String reference
        order: columnData.order || columnCount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await columnsCollection.insertOne(column);
      columnCount++;
      console.log(`Created column: ${columnData.name} (${columnId})`);
    }
    
    console.log(`Migrated ${columnCount} columns`);
    
    // Migrate tasks with string references
    console.log('Migrating tasks...');
    const tasksCollection = db.collection('tasks');
    let taskCount = 0;
    
    for (const [taskId, taskData] of Object.entries(data.tasks)) {
      const task = {
        _id: taskId, // Keep original string ID
        title: taskData.title,
        description: taskData.description || '',
        projectId: projectId, // String reference
        columnId: taskData.columnId, // String reference - no conversion!
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        order: taskData.order || taskCount,
        isBlocked: taskData.isBlocked || false,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await tasksCollection.insertOne(task);
      taskCount++;
    }
    
    console.log(`Migrated ${taskCount} tasks`);
    
    // Store migration metadata
    const metadataCollection = db.collection('metadata');
    await metadataCollection.insertOne({
      _id: 'migration',
      projectId: projectId,
      projectName: data.metadata.projectName,
      migratedAt: new Date(),
      source: 'firestore',
      taskCount: taskCount,
      columnCount: columnCount,
    });
    
    console.log('✅ Migration completed successfully - ALL DATA OVERWRITTEN');
    console.log('Database: Taskflow on MongoDB Atlas');
    console.log('Organization ID:', defaultOrgId);
    console.log('Project ID:', projectId);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateData();
