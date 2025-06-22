import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    
    console.log(`Recovering organization: ${organizationId}`);

    const { mongoDb } = await getMongoDb();

    // Find the deleted organization
    const deletedOrg = await mongoDb
      .collection("organizations")
      .findOne({ 
        _id: new ObjectId(organizationId), 
        deleted: true 
      });

    if (!deletedOrg) {
      return NextResponse.json(
        { error: "Organization not found or not deleted" },
        { status: 404 }
      );
    }

    // Check if recovery window is still valid (24 hours)
    const deletedAt = new Date(deletedOrg.deletedAt);
    const now = new Date();
    const hoursSinceDeleted = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceDeleted > 24) {
      return NextResponse.json(
        { error: "Recovery window has expired (24 hours)" },
        { status: 400 }
      );
    }

    // Restore organization by removing deleted flag
    const result = await mongoDb
      .collection("organizations")
      .updateOne(
        { _id: new ObjectId(organizationId) },
        { 
          $unset: { 
            deleted: "",
            deletedAt: "",
            deletedBy: ""
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

    if (result.modifiedCount === 0) {
      throw new Error("Failed to recover organization");
    }

    console.log(`Organization ${organizationId} recovered successfully`);
    
    return NextResponse.json({ 
      success: true,
      message: "Organization recovered successfully"
    });

  } catch (error) {
    console.error("Error recovering organization:", error);
    return NextResponse.json(
      { error: "Failed to recover organization" },
      { status: 500 }
    );
  }
}
