import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;

    // Get organization's database configuration from Firestore
    const orgDocRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgDocRef);
    
    if (!orgDoc.exists()) {
      return NextResponse.json({
        error: "Organization not found",
        organizationId
      }, { status: 404 });
    }

    const orgData = orgDoc.data();
    const settings = orgData.settings;
    
    const debugInfo = {
      organizationId,
      organizationName: orgData.name,
      hasSettings: !!settings,
      settings: settings || null,
      settingsKeys: settings ? Object.keys(settings) : [],
      useSelfHosting: settings?.useSelfHosting || false,
      mongoUrl: settings?.mongoUrl ? 'SET' : 'NOT SET',
      databaseName: settings?.databaseName || 'NOT SET',
      fullOrgData: orgData
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    return NextResponse.json({
      error: "Failed to check organization settings",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
