import { 
  BulkUserAction, 
  BulkUserActionResult, 
  BulkUserActionSummary 
} from '../../types/bulk-actions';

class BulkActionsService {
  private static instance: BulkActionsService;

  static getInstance(): BulkActionsService {
    if (!BulkActionsService.instance) {
      BulkActionsService.instance = new BulkActionsService();
    }
    return BulkActionsService.instance;
  }

  /**
   * Perform bulk user management actions
   */
  async performBulkUserAction(
    organizationId: string,
    action: BulkUserAction
  ): Promise<BulkUserActionSummary> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/bulk-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing bulk user action:', error);
      
      // Return failed results for all users
      const failedResults: BulkUserActionResult[] = action.userIds.map(userId => ({
        success: false,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));

      return {
        totalUsers: action.userIds.length,
        successfulActions: 0,
        failedActions: action.userIds.length,
        results: failedResults
      };
    }
  }

  /**
   * Bulk remove users from organization
   */
  async bulkRemoveUsers(
    organizationId: string,
    userIds: string[],
    reason?: string
  ): Promise<BulkUserActionSummary> {
    return this.performBulkUserAction(organizationId, {
      type: 'remove',
      userIds,
      reason
    });
  }

  /**
   * Bulk change user roles in organization
   */
  async bulkChangeRoles(
    organizationId: string,
    userIds: string[],
    newRole: string,
    reason?: string
  ): Promise<BulkUserActionSummary> {
    return this.performBulkUserAction(organizationId, {
      type: 'change_role',
      userIds,
      newRole,
      reason
    });
  }

  /**
   * Bulk block users in organization
   */
  async bulkBlockUsers(
    organizationId: string,
    userIds: string[],
    reason?: string
  ): Promise<BulkUserActionSummary> {
    return this.performBulkUserAction(organizationId, {
      type: 'block',
      userIds,
      reason
    });
  }

  /**
   * Bulk unblock users in organization
   */
  async bulkUnblockUsers(
    organizationId: string,
    userIds: string[],
    reason?: string
  ): Promise<BulkUserActionSummary> {
    return this.performBulkUserAction(organizationId, {
      type: 'unblock',
      userIds,
      reason
    });
  }

  /**
   * Perform bulk task actions
   */
  async performBulkTaskAction(
    projectId: string,
    action: {
      type: 'delete' | 'move' | 'assign' | 'update_status' | 'add_labels';
      taskIds: string[];
      targetColumnId?: string;
      assigneeId?: string;
      status?: string;
      labels?: string[];
      reason?: string;
    }
  ): Promise<BulkUserActionSummary> {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/bulk-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk task action');
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing bulk task action:', error);
      
      const failedResults: BulkUserActionResult[] = action.taskIds.map(taskId => ({
        success: false,
        userId: taskId, // Using userId field for taskId in this context
        error: error instanceof Error ? error.message : 'Unknown error'
      }));

      return {
        totalUsers: action.taskIds.length,
        successfulActions: 0,
        failedActions: action.taskIds.length,
        results: failedResults
      };
    }
  }

  /**
   * Bulk delete tasks
   */
  async bulkDeleteTasks(
    projectId: string,
    taskIds: string[],
    reason?: string
  ): Promise<BulkUserActionSummary> {
    return this.performBulkTaskAction(projectId, {
      type: 'delete',
      taskIds,
      reason
    });
  }

  /**
   * Bulk move tasks to column
   */
  async bulkMoveTasks(
    projectId: string,
    taskIds: string[],
    targetColumnId: string,
    reason?: string
  ): Promise<BulkUserActionSummary> {
    return this.performBulkTaskAction(projectId, {
      type: 'move',
      taskIds,
      targetColumnId,
      reason
    });
  }

  /**
   * Bulk assign tasks
   */
  async bulkAssignTasks(
    projectId: string,
    taskIds: string[],
    assigneeId: string,
    reason?: string
  ): Promise<BulkUserActionSummary> {
    return this.performBulkTaskAction(projectId, {
      type: 'assign',
      taskIds,
      assigneeId,
      reason
    });
  }

  /**
   * Bulk update task status
   */
  async bulkUpdateTaskStatus(
    projectId: string,
    taskIds: string[],
    status: string,
    reason?: string
  ): Promise<BulkUserActionSummary> {
    return this.performBulkTaskAction(projectId, {
      type: 'update_status',
      taskIds,
      status,
      reason
    });
  }

  /**
   * Validate bulk action before execution
   */
  async validateBulkAction(
    action: BulkUserAction | any,
    context: 'organization' | 'project'
  ): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
    recommendations: string[];
  }> {
    try {
      const endpoint = context === 'organization' 
        ? '/api/bulk-actions/validate-user-action'
        : '/api/bulk-actions/validate-task-action';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });

      if (!response.ok) {
        throw new Error('Failed to validate bulk action');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating bulk action:', error);
      return {
        valid: false,
        warnings: [],
        errors: ['Failed to validate action'],
        recommendations: []
      };
    }
  }

  /**
   * Get bulk action history for audit
   */
  async getBulkActionHistory(
    organizationId?: string,
    projectId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organizationId', organizationId);
      if (projectId) params.append('projectId', projectId);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/bulk-actions/history?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();
      return data.actions || [];
    } catch (error) {
      console.error('Error fetching bulk action history:', error);
      return [];
    }
  }
}

export const bulkActionsService = BulkActionsService.getInstance();
