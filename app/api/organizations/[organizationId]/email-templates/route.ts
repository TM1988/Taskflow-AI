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
    const { welcome, taskNotification, dueReminder } = body;

    // Update organization with email templates
    await updateDoc(orgRef, {
      emailTemplates: {
        welcome: welcome || "",
        taskNotification: taskNotification || "",
        dueReminder: dueReminder || "",
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Email templates saved successfully" 
    });
  } catch (error) {
    console.error("Error saving email templates:", error);
    return NextResponse.json(
      { error: "Failed to save email templates" },
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
    const emailTemplates = orgData?.emailTemplates || {
      welcome: "",
      taskNotification: "",
      dueReminder: ""
    };

    return NextResponse.json({ emailTemplates });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}
