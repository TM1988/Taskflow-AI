import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { ObjectId } from "mongodb";
import { DEFAULT_EMAIL_SETTINGS } from "@/types/email-notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { mongoDb } = await getMongoDb();

    const settings = await mongoDb
      .collection("email_settings")
      .findOne({ userId });

    if (!settings) {
      return NextResponse.json({
        ...DEFAULT_EMAIL_SETTINGS,
        userId
      });
    }

    return NextResponse.json({
      userId: settings.userId,
      organizationInvites: settings.organizationInvites || DEFAULT_EMAIL_SETTINGS.organizationInvites,
      inAppOnly: settings.inAppOnly !== false // Default to true
    });
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch email settings" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const updates = await request.json();
    const { mongoDb } = await getMongoDb();

    const updatedSettings = await mongoDb
      .collection("email_settings")
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            ...updates,
            userId,
            updatedAt: new Date()
          }
        },
        {
          upsert: true,
          returnDocument: "after"
        }
      );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating email settings:", error);
    return NextResponse.json(
      { error: "Failed to update email settings" },
      { status: 500 }
    );
  }
}
