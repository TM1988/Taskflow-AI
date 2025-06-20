import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { DEFAULT_ONBOARDING_STEPS } from "@/types/onboarding";

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { stepId } = await request.json();
    const { mongoDb } = await getMongoDb();

    console.log(`🎯 API: Removing step ${stepId} from completed steps for user ${userId}`);

    const updatedProgress = await mongoDb
      .collection("onboarding_progress")
      .findOneAndUpdate(
        { userId },
        {
          $pull: { completedSteps: stepId },
          $set: { 
            updatedAt: new Date(),
            lastActiveStep: stepId
          },
          $setOnInsert: {
            startedAt: new Date(),
            skippedSteps: []
          }
        },
        {
          upsert: true,
          returnDocument: "after"
        }
      );

    if (!updatedProgress) {
      throw new Error("Failed to update onboarding progress");
    }

    // Calculate the final progress with proper structure
    const completedStepsCount = updatedProgress.completedSteps ? updatedProgress.completedSteps.length : 0;
    const totalSteps = DEFAULT_ONBOARDING_STEPS.length;
    const progressPercentage = (completedStepsCount / totalSteps) * 100;
    const isCompleted = completedStepsCount === totalSteps;
    
    // Find next incomplete step
    const nextIncompleteStep = DEFAULT_ONBOARDING_STEPS.find(step => 
      !updatedProgress.completedSteps?.includes(step.id) && 
      !updatedProgress.skippedSteps?.includes(step.id)
    );
    
    const responseData = {
      ...updatedProgress,
      steps: DEFAULT_ONBOARDING_STEPS,
      totalSteps,
      completedStepsCount,
      progressPercentage,
      completed: isCompleted,
      currentStep: nextIncompleteStep ? nextIncompleteStep.id : updatedProgress.currentStep,
      estimatedTimeRemaining: (totalSteps - completedStepsCount) * 3,
      completedAt: isCompleted ? updatedProgress.completedAt : undefined
    };

    // Remove completed status if we're no longer completed
    if (!isCompleted && updatedProgress.completedAt) {
      await mongoDb
        .collection("onboarding_progress")
        .updateOne(
          { userId },
          { 
            $set: { completed: false },
            $unset: { completedAt: "" }
          }
        );
      responseData.completedAt = undefined;
      responseData.completed = false;
    }

    console.log(`✅ API: Step ${stepId} uncompleted. Progress:`, {
      completedStepsCount,
      totalSteps,
      progressPercentage: progressPercentage.toFixed(1) + '%'
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error uncompleting onboarding step:", error);
    return NextResponse.json(
      { error: "Failed to uncomplete onboarding step" },
      { status: 500 }
    );
  }
}
