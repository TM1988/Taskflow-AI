import { 
  InAppNotification, 
  NotificationPreferences, 
  NotificationSummary, 
  NotificationFilters,
  DEFAULT_NOTIFICATION_PREFERENCES 
} from '../../types/notifications';

/**
 * IN-APP NOTIFICATIONS ONLY SERVICE
 * 
 * IMPORTANT: This service handles ONLY in-app notifications.
 * Email notifications are ONLY sent for organization invitations via emailNotificationService.
 * All other notifications (tasks, projects, deadlines, etc.) are in-app only.
 */

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Get user notifications
   */
  async getNotifications(
    userId: string, 
    filters?: NotificationFilters
  ): Promise<InAppNotification[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.read !== undefined) params.append('read', filters.read.toString());
      if (filters?.category) params.append('category', filters.category);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/users/${userId}/notifications?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      return data.notifications.map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt),
        readAt: notification.readAt ? new Date(notification.readAt) : undefined,
        expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get notification summary
   */
  async getNotificationSummary(userId: string): Promise<NotificationSummary> {
    try {
      const response = await fetch(`/api/users/${userId}/notifications/summary`);
      if (!response.ok) throw new Error('Failed to fetch summary');

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification summary:', error);
      return {
        total: 0,
        unread: 0,
        byCategory: {
          tasks: 0,
          projects: 0,
          organizations: 0,
          system: 0,
          security: 0,
          collaboration: 0
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        },
        recentCount: 0
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/batch-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/users/${userId}/notifications/read-all`, {
        method: 'PATCH'
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultipleNotifications(notificationIds: string[]): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/batch-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting notifications:', error);
      return false;
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`/api/users/${userId}/notification-preferences`);
      if (!response.ok) {
        // Return defaults if preferences don't exist
        return { ...DEFAULT_NOTIFICATION_PREFERENCES, userId };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, userId };
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`/api/users/${userId}/notification-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: string;
    category?: string;
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: Date;
    senderId?: string;
  }): Promise<InAppNotification | null> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notification,
          expiresAt: notification.expiresAt?.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const result = await response.json();
      return {
        ...result,
        createdAt: new Date(result.createdAt),
        expiresAt: result.expiresAt ? new Date(result.expiresAt) : undefined
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    userId: string, 
    onNotification: (notification: InAppNotification) => void
  ): () => void {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll use polling as a fallback
    const pollInterval = setInterval(async () => {
      try {
        const recent = await this.getNotifications(userId, {
          read: false,
          limit: 10,
          dateFrom: new Date(Date.now() - 60000) // Last minute
        });

        recent.forEach(onNotification);
      } catch (error) {
        console.error('Error polling for notifications:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }

  /**
   * Get notification templates for different types
   */
  getNotificationTemplate(type: string, data: Record<string, any>): {
    title: string;
    message: string;
    category: string;
    priority: string;
  } {
    switch (type) {
      case 'task_assigned':
        return {
          title: 'Task Assigned',
          message: `You have been assigned to task: ${data.taskTitle}`,
          category: 'tasks',
          priority: 'medium'
        };
      case 'task_overdue':
        return {
          title: 'Task Overdue',
          message: `Task "${data.taskTitle}" is overdue`,
          category: 'tasks',
          priority: 'high'
        };
      case 'organization_invitation':
        return {
          title: 'Organization Invitation',
          message: `You have been invited to join ${data.organizationName}`,
          category: 'organizations',
          priority: 'medium'
        };
      case 'limit_warning':
        return {
          title: 'Limit Warning',
          message: data.message || 'You are approaching a usage limit',
          category: 'system',
          priority: 'medium'
        };
      case 'limit_reached':
        return {
          title: 'Limit Reached',
          message: data.message || 'You have reached a usage limit',
          category: 'system',
          priority: 'high'
        };
      default:
        return {
          title: 'Notification',
          message: data.message || 'You have a new notification',
          category: 'system',
          priority: 'low'
        };
    }
  }
}

export const notificationService = NotificationService.getInstance();
