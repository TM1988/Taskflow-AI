import { 
  OnboardingStep, 
  OnboardingProgress, 
  OnboardingData,
  DEFAULT_ONBOARDING_STEPS 
} from '../../types/onboarding';

class OnboardingService {
  private static instance: OnboardingService;

  static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  /**
   * Get onboarding progress for user (manual completion only)
   */
  async getProgress(userId: string): Promise<OnboardingProgress> {
    try {
      console.log(`📊 Getting onboarding progress for user: ${userId}`);
      const response = await fetch(`/api/users/${userId}/onboarding`);
      if (!response.ok) {
        console.log("📊 No existing progress found, returning initial state");
        // Return initial progress if none exists
        const totalSteps = DEFAULT_ONBOARDING_STEPS.length;
        return {
          userId,
          currentStep: DEFAULT_ONBOARDING_STEPS[0].id,
          completedSteps: [],
          skippedSteps: [],
          startedAt: new Date(),
          completed: false,
          steps: DEFAULT_ONBOARDING_STEPS,
          totalSteps,
          completedStepsCount: 0,
          progressPercentage: 0,
          estimatedTimeRemaining: totalSteps * 3
        };
      }

      const progress = await response.json();
      console.log(`📊 Progress retrieved:`, {
        completedSteps: progress.completedSteps,
        completedStepsCount: progress.completedStepsCount,
        progressPercentage: progress.progressPercentage
      });
      
      return {
        ...progress,
        startedAt: new Date(progress.startedAt),
        completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined,
        steps: progress.steps || DEFAULT_ONBOARDING_STEPS
      };
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Update onboarding progress
   */
  async updateOnboardingProgress(
    userId: string,
    updates: Partial<OnboardingProgress>
  ): Promise<OnboardingProgress> {
    try {
      const response = await fetch(`/api/users/${userId}/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update onboarding progress');
      }

      const progress = await response.json();
      return {
        ...progress,
        startedAt: new Date(progress.startedAt),
        completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined
      };
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Mark step as completed (simple version without validation)
   */
  async completeStep(userId: string, stepId: string): Promise<OnboardingProgress> {
    try {
      console.log(`🎯 onboardingService.completeStep: Marking ${stepId} as completed for user ${userId}`);
      
      // Directly call the API endpoint that handles step completion
      const response = await fetch(`/api/users/${userId}/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId })
      });

      if (!response.ok) {
        throw new Error('Failed to complete step');
      }

      const result = await response.json();
      console.log(`✅ onboardingService.completeStep: Step ${stepId} completed successfully`, result);
      return result;
    } catch (error) {
      console.error('Error completing step:', error);
      throw error;
    }
  }

  /**
   * Skip step
   */
  async skipStep(userId: string, stepId: string): Promise<OnboardingProgress> {
    try {
      const currentProgress = await this.getProgress(userId);
      const updatedSkippedSteps = [...currentProgress.skippedSteps];
      
      if (!updatedSkippedSteps.includes(stepId)) {
        updatedSkippedSteps.push(stepId);
      }

      // Find next step
      const currentStepIndex = DEFAULT_ONBOARDING_STEPS.findIndex(step => step.id === stepId);
      const nextStep = currentStepIndex < DEFAULT_ONBOARDING_STEPS.length - 1 
        ? DEFAULT_ONBOARDING_STEPS[currentStepIndex + 1].id 
        : stepId;

      return await this.updateOnboardingProgress(userId, {
        skippedSteps: updatedSkippedSteps,
        currentStep: nextStep
      });
    } catch (error) {
      console.error('Error skipping step:', error);
      throw error;
    }
  }

  /**
   * Get onboarding data
   */
  async getOnboardingData(userId: string): Promise<OnboardingData> {
    try {
      const response = await fetch(`/api/users/${userId}/onboarding/data`);
      if (!response.ok) {
        return {
          profile: {},
          organization: {},
          projects: {},
          collaboration: {},
          preferences: {},
          database: {}
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
      return {
        profile: {},
        organization: {},
        projects: {},
        collaboration: {},
        preferences: {},
        database: {}
      };
    }
  }

  /**
   * Save onboarding data
   */
  async saveOnboardingData(
    userId: string,
    data: Partial<OnboardingData>
  ): Promise<OnboardingData> {
    try {
      const response = await fetch(`/api/users/${userId}/onboarding/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to save onboarding data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      throw error;
    }
  }

  /**
   * Reset onboarding for user
   */
  async resetOnboarding(userId: string): Promise<OnboardingProgress> {
    try {
      const response = await fetch(`/api/users/${userId}/onboarding/reset`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to reset onboarding');
      }

      const progress = await response.json();
      return {
        ...progress,
        startedAt: new Date(progress.startedAt),
        completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined
      };
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  }

  /**
   * Check if user needs onboarding (only show once, unless manually reset)
   */
  async needsOnboarding(userId: string): Promise<boolean> {
    try {
      console.log(`🔍 needsOnboarding: Checking for user ${userId}`);
      const progress = await this.getProgress(userId);
      
      // Only show onboarding if the user has NEVER completed it
      // If completedAt exists, they have finished onboarding at least once
      const hasEverCompleted = progress.completedAt !== undefined;
      const shouldShow = !hasEverCompleted;
      
      console.log(`🔍 needsOnboarding result:`, {
        userId,
        hasEverCompleted,
        completedAt: progress.completedAt,
        shouldShow
      });
      
      return shouldShow;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false; // Default to NOT showing onboarding if unsure (less intrusive)
    }
  }

  /**
   * Get next required step
   */
  getNextRequiredStep(progress: OnboardingProgress): OnboardingStep | null {
    const requiredSteps = DEFAULT_ONBOARDING_STEPS.filter(step => step.required);
    const completedRequiredSteps = requiredSteps.filter(step => 
      progress.completedSteps.includes(step.id)
    );

    if (completedRequiredSteps.length === requiredSteps.length) {
      return null; // All required steps completed
    }

    return requiredSteps.find(step => 
      !progress.completedSteps.includes(step.id) && 
      !progress.skippedSteps.includes(step.id)
    ) || null;
  }

  /**
   * Get estimated time remaining
   */
  getEstimatedTimeRemaining(progress: OnboardingProgress): number {
    const remainingSteps = DEFAULT_ONBOARDING_STEPS.filter(step => 
      !progress.completedSteps.includes(step.id) && 
      !progress.skippedSteps.includes(step.id)
    );

    // Since estimatedTime is now a string, return a simple count
    return remainingSteps.length * 3; // Estimate 3 minutes per step
  }

  /**
   * Get onboarding steps configuration
   */
  getOnboardingSteps(): OnboardingStep[] {
    return [...DEFAULT_ONBOARDING_STEPS];
  }

  /**
   * Validate step data
   */
  validateStepData(stepId: string, data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (stepId) {
      case 'profile':
        if (!data.name?.trim()) {
          errors.push('Name is required');
        }
        break;
      
      case 'organization':
        if (data.createNew && !data.organizationName?.trim()) {
          errors.push('Organization name is required');
        }
        if (data.joinExisting && !data.inviteCode?.trim()) {
          errors.push('Invite code is required');
        }
        break;
      
      case 'invite_team':
        if (data.inviteTeamMembers && data.teamMemberEmails?.length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          data.teamMemberEmails.forEach((email: string) => {
            if (!emailRegex.test(email)) {
              errors.push(`Invalid email: ${email}`);
            }
          });
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Skip onboarding for user
   */
  async skipOnboarding(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/users/${userId}/onboarding`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      return false;
    }
  }

  /**
   * Mark step as completed (alias for better API)
   */
  async markStepCompleted(userId: string, stepId: string): Promise<OnboardingProgress> {
    return this.completeStep(userId, stepId);
  }

  /**
   * Mark step as uncompleted (remove from completed steps)
   */
  async uncompleteStep(userId: string, stepId: string): Promise<OnboardingProgress> {
    try {
      console.log(`🎯 onboardingService.uncompleteStep: Unmarking ${stepId} as completed for user ${userId}`);
      
      // Call the API endpoint that handles step removal
      const response = await fetch(`/api/users/${userId}/onboarding/uncomplete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId })
      });

      if (!response.ok) {
        throw new Error('Failed to uncomplete step');
      }

      const result = await response.json();
      console.log(`✅ onboardingService.uncompleteStep: Step ${stepId} uncompleted successfully`, result);
      return result;
    } catch (error) {
      console.error('Error uncompleting step:', error);
      throw error;
    }
  }
}

export const onboardingService = OnboardingService.getInstance();
