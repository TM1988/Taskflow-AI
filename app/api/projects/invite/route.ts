// app/api/projects/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb, FieldValue } from "@/services/admin/firebaseAdmin";
import { adminAuth } from "@/services/admin/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { projectId, email, role } = await request.json();

    if (!projectId || !email) {
      return NextResponse.json(
        { error: "Project ID and email are required" },
        { status: 400 },
      );
    }

    // Verify project exists
    const projectDoc = await adminDb
      .collection("projects")
      .doc(projectId)
      .get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Find user by email
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      const userId = userRecord.uid;

      // Check if user is already a member
      const projectData = projectDoc.data();
      if (projectData?.members?.includes(userId)) {
        return NextResponse.json(
          { error: "User is already a member of this project" },
          { status: 400 },
        );
      }

      // Add user to project members
      const members = [...(projectData?.members || []), userId];
      await adminDb.collection("projects").doc(projectId).update({
        members,
        updatedAt: FieldValue.serverTimestamp(), // Fixed
      });

      // Create invitation record
      await adminDb.collection("invitations").add({
        projectId,
        projectName: projectData?.name,
        userId,
        email,
        role: role || "member",
        status: "accepted",
        createdAt: FieldValue.serverTimestamp(), // Fixed
      });

      return NextResponse.json({ success: true });
    } catch (userError: any) {
      // Fixed type
      // User doesn't exist - create invitation for later
      if (userError.code === "auth/user-not-found") {
        // Create pending invitation
        await adminDb.collection("invitations").add({
          projectId,
          projectName: projectDoc.data()?.name,
          email,
          role: role || "member",
          status: "pending",
          createdAt: FieldValue.serverTimestamp(), // Fixed
        });

        return NextResponse.json({
          success: true,
          status: "pending",
          message: "Invitation created for unregistered user",
        });
      } else {
        throw userError;
      }
    }
  } catch (error) {
    console.error("Error creating project invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}
