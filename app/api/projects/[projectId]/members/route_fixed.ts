import { NextRequest, NextResponse } from "next/server";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getOrganizationDatabaseConnection, getAdminDb } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Helper function to find project - FIREBASE FIRST
async function findProjectForMembers(projectId: string, organizationId?: string) {
  console.log(`🔍 Finding project for members: ${projectId} with organizationId: ${organizationId}`);
  
  // TRY FIREBASE FIRST FOR ALL PROJECTS
  console.log(`🔥 Checking Firebase first for project: ${projectId}`);
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();
      console.log(`✅ Found project in Firebase: ${projectData.name}`);
      return {
        project: { id: projectSnap.id, ...projectData },
        database: null, // Firebase doesn't use MongoDB database
        source: 'firebase'
      };
    }
  } catch (firebaseError) {
    console.error("Error checking Firebase for members:", firebaseError);
  }

  // Only try MongoDB if Firebase fails AND it's a MongoDB ObjectId
  console.log(`🍃 Firebase not found, checking MongoDB databases for project: ${projectId}`);
  
  // Check if this looks like a MongoDB ObjectId (24 chars, hex)
  const isMongoId = projectId.length === 24 && /^[0-9a-fA-F]{24}$/.test(projectId);
  
  if (isMongoId) {
    // Try organization database first if provided
    if (organizationId) {
      try {
        const orgDb = await getOrganizationDatabaseConnection(organizationId);
        if (orgDb) {
          const orgProject = await orgDb.collection("projects").findOne({ 
            _id: new ObjectId(projectId)
          });
          
          if (orgProject) {
            console.log(`✅ Found project in organization DB for members: ${orgProject.name}`);
            return {
              project: orgProject,
              database: orgDb,
              source: 'organization'
            };
          }
        }
      } catch (orgError) {
        console.error("Error checking organization database for members:", orgError);
      }
    }
    
    // Fallback to admin database for MongoDB projects
    try {
      const adminDb = await getAdminDb();
      const adminProject = await adminDb.collection("projects").findOne({ 
        _id: new ObjectId(projectId)
      });
      
      if (adminProject) {
        console.log(`✅ Found project in admin DB for members: ${adminProject.name}`);
        return {
          project: adminProject,
          database: adminDb,
          source: 'admin'
        };
      }
    } catch (adminError) {
      console.error("Error checking admin database for members:", adminError);
    }
  }
  
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const requestId = generateRequestId();
  
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    console.log(`🔍 [${requestId}] Fetching members for project: ${projectId}, orgId: ${organizationId}`);

    if (!projectId || projectId === "personal") {
      console.log(`❌ [${requestId}] Invalid project ID: ${projectId}`);
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const result = await findProjectForMembers(projectId, organizationId || undefined);
    
    if (!result) {
      console.log(`❌ [${requestId}] Project not found: ${projectId}`);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { project, source } = result;
    console.log(`✅ [${requestId}] Found project: ${(project as any).name} from ${source}`);

    if (source === 'firebase') {
      // Handle Firebase project
      const projectData = project as any;
      const memberIds = projectData.members || [];
      
      // Always include the owner in the members list for consistency
      const allMemberIds = Array.from(new Set([projectData.ownerId, ...memberIds]));

      // If this is an organization project, fetch organization data to get member roles
      let organizationData: any = null;
      if (projectData.organizationId) {
        try {
          const orgRef = doc(db, "organizations", projectData.organizationId);
          const orgSnap = await getDoc(orgRef);
          if (orgSnap.exists()) {
            organizationData = orgSnap.data();
          }
        } catch (error) {
          console.error("Error fetching organization data:", error);
        }
      }

      // Fetch member details from Firebase users collection
      const membersWithDetails = await Promise.all(
        allMemberIds.map(async (memberId: string) => {
          try {
            const userRef = doc(db, "users", memberId);
            const userSnap = await getDoc(userRef);
            
            let memberRole = "member";
            
            // Determine role based on organization or project ownership
            if (memberId === projectData.ownerId) {
              memberRole = "owner";
            } else if (organizationData) {
              // Check organization roles
              if (organizationData.ownerId === memberId) {
                memberRole = "owner";
              } else if (organizationData.memberRoles && organizationData.memberRoles[memberId]) {
                memberRole = organizationData.memberRoles[memberId];
              }
            }
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              return {
                id: memberId,
                name: userData.displayName || userData.name || "Unknown User",
                email: userData.email || "",
                photoURL: userData.photoURL || "",
                role: memberRole,
              };
            } else {
              return {
                id: memberId,
                name: "Unknown User",
                email: "",
                photoURL: "",
                role: memberRole,
              };
            }
          } catch (error) {
            console.error(`Error fetching member ${memberId}:`, error);
            return {
              id: memberId,
              name: "Unknown User",
              email: "",
              photoURL: "",
              role: memberId === projectData.ownerId ? "owner" : "member",
            };
          }
        })
      );

      console.log(`✅ [${requestId}] Returning ${membersWithDetails.length} Firebase members with roles`);
      return NextResponse.json(membersWithDetails);
      
    } else {
      // Handle MongoDB project
      const mongoProject = project as any;
      const memberIds = mongoProject.members || [];
      
      // Always include the owner in the members list for consistency (same as Firebase)
      const allMemberIds = Array.from(new Set([mongoProject.ownerId, ...memberIds]));
      
      if (allMemberIds.length === 0) {
        console.log(`ℹ️ [${requestId}] No members found in MongoDB project`);
        return NextResponse.json([]);
      }

      console.log(`🔍 [${requestId}] MongoDB project members: owner=${mongoProject.ownerId}, additional=${memberIds.length}, total=${allMemberIds.length}`);

      // If this is an organization project, fetch organization data to get member roles
      let organizationData: any = null;
      if (mongoProject.organizationId) {
        try {
          const orgRef = doc(db, "organizations", mongoProject.organizationId);
          const orgSnap = await getDoc(orgRef);
          if (orgSnap.exists()) {
            organizationData = orgSnap.data();
          }
        } catch (error) {
          console.error("Error fetching organization data for MongoDB project:", error);
        }
      }

      // For MongoDB projects, try to fetch real user data from Firebase Auth
      // This allows us to get actual user information while storing project data in MongoDB
      const membersWithDetails = await Promise.all(allMemberIds.map(async (memberId: string) => {
        try {
          let memberRole = "member";
          
          // Determine role based on organization or project ownership
          if (memberId === mongoProject.ownerId) {
            memberRole = "owner";
          } else if (organizationData) {
            // Check organization roles
            if (organizationData.ownerId === memberId) {
              memberRole = "owner";
            } else if (organizationData.memberRoles && organizationData.memberRoles[memberId]) {
              memberRole = organizationData.memberRoles[memberId];
            }
          }
          
          // Try to get user data from Firebase first (for real user profiles)
          const userDocRef = doc(db, 'users', memberId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              id: memberId,
              name: userData.displayName || userData.name || userData.email?.split('@')[0] || 'Unknown User',
              email: userData.email || `user-${memberId}@unknown.com`,
              role: memberRole,
              photoURL: userData.photoURL || null
            };
          } else {
            // Last fallback: return basic member info with user ID
            return {
              id: memberId,
              name: `User ${memberId.slice(-4)}`,
              email: `user-${memberId.slice(-4)}@example.com`,
              role: memberRole,
              photoURL: null
            };
          }
        } catch (error) {
          console.error(`Error fetching user data for member ${memberId}:`, error);
          return {
            id: memberId,
            name: `User ${memberId.slice(-4)}`,
            email: `user-${memberId.slice(-4)}@example.com`,
            role: memberId === mongoProject.ownerId ? "owner" : "member",
            photoURL: null
          };
        }
      }));

      console.log(`✅ [${requestId}] Returning ${membersWithDetails.length} MongoDB members with real user data and roles (including owner)`);
      return NextResponse.json(membersWithDetails);
    }

  } catch (error) {
    console.error(`❌ [${requestId}] Error fetching project members:`, {
      type: (error as Error).constructor.name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });

    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}

// POST add project member
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const requestId = generateRequestId();
  
  try {
    const { projectId } = params;
    const body = await request.json();
    const { userId, email, role = "member" } = body;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    console.log(`➕ [${requestId}] Adding member to project ${projectId}:`, { userId, email, role });

    const result = await findProjectForMembers(projectId, organizationId || undefined);
    
    if (!result) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { project, database, source } = result;

    if (source === 'firebase') {
      // Handle Firebase project
      const projectData = project as any;
      let targetUserId = userId;

      // If email provided instead of userId, find the user
      if (!targetUserId && email) {
        const usersQuery = query(
          collection(db, "users"),
          where("email", "==", email)
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        if (usersSnapshot.empty) {
          return NextResponse.json(
            { error: "User not found with that email" },
            { status: 404 }
          );
        }
        
        targetUserId = usersSnapshot.docs[0].id;
      }

      if (!targetUserId) {
        return NextResponse.json(
          { error: "User ID or email is required" },
          { status: 400 }
        );
      }

      // Check if user is already a member
      const currentMembers = projectData.members || [];
      if (currentMembers.includes(targetUserId) || projectData.ownerId === targetUserId) {
        return NextResponse.json(
          { error: "User is already a member of this project" },
          { status: 400 }
        );
      }

      // Add the member to the Firebase project
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        members: arrayUnion(targetUserId),
        updatedAt: serverTimestamp()
      });

      // Get user details for response
      const userRef = doc(db, "users", targetUserId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      const newMember = {
        id: targetUserId,
        name: userData.displayName || userData.name || "Unknown User",
        email: userData.email || "",
        photoURL: userData.photoURL || "",
        role: "member"
      };

      console.log(`✅ [${requestId}] Successfully added member to Firebase project ${projectId}:`, newMember);
      return NextResponse.json(newMember);
      
    } else {
      // Handle MongoDB project
      if (!database) {
        throw new Error("Database connection failed for MongoDB project");
      }

      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required for MongoDB projects" },
          { status: 400 }
        );
      }

      // Add member to MongoDB project - BUT USE PROPER QUERY FOR STRING IDS
      let updateResult;
      
      try {
        // Try as ObjectId first if it looks like one
        if (projectId.length === 24 && /^[0-9a-fA-F]{24}$/.test(projectId)) {
          updateResult = await database.collection("projects").updateOne(
            { _id: new ObjectId(projectId) },
            {
              $addToSet: { members: userId },
              $set: { updatedAt: new Date() }
            }
          );
        } else {
          // For non-ObjectId format, use string directly (should not happen normally)
          updateResult = await database.collection("projects").updateOne(
            { _id: projectId as any },
            {
              $addToSet: { members: userId },
              $set: { updatedAt: new Date() }
            }
          );
        }
        
        if (updateResult.matchedCount === 0) {
          return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        console.log(`✅ [${requestId}] Member added to MongoDB project successfully`);
        return NextResponse.json({ success: true });
        
      } catch (mongoError) {
        console.error(`❌ [${requestId}] MongoDB update error:`, mongoError);
        return NextResponse.json({ error: "Failed to update MongoDB project" }, { status: 500 });
      }
    }

  } catch (error) {
    console.error(`❌ [${requestId}] Error adding project member:`, error);
    return NextResponse.json(
      { error: "Failed to add project member" },
      { status: 500 }
    );
  }
}

// DELETE remove project member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const requestId = generateRequestId();
  
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const organizationId = searchParams.get("organizationId");

    console.log(`➖ [${requestId}] Removing member from project: ${projectId}`);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const result = await findProjectForMembers(projectId, organizationId || undefined);
    
    if (!result) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { project, database, source } = result;

    if (source === 'firebase') {
      // Handle Firebase project
      const projectData = project as any;

      // Don't allow removing the owner
      if (projectData.ownerId === userId) {
        return NextResponse.json(
          { error: "Cannot remove project owner" },
          { status: 400 }
        );
      }

      // Remove the member from the Firebase project
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ [${requestId}] Member removed from Firebase project successfully`);
      return NextResponse.json({ success: true });
      
    } else {
      // Handle MongoDB project
      if (!database) {
        throw new Error("Database connection failed for MongoDB project");
      }

      // Remove member from MongoDB project
      let updateResult;
      
      try {
        // Try as ObjectId first if it looks like one
        if (projectId.length === 24 && /^[0-9a-fA-F]{24}$/.test(projectId)) {
          updateResult = await database.collection("projects").updateOne(
            { _id: new ObjectId(projectId) },
            {
              $pull: { members: userId } as any,
              $set: { updatedAt: new Date() }
            }
          );
        } else {
          // For non-ObjectId format, use string directly (should not happen normally)
          updateResult = await database.collection("projects").updateOne(
            { _id: projectId as any },
            {
              $pull: { members: userId } as any,
              $set: { updatedAt: new Date() }
            }
          );
        }

        if (updateResult.matchedCount === 0) {
          return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        console.log(`✅ [${requestId}] Member removed from MongoDB project successfully`);
        return NextResponse.json({ success: true });
        
      } catch (mongoError) {
        console.error(`❌ [${requestId}] MongoDB remove error:`, mongoError);
        return NextResponse.json({ error: "Failed to update MongoDB project" }, { status: 500 });
      }
    }

  } catch (error) {
    console.error(`❌ [${requestId}] Error removing project member:`, error);
    return NextResponse.json(
      { error: "Failed to remove project member" },
      { status: 500 }
    );
  }
}
