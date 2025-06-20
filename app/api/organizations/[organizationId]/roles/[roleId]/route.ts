import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; roleId: string } }
) {
  try {
    const { organizationId, roleId } = params;

    console.log(`Deleting role ${roleId} from organization ${organizationId}`);

    // Prevent deletion of the Owner role
    if (roleId === 'owner') {
      return NextResponse.json(
        { error: "Cannot delete the Owner role" },
        { status: 400 }
      );
    }

    // Get organization
    const orgRef = doc(db, "organizations", organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();
    
    // Define default roles that cannot be deleted
    const defaultRoles = ['owner', 'admin', 'member'];
    
    if (defaultRoles.includes(roleId)) {
      return NextResponse.json(
        { error: "Cannot delete default roles" },
        { status: 400 }
      );
    }
    
    // Check if custom role exists
    const customRoles = orgData.customRoles || [];
    const roleExists = customRoles.some((role: any) => role.id === roleId);
    
    if (!roleExists) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Remove the role from custom roles
    const updatedCustomRoles = customRoles.filter((role: any) => role.id !== roleId);
    
    // Reset any members who had this role to 'member' role
    const updatedMemberRoles = { ...orgData.memberRoles };
    Object.keys(updatedMemberRoles).forEach(memberId => {
      if (updatedMemberRoles[memberId] === roleId) {
        updatedMemberRoles[memberId] = 'member';
      }
    });

    await updateDoc(orgRef, {
      customRoles: updatedCustomRoles,
      memberRoles: updatedMemberRoles,
      updatedAt: serverTimestamp(),
    });

    console.log(`Role ${roleId} deleted successfully from organization ${organizationId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
