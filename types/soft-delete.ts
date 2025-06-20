export interface SoftDeleteSettings {
  enabled: boolean;
  retentionDays: number; // Default 1 day for 24h recovery
  autoCleanupEnabled: boolean;
}

export interface SoftDeletedEntity {
  id: string;
  entityType: 'organization' | 'project' | 'task' | 'column' | 'team_member';
  entityId: string;
  entityData: any; // The original entity data
  deletedAt: Date;
  deletedBy: string;
  deletedByEmail: string;
  expiresAt: Date;
  reason?: string;
  recoverable: boolean;
  parentEntityId?: string; // For tasks: projectId, for projects: organizationId
  parentEntityType?: string;
}

export interface SoftDeleteResult {
  success: boolean;
  entityId: string;
  expiresAt: Date;
  message?: string;
}

export interface RecoveryResult {
  success: boolean;
  entityId: string;
  entityType: string;
  message?: string;
}

export interface SoftDeletedEntitySummary {
  total: number;
  byType: Record<string, number>;
  expiringIn24h: number;
  expiredPendingCleanup: number;
}

export const SOFT_DELETE_RETENTION_DAYS = 1; // 24 hours
export const SOFT_DELETE_CLEANUP_INTERVAL_HOURS = 6; // Check every 6 hours for cleanup
