import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get organization's database configuration from Firestore
    const orgDocRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgDocRef);
    
    if (!orgDoc.exists()) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgData = orgDoc.data();
    const settings = orgData.settings;
    
    let useCustomDB = false;
    let databaseName = 'Official';
    
    if (settings && settings.useSelfHosting && settings.database) {
      useCustomDB = true;
      databaseName = settings.database.databaseName || 'Custom';
    }

    return NextResponse.json({
      useCustomDB,
      databaseName,
      organizationId
    });

  } catch (error) {
    console.error("Error fetching organization database config:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization database configuration" },
      { status: 500 }
    );
  }
}
