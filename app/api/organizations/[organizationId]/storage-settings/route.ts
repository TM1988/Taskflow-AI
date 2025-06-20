import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { useSelfHosting, mongoUrl, databaseName } = await request.json();
    const { organizationId } = params;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    if (typeof useSelfHosting !== "boolean") {
      return NextResponse.json(
        { error: "useSelfHosting must be a boolean value" },
        { status: 400 }
      );
    }

    console.log(`Updating storage settings for organization ${organizationId}: useSelfHosting=${useSelfHosting}`);

    // Get the organization document
    const orgRef = doc(db, "organizations", organizationId);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      "settings.useSelfHosting": useSelfHosting,
      updatedAt: new Date(),
    };

    // If enabling self-hosting, store the MongoDB connection details
    if (useSelfHosting && mongoUrl && databaseName) {
      updateData["settings.mongoUrl"] = mongoUrl;
      updateData["settings.databaseName"] = databaseName;
    }
    // If disabling self-hosting, clear the MongoDB connection details
    else if (!useSelfHosting) {
      updateData["settings.mongoUrl"] = null;
      updateData["settings.databaseName"] = null;
    }

    // Update the organization settings
    await updateDoc(orgRef, updateData);

    // Get the updated document
    const updatedDoc = await getDoc(orgRef);
    const updatedData = updatedDoc.data();

    const result = {
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || updatedData?.updatedAt,
    };

    console.log(`Storage settings updated successfully for organization ${organizationId}`);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error updating storage settings:", error);
    return NextResponse.json(
      { error: "Failed to update storage settings" },
      { status: 500 }
    );
  }
}
