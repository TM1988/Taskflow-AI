export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  completed: boolean;
  required: boolean;
  order: number;
  estimatedTime?: string; // e.g., "2-3 mins"
  category: OnboardingCategory;
  actionText?: string; // Text for action button
  icon?: any; // Lucide icon component
}

export type OnboardingCategory = 
  | 'profile'
  | 'organization'
  | 'projects'
  | 'collaboration'
  | 'preferences'
  | 'database';

export interface OnboardingProgress {
  userId: string;
  currentStep: string;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  completed: boolean;
  steps: OnboardingStep[];
  totalSteps: number;
  completedStepsCount: number;
  progressPercentage: number;
  estimatedTimeRemaining: number;
}

export interface OnboardingData {
  profile: {
    name?: string;
    avatar?: string;
    bio?: string;
    role?: string;
    department?: string;
  };
  organization: {
    createNew?: boolean;
    organizationName?: string;
    organizationDescription?: string;
    joinExisting?: boolean;
    inviteCode?: string;
  };
  projects: {
    createSample?: boolean;
    importExisting?: boolean;
    projectTemplate?: string;
  };
  collaboration: {
    inviteTeamMembers?: boolean;
    teamMemberEmails?: string[];
    enableNotifications?: boolean;
  };
  preferences: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
  };
  database: {
    useOfficialMongoDB?: boolean;
    useCustomMongoDB?: boolean;
    connectionString?: string;
    databaseName?: string;
    performanceWarningAcknowledged?: boolean;
  };
}

export interface OnboardingStepConfig {
  steps: OnboardingStep[];
  canSkip: boolean;
  showProgress: boolean;
  autoSave: boolean;
  exitUrl: string;
}

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'setup-profile',
    title: 'Complete Your Profile',
    description: 'Add your name, photo, and basic information to personalize your account',
    component: 'ProfileStep',
    completed: false,
    required: false,
    order: 1,
    estimatedTime: '2-3 mins',
    category: 'profile',
    actionText: 'Go to Settings'
  },
  {
    id: 'configure-database',
    title: 'Configure Database',
    description: 'Choose between our official MongoDB service or connect your own database instance',
    component: 'DatabaseStep',
    completed: false,
    required: false,
    order: 2,
    estimatedTime: '2-5 mins',
    category: 'database',
    actionText: 'Configure Database'
  },
  {
    id: 'connect-github',
    title: 'Connect GitHub Account',
    description: 'Link your GitHub account to sync repositories and enable smart suggestions',
    component: 'GitHubStep',
    completed: false,
    required: false,
    order: 3,
    estimatedTime: '1-2 mins',
    category: 'profile',
    actionText: 'Connect GitHub'
  },
  {
    id: 'enable-ai-suggestions',
    title: 'Enable AI Suggestions',
    description: 'Configure AI-powered recommendations to enhance your productivity',
    component: 'AIStep',
    completed: false,
    required: false,
    order: 4,
    estimatedTime: '1-2 mins',
    category: 'preferences',
    actionText: 'Enable AI'
  },
  {
    id: 'create-organization',
    title: 'Create or Join an Organization',
    description: 'Organizations help you collaborate with teams and manage multiple projects',
    component: 'OrganizationStep',
    completed: false,
    required: false,
    order: 5,
    estimatedTime: '3-5 mins',
    category: 'organization',
    actionText: 'Create or Join Organization'
  }
];
