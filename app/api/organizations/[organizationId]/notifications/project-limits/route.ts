import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    const notifications = orgData.projectLimitNotifications || {
      enabled: true,
      thresholds: [80, 95], // Notify at 80% and 95% of limit
      lastNotified: null
    };

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching project limit notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch project limit notifications" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const settings = await request.json();

    const orgRef = doc(db, "organizations", params.organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    await updateDoc(orgRef, {
      projectLimitNotifications: {
        enabled: settings.enabled || true,
        thresholds: settings.thresholds || [80, 95],
        lastNotified: settings.lastNotified || null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating project limit notifications:", error);
    return NextResponse.json(
      { error: "Failed to update project limit notifications" },
      { status: 500 }
    );
  }
}
