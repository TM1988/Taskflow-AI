import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getOrganizationDatabaseConnection,
  getAdminDb,
} from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";

// Helper function to find project - FIREBASE FIRST (consistent with members API)
async function findProject(projectId: string, organizationId?: string) {
  console.log(
    `🔍 Finding project: ${projectId} with organizationId: ${organizationId}`,
  );

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
        source: "firebase",
        organizationId: projectData.organizationId,
      };
    }
  } catch (firebaseError) {
    console.error("Error checking Firebase:", firebaseError);
  }

  // Only try MongoDB if Firebase fails AND it's a MongoDB ObjectId
  console.log(
    `🍃 Firebase not found, checking MongoDB databases for project: ${projectId}`,
  );

  // Check if this looks like a MongoDB ObjectId (24 chars, hex)
  const isMongoId =
    projectId.length === 24 && /^[0-9a-fA-F]{24}$/.test(projectId);

  if (isMongoId) {
    // Try organization database first if provided
    if (organizationId) {
      try {
        const orgDb = await getOrganizationDatabaseConnection(organizationId);
        if (orgDb) {
          const orgProject = await orgDb.collection("projects").findOne({
            _id: new ObjectId(projectId),
          });

          if (orgProject) {
            console.log(
              `✅ Found project in organization DB: ${orgProject.name}`,
            );
            return {
              project: {
                id: orgProject._id.toString(),
                ...orgProject,
                _id: undefined,
              },
              source: "organization",
              organizationId,
            };
          }
        }
      } catch (orgError) {
        console.error("Error checking organization database:", orgError);
      }
    }

    // Fallback to admin database for MongoDB projects
    try {
      const adminDb = await getAdminDb();
      const adminProject = await adminDb.collection("projects").findOne({
        _id: new ObjectId(projectId),
      });

      if (adminProject) {
        console.log(`✅ Found project in admin DB: ${adminProject.name}`);
        return {
          project: {
            id: adminProject._id.toString(),
            ...adminProject,
            _id: undefined,
          },
          source: "admin",
          organizationId: adminProject.organizationId,
        };
      }
    } catch (adminError) {
      console.error("Error checking admin database:", adminError);
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    console.log(
      `🔍 [GET Project] ProjectId: ${projectId}, OrgId: ${organizationId}`,
    );

    let result = await findProject(projectId, organizationId || undefined);

    if (!result) {
      console.log(`❌ [GET Project] Project not found: ${projectId}`);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { project } = result;
    console.log(
      `✅ [GET Project] Found project: ${(project as any).name || "Unknown"} from ${result.source}`,
    );

    // Get owner information
    let ownerName = "Unknown";
    let ownerEmail = "";
    let ownerPhotoURL = "";

    if ((project as any).ownerId) {
      try {
        const ownerRef = doc(db, "users", (project as any).ownerId);
        const ownerSnap = await getDoc(ownerRef);
        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();
          ownerName = ownerData.displayName || ownerData.name || "Unknown";
          ownerEmail = ownerData.email || "";
          ownerPhotoURL = ownerData.photoURL || "";
        }
      } catch (error) {
        console.error("Error fetching owner data:", error);
      }
    }

    const enrichedProjectData = {
      ...project,
      ownerName,
      ownerEmail,
      ownerPhotoURL,
    };

    return NextResponse.json(enrichedProjectData);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const body = await request.json();

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await updateDoc(projectRef, {
      ...body,
      updatedAt: serverTimestamp(),
    });

    const updatedProject = {
      id: projectId,
      ...projectSnap.data(),
      ...body,
      updatedAt: new Date(),
    };

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await deleteDoc(projectRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
