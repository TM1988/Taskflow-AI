export interface BulkUserAction {
  type: 'remove' | 'change_role' | 'block' | 'unblock';
  userIds: string[];
  newRole?: string;
  reason?: string;
}

export interface BulkUserActionResult {
  success: boolean;
  userId: string;
  message?: string;
  error?: string;
}

export interface BulkUserActionSummary {
  totalUsers: number;
  successfulActions: number;
  failedActions: number;
  results: BulkUserActionResult[];
}

export interface UserBulkSelection {
  selectedUsers: Set<string>;
  selectAll: boolean;
  totalUsers: number;
}

export interface UserManagementBulkOptions {
  maxBulkActions: number;
  allowedActions: BulkUserAction['type'][];
  requireConfirmation: boolean;
  requireReason: boolean;
}
