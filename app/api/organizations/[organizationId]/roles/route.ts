import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;

    // Return mock roles data
    const mockRoles = [
      {
        id: "role-1",
        name: "Owner",
        rank: 1,
        permissions: {
          canInviteToOrg: true,
          canRemoveFromOrg: true,
          canManageOrgRoles: true,
          canEditOrgSettings: true,
          canCreateProjects: true,
          canDeleteProjects: true,
          canSeeAllProjects: true,
          canEditProjectSettings: true,
          canManageProjectMembers: true,
          canDeleteOrg: true,
          canTransferOwnership: true,
        },
        isSystemRole: true,
        createdAt: new Date(),
      },
      {
        id: "role-2",
        name: "Admin",
        rank: 2,
        permissions: {
          canInviteToOrg: true,
          canRemoveFromOrg: true,
          canManageOrgRoles: false,
          canEditOrgSettings: false,
          canCreateProjects: true,
          canDeleteProjects: true,
          canSeeAllProjects: true,
          canEditProjectSettings: true,
          canManageProjectMembers: true,
          canDeleteOrg: false,
          canTransferOwnership: false,
        },
        isSystemRole: true,
        createdAt: new Date(),
      },
      {
        id: "role-3",
        name: "Member",
        rank: 3,
        permissions: {
          canInviteToOrg: false,
          canRemoveFromOrg: false,
          canManageOrgRoles: false,
          canEditOrgSettings: false,
          canCreateProjects: false,
          canDeleteProjects: false,
          canSeeAllProjects: false,
          canEditProjectSettings: false,
          canManageProjectMembers: false,
          canDeleteOrg: false,
          canTransferOwnership: false,
        },
        isSystemRole: true,
        createdAt: new Date(),
      },
    ];

    return NextResponse.json(mockRoles);
  } catch (error) {
    console.error("Error fetching organization roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { name, rank, permissions } = await request.json();

    if (!name || rank === undefined) {
      return NextResponse.json(
        { error: "Name and rank are required" },
        { status: 400 }
      );
    }

    // Mock role creation
    const newRole = {
      id: `role-${Date.now()}`,
      organizationId,
      name,
      rank,
      permissions: permissions || {},
      isSystemRole: false,
      createdAt: new Date(),
    };

    return NextResponse.json(newRole);
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { customRoles } = await request.json();

    console.log(`Updating custom roles for organization: ${organizationId}`);

    const orgRef = doc(db, "organizations", organizationId);
    await updateDoc(orgRef, {
      customRoles: customRoles || [],
      updatedAt: serverTimestamp(),
    });

    console.log(`Custom roles updated successfully for ${organizationId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating custom roles:", error);
    return NextResponse.json(
      { error: "Failed to update custom roles" },
      { status: 500 }
    );
  }
}
