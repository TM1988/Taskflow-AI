export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  priority: NotificationPriority;
  category: NotificationCategory;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  sender?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'task_overdue'
  | 'project_shared'
  | 'organization_invitation'
  | 'role_changed'
  | 'deadline_reminder'
  | 'mention'
  | 'comment_added'
  | 'limit_warning'
  | 'limit_reached'
  | 'system_update'
  | 'security_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationCategory = 
  | 'tasks'
  | 'projects' 
  | 'organizations'
  | 'system'
  | 'security'
  | 'collaboration';

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
  categories: Record<NotificationCategory, {
    enabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
  }>;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
    timezone: string;
  };
  digestSettings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string;
  };
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  recentCount: number; // Last 24 hours
}

export interface NotificationFilters {
  read?: boolean;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  task_assigned: '📋',
  task_completed: '✅',
  task_overdue: '⏰',
  project_shared: '📁',
  organization_invitation: '🏢',
  role_changed: '👤',
  deadline_reminder: '⏰',
  mention: '@',
  comment_added: '💬',
  limit_warning: '⚠️',
  limit_reached: '🚫',
  system_update: '🔄',
  security_alert: '🔒'
};

export const NOTIFICATION_COLORS: Record<NotificationPriority, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500'
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  userId: '',
  emailNotifications: false, // Disabled - only org invites via email
  inAppNotifications: true,
  pushNotifications: false,
  categories: {
    tasks: { enabled: true, emailEnabled: false, pushEnabled: false },
    projects: { enabled: true, emailEnabled: false, pushEnabled: false },
    organizations: { enabled: true, emailEnabled: false, pushEnabled: false }, // Org invites handled separately
    system: { enabled: true, emailEnabled: false, pushEnabled: false },
    security: { enabled: true, emailEnabled: false, pushEnabled: false },
    collaboration: { enabled: true, emailEnabled: false, pushEnabled: false }
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'UTC'
  },
  digestSettings: {
    enabled: false,
    frequency: 'daily',
    time: '09:00'
  }
};

// IMPORTANT EMAIL POLICY:
// TaskFlow only sends emails for organization invitations.
// All other notifications (tasks, projects, deadlines, comments, system) are in-app only.
// This reduces email clutter and keeps users focused within the platform.
