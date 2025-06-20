import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const orgRef = doc(db, "organizations", params.organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const { taskAssignments, dueReminders, projectUpdates, weeklyDigest } = body;

    // Update organization with notification settings
    await updateDoc(orgRef, {
      notificationSettings: {
        taskAssignments: !!taskAssignments,
        dueReminders: !!dueReminders,
        projectUpdates: !!projectUpdates,
        weeklyDigest: !!weeklyDigest,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Notification settings saved successfully" 
    });
  } catch (error) {
    console.error("Error saving notification settings:", error);
    return NextResponse.json(
      { error: "Failed to save notification settings" },
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
    const notificationSettings = orgData?.notificationSettings || {
      taskAssignments: true,
      dueReminders: true,
      projectUpdates: false,
      weeklyDigest: false
    };

    return NextResponse.json({ notificationSettings });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}
