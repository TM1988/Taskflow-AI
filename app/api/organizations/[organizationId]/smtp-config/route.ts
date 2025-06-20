import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // For now, we'll skip auth verification and assume the request is valid
    // In production, you should verify the user's authentication and ownership
    
    const orgRef = doc(db, "organizations", params.organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const { host, port, username, password, useTLS } = body;

    if (!host || !username) {
      return NextResponse.json({ error: "Host and username are required" }, { status: 400 });
    }

    // Update organization with SMTP configuration
    await updateDoc(orgRef, {
      smtpConfig: {
        host,
        port: parseInt(port) || 587,
        username,
        password, // In production, consider encrypting this
        useTLS: !!useTLS,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "SMTP configuration saved successfully" 
    });
  } catch (error) {
    console.error("Error saving SMTP config:", error);
    return NextResponse.json(
      { error: "Failed to save SMTP configuration" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const orgRef = doc(db, "organizations", params.organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const orgData = orgSnap.data();
    const smtpConfig = orgData?.smtpConfig || {};
    
    // Don't return the password for security
    const { password, ...safeConfig } = smtpConfig;

    return NextResponse.json({ smtpConfig: safeConfig });
  } catch (error) {
    console.error("Error fetching SMTP config:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMTP configuration" },
      { status: 500 }
    );
  }
}
