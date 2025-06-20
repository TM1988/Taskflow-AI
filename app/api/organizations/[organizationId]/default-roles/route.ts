import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { roleId, name, description, permissions } = await request.json();

    if (!roleId || roleId === 'owner') {
      return NextResponse.json(
        { error: "Invalid role ID or Owner role cannot be modified" },
        { status: 400 }
      );
    }

    // Get the organization document
    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();
    const currentDefaultRoles = orgData.defaultRoles || {};

    // Update the specific default role
    const updatedDefaultRoles = {
      ...currentDefaultRoles,
      [roleId]: {
        id: roleId,
        name,
        description,
        permissions: permissions || [],
        isDefault: true,
        updatedAt: new Date()
      }
    };

    // Update the organization document
    await updateDoc(orgRef, {
      defaultRoles: updatedDefaultRoles,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      role: updatedDefaultRoles[roleId]
    });

  } catch (error) {
    console.error("Error updating default role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { roleId } = await request.json();

    if (!roleId || roleId === 'owner') {
      return NextResponse.json(
        { error: "Invalid role ID or Owner role cannot be deleted" },
        { status: 400 }
      );
    }

    // Get the organization document
    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();
    const currentDefaultRoles = orgData.defaultRoles || {};

    // Remove the custom default role (reset to system default)
    const updatedDefaultRoles = { ...currentDefaultRoles };
    delete updatedDefaultRoles[roleId];

    // Update the organization document
    await updateDoc(orgRef, {
      defaultRoles: updatedDefaultRoles,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "Default role reset successfully"
    });

  } catch (error) {
    console.error("Error resetting default role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
