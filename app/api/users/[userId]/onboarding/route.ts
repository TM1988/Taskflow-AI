import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/services/singleton";
import { DEFAULT_ONBOARDING_STEPS } from "@/types/onboarding";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    console.log(`🔍 API GET /api/users/${userId}/onboarding: Fetching progress`);
    const { mongoDb } = await getMongoDb();

    const progress = await mongoDb
      .collection("onboarding_progress")
      .findOne({ userId }) as any;

    console.log(`🔍 API: Found progress in DB:`, {
      exists: !!progress,
      completedSteps: progress?.completedSteps || [],
      completedAt: progress?.completedAt || null,
      completed: progress?.completed || false
    });

    if (!progress) {
      // Return initial progress
      console.log(`🔍 API: No progress found, returning initial state`);
      return NextResponse.json({
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
      });
    }

    // Add completed status to steps
    const stepsWithStatus = DEFAULT_ONBOARDING_STEPS.map(step => ({
      ...step,
      completed: progress.completedSteps.includes(step.id)
    }));

    const responseData = {
      ...progress,
      steps: stepsWithStatus,
      completed: progress.completedSteps.length === DEFAULT_ONBOARDING_STEPS.length,
      totalSteps: DEFAULT_ONBOARDING_STEPS.length,
      completedStepsCount: progress.completedSteps.length,
      progressPercentage: (progress.completedSteps.length / DEFAULT_ONBOARDING_STEPS.length) * 100,
      estimatedTimeRemaining: (DEFAULT_ONBOARDING_STEPS.length - progress.completedSteps.length) * 3
    };

    console.log(`🔍 API: Returning progress:`, {
      completedStepsCount: responseData.completedStepsCount,
      totalSteps: responseData.totalSteps,
      completed: responseData.completed,
      completedAt: responseData.completedAt
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding progress" },
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
    const body = await request.json();
    const { stepId } = body;
    
    if (!stepId) {
      return NextResponse.json(
        { error: "stepId is required" },
        { status: 400 }
      );
    }

    const { mongoDb } = await getMongoDb();

    console.log(`🎯 API: Marking step ${stepId} as completed for user ${userId}`);

    // Check if step is already completed to prevent duplicate updates
    const existingProgress = await mongoDb
      .collection("onboarding_progress")
      .findOne({ userId });

    if (existingProgress?.completedSteps?.includes(stepId)) {
      console.log(`🎯 API: Step ${stepId} already completed, returning existing progress`);
      
      const completedStepsCount = existingProgress.completedSteps.length;
      const totalSteps = DEFAULT_ONBOARDING_STEPS.length;
      const progressPercentage = (completedStepsCount / totalSteps) * 100;
      const isCompleted = completedStepsCount === totalSteps;
      
      return NextResponse.json({
        ...existingProgress,
        steps: DEFAULT_ONBOARDING_STEPS,
        totalSteps,
        completedStepsCount,
        progressPercentage,
        completed: isCompleted,
        estimatedTimeRemaining: (totalSteps - completedStepsCount) * 3
      });
    }

    const updatedProgress = await mongoDb
      .collection("onboarding_progress")
      .findOneAndUpdate(
        { userId },
        {
          $addToSet: { completedSteps: stepId },
          $set: { 
            userId,
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
    
    console.log(`🎯 API: Step completion status:`, {
      stepId,
      completedStepsCount,
      totalSteps,
      isCompleted,
      existingCompletedAt: updatedProgress.completedAt
    });
    
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
      completedAt: updatedProgress.completedAt
    };

    if (isCompleted && !updatedProgress.completedAt) {
      console.log(`🎉 API: All steps completed! Setting completedAt timestamp`);
      responseData.completedAt = new Date();
      await mongoDb
        .collection("onboarding_progress")
        .updateOne(
          { userId },
          { $set: { completed: true, completedAt: new Date() } }
        );
      console.log(`🎉 API: completedAt timestamp saved to database`);
    }

    console.log(`✅ API: Step ${stepId} completed. Progress:`, {
      completedStepsCount,
      totalSteps,
      progressPercentage: progressPercentage.toFixed(1) + '%'
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding progress" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { mongoDb } = await getMongoDb();

    await mongoDb
      .collection("onboarding_progress")
      .updateOne(
        { userId },
        {
          $set: {
            skipped: true,
            skippedAt: new Date(),
            completed: true,
            completedAt: new Date()
          }
        },
        { upsert: true }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error skipping onboarding:", error);
    return NextResponse.json(
      { error: "Failed to skip onboarding" },
      { status: 500 }
    );
  }
}
