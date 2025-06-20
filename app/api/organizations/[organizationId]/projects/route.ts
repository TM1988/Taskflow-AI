import { NextRequest, NextResponse } from "next/server";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getOrganizationDatabaseConnection } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;

    console.log(`Fetching projects for organization: ${organizationId}`);

    // Get organization database connection
    const orgDb = await getOrganizationDatabaseConnection(organizationId);
    
    if (!orgDb) {
      // Fallback to Firebase if no custom database is configured
      const projectsQuery = query(
        collection(db, "projects"),
        where("organizationId", "==", organizationId)
      );

      const projectsSnapshot = await getDocs(projectsQuery);
      const projects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Found ${projects.length} projects for organization ${organizationId} in Firebase`);
      return NextResponse.json(projects);
    }

    // Use organization's custom database
    const customDbProjects = await orgDb
      .collection("projects")
      .find({ organizationId })
      .toArray();

    // Get the corresponding Firebase project references
    const formattedProjects = [];
    
    for (const customProject of customDbProjects) {
      // Find the Firebase project that references this custom DB project
      const firebaseProjectQuery = query(
        collection(db, "projects"),
        where("customDbProjectId", "==", customProject._id.toString())
      );
      
      const firebaseProjectSnapshot = await getDocs(firebaseProjectQuery);
      
      if (!firebaseProjectSnapshot.empty) {
        const firebaseProject = firebaseProjectSnapshot.docs[0];
        formattedProjects.push({
          id: firebaseProject.id, // Use Firebase ID for navigation
          name: customProject.name,
          description: customProject.description,
          organizationId: customProject.organizationId,
          ownerId: customProject.ownerId,
          members: customProject.members,
          status: customProject.status,
          createdAt: customProject.createdAt,
          updatedAt: customProject.updatedAt,
          customDbProjectId: customProject._id.toString()
        });
      }
    }

    console.log(`Found ${formattedProjects.length} projects for organization ${organizationId} in custom database`);

    return NextResponse.json(formattedProjects);

  } catch (error) {
    console.error("Error fetching organization projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const body = await request.json();
    const { name, description, ownerId } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: "Project name and owner ID are required" },
        { status: 400 }
      );
    }

    console.log(`Creating project in organization: ${organizationId}`);

    // Verify organization exists in Firebase (organization metadata always stored there)
    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get organization database connection
    console.log(`[ORG PROJECT CREATE] Attempting to get database connection for organization: ${organizationId}`);
    const orgDb = await getOrganizationDatabaseConnection(organizationId);
    
    if (!orgDb) {
      console.error(`[ORG PROJECT CREATE] Failed to get database connection for organization: ${organizationId}`);
      return NextResponse.json(
        { error: "Organization database connection failed" },
        { status: 500 }
      );
    }
    
    console.log(`[ORG PROJECT CREATE] Successfully connected to organization database for: ${organizationId}`);

    // Check project limit (5 projects per organization) in the organization's database
    console.log(`[ORG PROJECT CREATE] Checking existing projects in organization database...`);
    const existingProjects = await orgDb
      .collection("projects")
      .find({ organizationId })
      .toArray();
    
    console.log(`[ORG PROJECT CREATE] Found ${existingProjects.length} existing projects in organization database`);
    
    if (existingProjects.length >= 5) {
      return NextResponse.json(
        { error: "Organization has reached the maximum limit of 5 projects" },
        { status: 400 }
      );
    }

    // Create the project in the organization's database
    const projectData = {
      name: name.trim(),
      description: description?.trim() || "",
      organizationId,
      ownerId,
      members: [ownerId], // Owner is automatically a member
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`[ORG PROJECT CREATE] About to insert project data:`, JSON.stringify(projectData, null, 2));
    const result = await orgDb.collection("projects").insertOne(projectData);
    console.log(`[ORG PROJECT CREATE] Project inserted successfully with ID: ${result.insertedId}`);

    // Also store project reference in Firebase (for organization metadata)
    // DON'T include the MongoDB _id in Firebase data
    const firebaseProjectData = {
      name: name.trim(),
      description: description?.trim() || "",
      organizationId,
      ownerId,
      members: [ownerId],
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Store reference to the actual project in custom DB
      customDbProjectId: result.insertedId.toString()
    };
    
    const projectRef = await addDoc(collection(db, "projects"), firebaseProjectData);

    // Create default columns for the new project
    // CRITICAL FIX: Use MongoDB project ID for columns, not Firebase ID
    const mongoProjectId = result.insertedId.toString();
    const defaultColumns = [
      {
        name: "To Do",
        projectId: mongoProjectId, // Use MongoDB project ID
        organizationId,
        order: 0,
        color: "#ff6b6b",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "In Progress", 
        projectId: mongoProjectId,
        organizationId,
        order: 1,
        color: "#4ecdc4",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Review",
        projectId: mongoProjectId,
        organizationId,
        order: 2,
        color: "#45b7d1",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Done",
        projectId: mongoProjectId,
        organizationId,
        order: 3,
        color: "#96ceb4",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await orgDb.collection("columns").insertMany(defaultColumns);
    console.log(`Created ${defaultColumns.length} default columns for MongoDB project ${mongoProjectId} (Firebase ref: ${projectRef.id})`);
    console.log(`Column details:`, defaultColumns.map(col => ({name: col.name, projectId: col.projectId})));

    // Update organization with new project reference
    await updateDoc(orgRef, {
      projects: arrayUnion({
        id: projectRef.id,
        name: name.trim(),
        createdAt: new Date(),
      }),
      updatedAt: serverTimestamp(),
    });

    // Return project with Firebase ID for navigation (same format as GET endpoint)
    const newProject = {
      id: projectRef.id, // Use Firebase ID for navigation
      name: projectData.name,
      description: projectData.description,
      organizationId: projectData.organizationId,
      ownerId: projectData.ownerId,
      members: projectData.members,
      status: projectData.status,
      createdAt: projectData.createdAt,
      updatedAt: projectData.updatedAt,
      customDbProjectId: result.insertedId.toString()
    };

    console.log(`Project created successfully in organization database: ${result.insertedId}`);
    console.log(`Project reference created in Firebase: ${projectRef.id}`);
    
    return NextResponse.json(newProject);

  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
