import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getOrganizationDatabaseConnection, getAdminDb } from "@/services/db/dynamicConnection";
import { ObjectId } from "mongodb";

// Helper function to find project in both Firebase and organization databases
async function findProject(projectId: string, retryCount = 0) {
  try {
    // First try Firebase
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();
      
      // If project has organizationId, try to fetch from organization database
      if (projectData.organizationId) {
        const orgDb = await getOrganizationDatabaseConnection(projectData.organizationId);
        
        if (orgDb) {
          // Look for project in organization database
          // If the project has customDbProjectId, use that, otherwise try to match by name/organizationId
          let orgProject = null;
          
          if (projectData.customDbProjectId) {
            orgProject = await orgDb.collection("projects").findOne({ 
              _id: new ObjectId(projectData.customDbProjectId)
            });
          }
          
          // Fallback: search by organizationId and name
          if (!orgProject) {
            orgProject = await orgDb.collection("projects").findOne({ 
              organizationId: projectData.organizationId,
              name: projectData.name
            });
          }
          
          if (orgProject) {
            return {
              project: {
                id: orgProject._id.toString(),
                ...orgProject,
                _id: undefined
              },
              source: 'organization',
              organizationId: projectData.organizationId
            };
          }
        }
      }
      
      // Return Firebase data if no organization database or not found there
      return {
        project: {
          id: projectSnap.id,
          ...projectData
        },
        source: 'firebase',
        organizationId: projectData.organizationId
      };
    }

    // If this is a retry attempt, don't retry again
    if (retryCount >= 2) {
      return null;
    }
    
    // For newly created projects, there might be a small delay
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 500));
    return findProject(projectId, retryCount + 1);
    
  } catch (error) {
    console.error("Error finding project:", error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    let result = await findProject(projectId);
    
    if (!result) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const { project } = result;
    
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
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await request.json();

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
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
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    await deleteDoc(projectRef);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
