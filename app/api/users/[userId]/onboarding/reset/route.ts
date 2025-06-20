import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { DEFAULT_ONBOARDING_STEPS } from "@/types/onboarding";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { mongoDb } = await getMongoDb();

    // Delete the existing onboarding progress document
    await mongoDb
      .collection("onboarding_progress")
      .deleteOne({ userId });

    // Return fresh initial progress
    const initialProgress = {
      userId,
      currentStep: DEFAULT_ONBOARDING_STEPS[0].id,
      completedSteps: [],
      skippedSteps: [],
      startedAt: new Date(),
      completed: false,
      steps: DEFAULT_ONBOARDING_STEPS,
      totalSteps: DEFAULT_ONBOARDING_STEPS.length,
      completedStepsCount: 0,
      progressPercentage: 0,
      estimatedTimeRemaining: DEFAULT_ONBOARDING_STEPS.length * 3
    };

    console.log(`🔄 Reset onboarding for user ${userId}:`, initialProgress);

    return NextResponse.json(initialProgress);
  } catch (error) {
    console.error("Error resetting onboarding:", error);
    return NextResponse.json(
      { error: "Failed to reset onboarding" },
      { status: 500 }
    );
  }
}
