import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/services/singleton";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const projectId = params.id;
    const { userId, role = "member" } = await request.json();

    const { mongoDb } = await getMongoDb(); // Added await here

    const projectDoc = await mongoDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });

    if (!projectDoc) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Add member to project
    const updateResult = await mongoDb
      .collection("projects")
      .updateOne(
        { _id: new ObjectId(projectId) },
        {
          $addToSet: {
            members: {
              userId,
              role,
              addedAt: new Date()
            }
          }
        }
      );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Member added successfully",
      userId,
      role 
    });
  } catch (error) {
    console.error("Error adding project member:", error);
    return NextResponse.json(
      { error: "Failed to add project member" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const { mongoDb } = await getMongoDb();

    const projectDoc = await mongoDb
      .collection("projects")
      .findOne({ _id: new ObjectId(projectId) });

    if (!projectDoc) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Return project members
    return NextResponse.json({
      members: projectDoc.members || [],
      owner: projectDoc.ownerId
    });
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}
