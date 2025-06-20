import { 
  SoftDeletedEntity, 
  SoftDeleteResult, 
  RecoveryResult, 
  SoftDeletedEntitySummary,
  SOFT_DELETE_RETENTION_DAYS 
} from '../../types/soft-delete';

class SoftDeleteService {
  private static instance: SoftDeleteService;

  static getInstance(): SoftDeleteService {
    if (!SoftDeleteService.instance) {
      SoftDeleteService.instance = new SoftDeleteService();
    }
    return SoftDeleteService.instance;
  }

  /**
   * Soft delete an entity
   */
  async softDelete(
    entityType: string,
    entityId: string,
    entityData: any,
    deletedBy: string,
    deletedByEmail: string,
    reason?: string,
    parentEntityId?: string,
    parentEntityType?: string
  ): Promise<SoftDeleteResult> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + SOFT_DELETE_RETENTION_DAYS);

      const response = await fetch('/api/soft-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          entityData,
          deletedBy,
          deletedByEmail,
          expiresAt: expiresAt.toISOString(),
          reason,
          parentEntityId,
          parentEntityType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to soft delete entity');
      }

      const result = await response.json();
      return {
        success: true,
        entityId,
        expiresAt,
        message: result.message
      };
    } catch (error) {
      console.error('Error soft deleting entity:', error);
      return {
        success: false,
        entityId,
        expiresAt: new Date(),
        message: error instanceof Error ? error.message : 'Failed to soft delete entity'
      };
    }
  }

  /**
   * Get soft deleted entities by type and parent
   */
  async getSoftDeletedEntities(
    entityType?: string,
    parentEntityId?: string,
    parentEntityType?: string,
    includeExpired: boolean = false
  ): Promise<SoftDeletedEntity[]> {
    try {
      const params = new URLSearchParams();
      if (entityType) params.append('entityType', entityType);
      if (parentEntityId) params.append('parentEntityId', parentEntityId);
      if (parentEntityType) params.append('parentEntityType', parentEntityType);
      if (includeExpired) params.append('includeExpired', 'true');

      const response = await fetch(`/api/soft-delete?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch soft deleted entities');

      const data = await response.json();
      return data.entities.map((entity: any) => ({
        ...entity,
        deletedAt: new Date(entity.deletedAt),
        expiresAt: new Date(entity.expiresAt)
      }));
    } catch (error) {
      console.error('Error fetching soft deleted entities:', error);
      return [];
    }
  }

  /**
   * Recover a soft deleted entity
   */
  async recoverEntity(entityId: string): Promise<RecoveryResult> {
    try {
      const response = await fetch(`/api/soft-delete/${entityId}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to recover entity');
      }

      const result = await response.json();
      return {
        success: true,
        entityId,
        entityType: result.entityType,
        message: result.message
      };
    } catch (error) {
      console.error('Error recovering entity:', error);
      return {
        success: false,
        entityId,
        entityType: '',
        message: error instanceof Error ? error.message : 'Failed to recover entity'
      };
    }
  }

  /**
   * Permanently delete a soft deleted entity
   */
  async permanentlyDelete(entityId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/soft-delete/${entityId}`, {
        method: 'DELETE'
      });

      return response.ok;
    } catch (error) {
      console.error('Error permanently deleting entity:', error);
      return false;
    }
  }

  /**
   * Get summary of soft deleted entities
   */
  async getSoftDeleteSummary(
    parentEntityId?: string,
    parentEntityType?: string
  ): Promise<SoftDeletedEntitySummary> {
    try {
      const params = new URLSearchParams();
      if (parentEntityId) params.append('parentEntityId', parentEntityId);
      if (parentEntityType) params.append('parentEntityType', parentEntityType);

      const response = await fetch(`/api/soft-delete/summary?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch summary');

      return await response.json();
    } catch (error) {
      console.error('Error fetching soft delete summary:', error);
      return {
        total: 0,
        byType: {},
        expiringIn24h: 0,
        expiredPendingCleanup: 0
      };
    }
  }

  /**
   * Check if entity can be recovered (not expired)
   */
  isRecoverable(entity: SoftDeletedEntity): boolean {
    return entity.recoverable && new Date() < entity.expiresAt;
  }

  /**
   * Get time remaining for recovery
   */
  getTimeRemaining(entity: SoftDeletedEntity): string {
    if (!this.isRecoverable(entity)) {
      return 'Expired';
    }

    const now = new Date();
    const remaining = entity.expiresAt.getTime() - now.getTime();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Batch recover multiple entities
   */
  async batchRecover(entityIds: string[]): Promise<RecoveryResult[]> {
    try {
      const response = await fetch('/api/soft-delete/batch-recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityIds })
      });

      if (!response.ok) {
        throw new Error('Failed to batch recover entities');
      }

      return await response.json();
    } catch (error) {
      console.error('Error batch recovering entities:', error);
      return entityIds.map(id => ({
        success: false,
        entityId: id,
        entityType: '',
        message: 'Failed to recover entity'
      }));
    }
  }

  /**
   * Batch permanently delete multiple entities
   */
  async batchPermanentlyDelete(entityIds: string[]): Promise<boolean[]> {
    try {
      const response = await fetch('/api/soft-delete/batch-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityIds })
      });

      if (!response.ok) {
        throw new Error('Failed to batch delete entities');
      }

      const results = await response.json();
      return results.success;
    } catch (error) {
      console.error('Error batch deleting entities:', error);
      return entityIds.map(() => false);
    }
  }
}

export const softDeleteService = SoftDeleteService.getInstance();
