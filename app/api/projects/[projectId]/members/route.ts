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

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    // Get project to access member list
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const projectData = projectSnap.data();
    const memberIds = projectData.members || [projectData.ownerId];

    // Fetch member details
    const membersWithDetails = await Promise.all(
      memberIds.map(async (memberId: string) => {
        try {
          const userRef = doc(db, "users", memberId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            return {
              id: memberId,
              name: userData.displayName || userData.name || "Unknown User",
              email: userData.email || "",
              photoURL: userData.photoURL || "",
              role: memberId === projectData.ownerId ? "owner" : "member",
            };
          } else {
            return {
              id: memberId,
              name: "Unknown User",
              email: "",
              photoURL: "",
              role: memberId === projectData.ownerId ? "owner" : "member",
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

    return NextResponse.json(membersWithDetails);

  } catch (error) {
    console.error("Error fetching project members:", error);
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
  try {
    const { projectId } = params;
    const body = await request.json();
    const { userId, email, role = "member" } = body;

    console.log(`Adding member to project ${projectId}:`, { userId, email, role });

    // Check if project exists
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const projectData = projectSnap.data();
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

    // Add the member to the project
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

    console.log(`Successfully added member to project ${projectId}:`, newMember);

    return NextResponse.json(newMember);

  } catch (error) {
    console.error("Error adding project member:", error);
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
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if project exists
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const projectData = projectSnap.data();

    // Don't allow removing the owner
    if (projectData.ownerId === userId) {
      return NextResponse.json(
        { error: "Cannot remove project owner" },
        { status: 400 }
      );
    }

    // Remove the member from the project
    await updateDoc(projectRef, {
      members: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { error: "Failed to remove project member" },
      { status: 500 }
    );
  }
}
