import { DeletedItem, RecoveryFilters, BulkRecoveryRequest, RecoveryStats } from "@/types/recovery";

export const recoveryService = {
  // Get all soft-deleted items with filtering
  async getDeletedItems(filters: RecoveryFilters = {}): Promise<DeletedItem[]> {
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.projectId) queryParams.append('projectId', filters.projectId);
    if (filters.organizationId) queryParams.append('organizationId', filters.organizationId);
    if (filters.deletedBy) queryParams.append('deletedBy', filters.deletedBy);
    if (filters.dateRange) {
      queryParams.append('startDate', filters.dateRange.start.toISOString());
      queryParams.append('endDate', filters.dateRange.end.toISOString());
    }

    const response = await fetch(`/api/recovery/deleted-items?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch deleted items: ${response.statusText}`);
    }
    return await response.json();
  },

  // Get recovery statistics
  async getRecoveryStats(organizationId?: string): Promise<RecoveryStats> {
    const url = organizationId 
      ? `/api/recovery/stats?organizationId=${organizationId}`
      : '/api/recovery/stats';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch recovery stats: ${response.statusText}`);
    }
    return await response.json();
  },

  // Recover a single item
  async recoverItem(itemId: string): Promise<{ success: boolean; restoredItem: any }> {
    const response = await fetch(`/api/recovery/restore/${itemId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to recover item: ${response.statusText}`);
    }
    return await response.json();
  },

  // Bulk recover multiple items
  async bulkRecover(request: BulkRecoveryRequest): Promise<{ 
    success: boolean; 
    recovered: string[]; 
    failed: { id: string; error: string }[] 
  }> {
    const response = await fetch('/api/recovery/bulk-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk recover items: ${response.statusText}`);
    }
    return await response.json();
  },

  // Permanently delete an item (skip recovery)
  async permanentlyDelete(itemId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/recovery/permanent-delete/${itemId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to permanently delete item: ${response.statusText}`);
    }
    return await response.json();
  },

  // Cleanup expired items (called by cron job)
  async cleanupExpiredItems(): Promise<{ deletedCount: number }> {
    const response = await fetch('/api/recovery/cleanup-expired', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to cleanup expired items: ${response.statusText}`);
    }
    return await response.json();
  },

  // Soft delete an item (used by other services)
  async softDelete(type: string, originalId: string, data: any, deletedBy: string, projectId?: string, organizationId?: string): Promise<DeletedItem> {
    const response = await fetch('/api/recovery/soft-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        originalId,
        data,
        deletedBy,
        projectId,
        organizationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to soft delete item: ${response.statusText}`);
    }
    return await response.json();
  },
};
