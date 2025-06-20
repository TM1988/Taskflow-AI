'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trash2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Package,
  FileText,
  Users,
  Folder,
  CheckSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { softDeleteService } from '@/services/soft-delete/softDeleteService';
import { SoftDeletedEntity, SoftDeletedEntitySummary } from '@/types/soft-delete';

interface SoftDeleteManagerProps {
  parentEntityId?: string;
  parentEntityType?: string;
  entityType?: string;
  className?: string;
  showSummary?: boolean;
}

const SoftDeleteManager: React.FC<SoftDeleteManagerProps> = ({
  parentEntityId,
  parentEntityType,
  entityType,
  className = '',
  showSummary = true
}) => {
  const [deletedEntities, setDeletedEntities] = useState<SoftDeletedEntity[]>([]);
  const [summary, setSummary] = useState<SoftDeletedEntitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'recover' | 'permanent_delete';
    entities: string[];
  }>({ open: false, type: 'recover', entities: [] });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [parentEntityId, parentEntityType, entityType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [entities, summaryData] = await Promise.all([
        softDeleteService.getSoftDeletedEntities(entityType, parentEntityId, parentEntityType),
        showSummary ? softDeleteService.getSoftDeleteSummary(parentEntityId, parentEntityType) : null
      ]);
      
      setDeletedEntities(entities);
      if (summaryData) setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching soft deleted data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deleted items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'organization': return <Package className="h-4 w-4" />;
      case 'project': return <Folder className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'column': return <FileText className="h-4 w-4" />;
      case 'team_member': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getEntityTypeName = (type: string) => {
    switch (type) {
      case 'organization': return 'Organization';
      case 'project': return 'Project';
      case 'task': return 'Task';
      case 'column': return 'Column';
      case 'team_member': return 'Team Member';
      default: return type;
    }
  };

  const getEntityName = (entity: SoftDeletedEntity) => {
    return entity.entityData?.name || 
           entity.entityData?.title || 
           entity.entityData?.displayName ||
           entity.entityData?.email ||
           `${getEntityTypeName(entity.entityType)} #${entity.entityId.slice(-6)}`;
  };

  const handleSelectionChange = (entityId: string, checked: boolean) => {
    const newSelection = new Set(selectedEntities);
    if (checked) {
      newSelection.add(entityId);
    } else {
      newSelection.delete(entityId);
    }
    setSelectedEntities(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntities(new Set(deletedEntities.map(e => e.id)));
    } else {
      setSelectedEntities(new Set());
    }
  };

  const handleBatchAction = (action: 'recover' | 'permanent_delete') => {
    if (selectedEntities.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select items to perform this action',
        variant: 'destructive'
      });
      return;
    }

    setConfirmDialog({
      open: true,
      type: action,
      entities: Array.from(selectedEntities)
    });
  };

  const confirmBatchAction = async () => {
    const { type, entities } = confirmDialog;
    
    try {
      if (type === 'recover') {
        const results = await softDeleteService.batchRecover(entities);
        const successCount = results.filter(r => r.success).length;
        
        toast({
          title: 'Recovery Complete',
          description: `${successCount} of ${entities.length} items recovered successfully`
        });
      } else {
        const results = await softDeleteService.batchPermanentlyDelete(entities);
        const successCount = results.filter(r => r).length;
        
        toast({
          title: 'Deletion Complete',
          description: `${successCount} of ${entities.length} items permanently deleted`
        });
      }
      
      await fetchData();
      setSelectedEntities(new Set());
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: 'Failed to complete the batch action',
        variant: 'destructive'
      });
    } finally {
      setConfirmDialog({ open: false, type: 'recover', entities: [] });
    }
  };

  const handleSingleAction = async (entity: SoftDeletedEntity, action: 'recover' | 'permanent_delete') => {
    try {
      if (action === 'recover') {
        const result = await softDeleteService.recoverEntity(entity.id);
        if (result.success) {
          toast({
            title: 'Item Recovered',
            description: `${getEntityName(entity)} has been recovered`
          });
        } else {
          throw new Error(result.message);
        }
      } else {
        const success = await softDeleteService.permanentlyDelete(entity.id);
        if (success) {
          toast({
            title: 'Item Deleted',
            description: `${getEntityName(entity)} has been permanently deleted`
          });
        } else {
          throw new Error('Failed to delete item');
        }
      }
      
      await fetchData();
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: error instanceof Error ? error.message : 'Failed to complete action',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary */}
      {showSummary && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Deleted Items Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.expiringIn24h}</div>
                <div className="text-sm text-muted-foreground">Expiring Soon</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.expiredPendingCleanup}</div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.total - summary.expiredPendingCleanup}
                </div>
                <div className="text-sm text-muted-foreground">Recoverable</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deleted Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Deleted Items ({deletedEntities.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {deletedEntities.length === 0 ? (
            <div className="text-center py-8">
              <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Deleted Items</h3>
              <p className="text-muted-foreground">
                Deleted items will appear here and can be recovered within 24 hours.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Batch Actions */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedEntities.size === deletedEntities.length && deletedEntities.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedEntities.size} of {deletedEntities.length} selected
                  </span>
                </div>
                
                {selectedEntities.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBatchAction('recover')}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recover Selected
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBatchAction('permanent_delete')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </Button>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {deletedEntities.map((entity) => {
                  const isRecoverable = softDeleteService.isRecoverable(entity);
                  const timeRemaining = softDeleteService.getTimeRemaining(entity);
                  
                  return (
                    <div key={entity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedEntities.has(entity.id)}
                          onCheckedChange={(checked) => handleSelectionChange(entity.id, !!checked)}
                        />
                        
                        <div className="flex items-center gap-2">
                          {getEntityIcon(entity.entityType)}
                          <div>
                            <div className="font-medium">{getEntityName(entity)}</div>
                            <div className="text-sm text-muted-foreground">
                              {getEntityTypeName(entity.entityType)} • Deleted by {entity.deletedByEmail}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className={isRecoverable ? 'text-green-600' : 'text-red-600'}>
                              {timeRemaining}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(entity.deletedAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {isRecoverable ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSingleAction(entity, 'recover')}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Recover
                            </Button>
                          ) : (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSingleAction(entity, 'permanent_delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'recover' ? 'Recover Items' : 'Permanently Delete Items'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'recover' 
                ? `Are you sure you want to recover ${confirmDialog.entities.length} item(s)? They will be restored to their original location.`
                : `Are you sure you want to permanently delete ${confirmDialog.entities.length} item(s)? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.type === 'recover' ? 'default' : 'destructive'}
              onClick={confirmBatchAction}
            >
              {confirmDialog.type === 'recover' ? 'Recover Items' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expiring Items Alert */}
      {summary && summary.expiringIn24h > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {summary.expiringIn24h} item(s) will be permanently deleted within 24 hours. 
            Recover them now if you need them back.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SoftDeleteManager;
