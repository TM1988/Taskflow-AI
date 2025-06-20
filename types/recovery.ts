// Recovery system types for soft-deleted items
export interface DeletedItem {
  id: string;
  originalId: string;
  type: 'task' | 'project' | 'organization' | 'column';
  title: string;
  description?: string;
  data: any; // Original item data
  deletedBy: string;
  deletedAt: Date;
  recoveryDeadline: Date; // 24 hours from deletion
  projectId?: string;
  organizationId?: string;
}

export interface RecoveryFilters {
  type?: 'task' | 'project' | 'organization' | 'column';
  projectId?: string;
  organizationId?: string;
  deletedBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface BulkRecoveryRequest {
  itemIds: string[];
  userId: string;
}

export interface RecoveryStats {
  totalDeleted: number;
  expiringSoon: number; // Items expiring in next 6 hours
  byType: {
    task: number;
    project: number;
    organization: number;
    column: number;
  };
}
