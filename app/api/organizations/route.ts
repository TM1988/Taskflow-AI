import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const showDeleted = searchParams.get("deleted") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching organizations for user: ${userId}, showDeleted: ${showDeleted}`);

    const orgsRef = collection(db, "organizations");
    
    // Query for organizations where user is owner OR member
    const ownerQuery = query(orgsRef, where("ownerId", "==", userId));
    const memberQuery = query(orgsRef, where("members", "array-contains", userId));

    const [ownerSnapshot, memberSnapshot] = await Promise.all([
      getDocs(ownerQuery),
      getDocs(memberQuery)
    ]);

    const organizations: any[] = [];
    const orgIds = new Set();

    // Process owner organizations
    ownerSnapshot.forEach((doc) => {
      if (!orgIds.has(doc.id)) {
        const data = doc.data();
        const isDeleted = data.deleted === true;
        
        // Filter based on deleted status
        if (showDeleted && !isDeleted) return;
        if (!showDeleted && isDeleted) return;
        
        organizations.push({
          id: doc.id,
          ...data,
          role: "Owner",
          memberCount: data.members?.length || 1,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          deletedAt: data.deletedAt?.toDate?.()?.toISOString() || data.deletedAt,
          projects: [], // Will be populated below
        });
        orgIds.add(doc.id);
      }
    });

    // Process member organizations
    memberSnapshot.forEach((doc) => {
      if (!orgIds.has(doc.id)) {
        const data = doc.data();
        const isDeleted = data.deleted === true;
        
        // Filter based on deleted status
        if (showDeleted && !isDeleted) return;
        if (!showDeleted && isDeleted) return;
        
        // Determine role from memberRoles
        let role = "Member";
        if (data.memberRoles && data.memberRoles[userId]) {
          role = data.memberRoles[userId] === "admin" ? "Admin" : "Member";
        }
        
        organizations.push({
          id: doc.id,
          ...data,
          role: role,
          memberCount: data.members?.length || 1,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          deletedAt: data.deletedAt?.toDate?.()?.toISOString() || data.deletedAt,
          projects: [], // Will be populated below
        });
        orgIds.add(doc.id);
      }
    });

    // Fetch projects for each organization - only include projects where user is a member
    for (const org of organizations) {
      try {
        const projectsRef = collection(db, "projects");
        const projectsQuery = query(projectsRef, where("organizationId", "==", org.id));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const projects = projectsSnapshot.docs
          .map(doc => {
            const projectData = doc.data();
            return {
              id: doc.id,
              name: projectData.name,
              description: projectData.description,
              ownerId: projectData.ownerId,
              members: projectData.members || [],
            };
          })
          .filter(project => {
            // Only include projects where the user is the owner OR is in the members array
            const isOwner = project.ownerId === userId;
            const isMember = project.members.includes(userId);
            return isOwner || isMember;
          })
          .map(project => ({
            // Remove internal fields from the response
            id: project.id,
            name: project.name,
            description: project.description,
          }));
        
        org.projects = projects;
      } catch (error) {
        console.error(`Error fetching projects for organization ${org.id}:`, error);
        org.projects = [];
      }
    }

    console.log(`Found ${organizations.length} organizations for user ${userId}`);
    return NextResponse.json(organizations);

  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, ownerId, useSelfHosting, mongoUrl, databaseName } = await request.json();

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: "Name and owner ID are required" },
        { status: 400 }
      );
    }

    // Validate self-hosting requirements
    if (useSelfHosting && (!mongoUrl || !databaseName)) {
      return NextResponse.json(
        { error: "MongoDB URL and database name are required for self-hosting" },
        { status: 400 }
      );
    }

    console.log(`Creating organization: ${name} for owner: ${ownerId}, self-hosting: ${useSelfHosting}`);

    const organizationData = {
      name: name.trim(),
      description: description?.trim() || "",
      ownerId,
      members: [ownerId], // Owner is automatically a member
      memberRoles: {
        [ownerId]: "owner" // Ensure owner role is properly set
      },
      memberCount: 1,
      projects: [],
      settings: {
        isPublic: false,
        allowMemberInvites: false,
        requireApprovalForJoining: true,
        useSelfHosting: useSelfHosting || false, // New field for per-organization storage
        ...(useSelfHosting && {
          database: {
            mongoUrl: mongoUrl.trim(),
            databaseName: databaseName.trim(),
            configuredAt: new Date(),
          }
        })
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "organizations"), organizationData);

    // If self-hosting, initialize the database
    if (useSelfHosting && mongoUrl && databaseName) {
      try {
        console.log(`Initializing self-hosted database for organization ${docRef.id}`);
        
        // Add a small delay to ensure Firestore document is written
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
          throw new Error('NEXT_PUBLIC_BASE_URL is not configured');
        }
        
        const initResponse = await fetch(`${baseUrl}/api/organizations/initialize-database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: docRef.id,
            connectionString: mongoUrl.trim(),
            databaseName: databaseName.trim(),
          }),
        });

        if (!initResponse.ok) {
          const errorData = await initResponse.json();
          console.error(`Database initialization failed for organization ${docRef.id}:`, errorData);
          // Note: We don't fail the organization creation if DB init fails
          // The user can retry later from the organization settings
        } else {
          const initData = await initResponse.json();
          console.log(`Database initialization successful for organization ${docRef.id}:`, initData);
        }
      } catch (initError) {
        console.error(`Error during database initialization for organization ${docRef.id}:`, initError);
        // Continue with organization creation even if initialization fails
      }
    }

    // Get the created document to return with proper timestamps
    const createdDoc = await getDoc(docRef);
    const createdData = createdDoc.data();

    const result = {
      id: docRef.id,
      ...createdData,
      userRole: "Owner",
      isOwner: true,
      createdAt:
        createdData?.createdAt?.toDate?.()?.toISOString() ||
        new Date().toISOString(),
      updatedAt:
        createdData?.updatedAt?.toDate?.()?.toISOString() ||
        new Date().toISOString(),
    };

    console.log(`Organization created successfully with ID: ${docRef.id}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
