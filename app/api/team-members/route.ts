import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!adminDb) {
      throw new Error("MongoDB not initialized");
    }

    // Get user's projects
    const projects = await adminDb
      .collection("projects")
      .find({ members: { $in: [userId] } })
      .toArray();

    // Get all unique members from all projects
    const memberIds = new Set<string>();
    projects.forEach((project) => {
      if (project.ownerId) memberIds.add(project.ownerId);
      if (project.members) {
        project.members.forEach((id: string) => memberIds.add(id));
      }
    });

    // Fetch user details for each member
    const membersData = [];
    for (const id of Array.from(memberIds)) {
      try {
        const userDoc = await adminDb.collection("users").findOne({ _id: new ObjectId(id) });
        if (userDoc) {
          const userData = userDoc;
          membersData.push({
            id: userDoc._id.toString(),
            name: userData?.displayName || "Unknown User",
            role: id === userId ? "Project Manager" : "Team Member",
            email: userData?.email || "",
            avatar: userData?.photoURL,
            initials: (userData?.displayName || "??")
              .split(" ")
              .map((part: string) => part[0])
              .join("")
              .toUpperCase()
              .substring(0, 2),
            status: "active",
            skills: userData?.skills || ["JavaScript", "React", "Next.js"],
          });
        }
      } catch (memberError) {
        console.error(`Error fetching data for member ${id}:`, memberError);
      }
    }

    return NextResponse.json(membersData);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 },
    );
  }
}
