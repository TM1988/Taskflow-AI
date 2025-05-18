// app/api/ai/task-suggestions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleAiService } from "@/services/ai/googleAiService";
import { adminDb } from "@/services/admin/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { tasks, prompt, userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: "Tasks array is required" },
        { status: 400 },
      );
    }

    // Get user's API key from Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();

    if (!userData?.aiConfig?.apiKey || !userData?.aiConfig?.isEnabled) {
      return NextResponse.json(
        { error: "AI features are not enabled or configured for this user" },
        { status: 403 },
      );
    }

    // Initialize Google AI service with user's API key
    const aiService = new GoogleAiService(userData.aiConfig.apiKey);

    // Generate suggestions
    const suggestions = await aiService.generateTaskSuggestions(
      tasks,
      prompt || "Analyze these tasks and provide prioritization suggestions",
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI suggestions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
