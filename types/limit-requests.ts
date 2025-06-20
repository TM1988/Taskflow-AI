export interface LimitIncreaseRequest {
  id: string;
  userId: string;
  userEmail: string;
  organizationId?: string;
  limitType: LimitType;
  currentLimit: number;
  requestedLimit: number;
  businessJustification: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  approvedLimit?: number;
  effectiveDate?: Date;
}

export type LimitType = 
  | 'organizations_per_user'
  | 'projects_per_organization'
  | 'tasks_per_project'
  | 'members_per_organization'
  | 'collaborators_per_personal_board'
  | 'storage_per_organization'
  | 'api_calls_per_month';

export type RequestStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'implemented';

export interface LimitInfo {
  type: LimitType;
  name: string;
  description: string;
  currentLimit: number;
  currentUsage: number;
  maxRequestableLimit: number;
  requiresJustification: boolean;
  autoApprovalThreshold?: number;
}

export interface LimitIncreaseRequestForm {
  limitType: LimitType;
  requestedLimit: number;
  businessJustification: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  expectedGrowth: string;
  timeframe: string;
  alternativeSolutions: string;
}

export const LIMIT_TYPES: Record<LimitType, LimitInfo> = {
  organizations_per_user: {
    type: 'organizations_per_user',
    name: 'Organizations per User',
    description: 'Maximum number of organizations a user can create or own',
    currentLimit: 2,
    currentUsage: 0,
    maxRequestableLimit: 10,
    requiresJustification: true,
    autoApprovalThreshold: 5
  },
  projects_per_organization: {
    type: 'projects_per_organization',
    name: 'Projects per Organization',
    description: 'Maximum number of projects in an organization',
    currentLimit: 5,
    currentUsage: 0,
    maxRequestableLimit: 50,
    requiresJustification: true,
    autoApprovalThreshold: 15
  },
  tasks_per_project: {
    type: 'tasks_per_project',
    name: 'Tasks per Project',
    description: 'Maximum number of tasks in a project',
    currentLimit: 100,
    currentUsage: 0,
    maxRequestableLimit: 10000,
    requiresJustification: true,
    autoApprovalThreshold: 500
  },
  members_per_organization: {
    type: 'members_per_organization',
    name: 'Members per Organization',
    description: 'Maximum number of members in an organization',
    currentLimit: 25,
    currentUsage: 0,
    maxRequestableLimit: 1000,
    requiresJustification: true,
    autoApprovalThreshold: 100
  },
  collaborators_per_personal_board: {
    type: 'collaborators_per_personal_board',
    name: 'Personal Board Collaborators',
    description: 'Maximum number of collaborators on a personal board',
    currentLimit: 10,
    currentUsage: 0,
    maxRequestableLimit: 50,
    requiresJustification: true,
    autoApprovalThreshold: 25
  },
  storage_per_organization: {
    type: 'storage_per_organization',
    name: 'Storage per Organization',
    description: 'Maximum storage space for organization files (GB)',
    currentLimit: 10,
    currentUsage: 0,
    maxRequestableLimit: 1000,
    requiresJustification: true,
    autoApprovalThreshold: 50
  },
  api_calls_per_month: {
    type: 'api_calls_per_month',
    name: 'API Calls per Month',
    description: 'Maximum number of API calls per month',
    currentLimit: 10000,
    currentUsage: 0,
    maxRequestableLimit: 1000000,
    requiresJustification: true,
    autoApprovalThreshold: 50000
  }
};
