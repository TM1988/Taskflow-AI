// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;

    const { mongoDb } = await getMongoDb();

    const userDoc = await mongoDb
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Filter out sensitive information
    const safeUserData = {
      id: userDoc._id.toString(),
      displayName: userDoc.displayName,
      email: userDoc.email,
      photoURL: userDoc.photoURL,
      createdAt: userDoc.createdAt,
    };

    return NextResponse.json(safeUserData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
