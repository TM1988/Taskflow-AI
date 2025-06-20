'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserMinus,
  UserCog,
  Shield,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bulkActionsService } from '@/services/bulk-actions/bulkActionsService';
import { BulkUserAction, BulkUserActionSummary } from '@/types/bulk-actions';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'blocked';
  joinedAt: Date;
}

interface UserBulkActionsProps {
  organizationId: string;
  users: User[];
  currentUserRole: string;
  onUsersUpdated: () => void;
  className?: string;
}

const UserBulkActions: React.FC<UserBulkActionsProps> = ({
  organizationId,
  users,
  currentUserRole,
  onUsersUpdated,
  className = ''
}) => {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkUserAction['type'] | ''>('');
  const [newRole, setNewRole] = useState('');
  const [reason, setReason] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: BulkUserAction | null;
  }>({ open: false, action: null });
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<BulkUserActionSummary | null>(null);
  const [showResults, setShowResults] = useState(false);

  const { toast } = useToast();

  const availableRoles = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' }
  ];

  const canPerformAction = (action: BulkUserAction['type']) => {
    // Only owners and admins can perform bulk actions
    return ['owner', 'admin'].includes(currentUserRole);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'remove': return <UserMinus className="h-4 w-4" />;
      case 'change_role': return <UserCog className="h-4 w-4" />;
      case 'block': return <ShieldOff className="h-4 w-4" />;
      case 'unblock': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'remove': return 'Remove Users';
      case 'change_role': return 'Change Role';
      case 'block': return 'Block Users';
      case 'unblock': return 'Unblock Users';
      default: return action;
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    const newSelection = new Set(selectedUsers);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const validateAction = (): string[] => {
    const errors: string[] = [];

    if (selectedUsers.size === 0) {
      errors.push('Please select at least one user');
    }

    if (!bulkAction) {
      errors.push('Please select an action');
    }

    if (bulkAction === 'change_role' && !newRole) {
      errors.push('Please select a new role');
    }

    if (selectedUsers.size > 50) {
      errors.push('Maximum 50 users can be processed at once');
    }

    return errors;
  };

  const handleConfirmAction = () => {
    const errors = validateAction();
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    const action: BulkUserAction = {
      type: bulkAction as BulkUserAction['type'],
      userIds: Array.from(selectedUsers),
      newRole: bulkAction === 'change_role' ? newRole : undefined,
      reason: reason.trim() || undefined
    };

    setConfirmDialog({ open: true, action });
  };

  const executeAction = async () => {
    if (!confirmDialog.action) return;

    setExecuting(true);
    try {
      const result = await bulkActionsService.performBulkUserAction(
        organizationId,
        confirmDialog.action
      );

      setResults(result);
      setShowResults(true);

      if (result.successfulActions > 0) {
        toast({
          title: 'Action Completed',
          description: `${result.successfulActions} users processed successfully`
        });
        onUsersUpdated();
      }

      if (result.failedActions > 0) {
        toast({
          title: 'Partial Success',
          description: `${result.failedActions} actions failed`,
          variant: 'destructive'
        });
      }

      // Reset form
      setSelectedUsers(new Set());
      setBulkAction('');
      setNewRole('');
      setReason('');
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setExecuting(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  if (!canPerformAction('remove')) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Only organization owners and admins can perform bulk user actions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk User Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select All */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedUsers.size === users.length && users.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label>Select All ({users.length} users)</Label>
            </div>
            <Badge variant="outline">
              {selectedUsers.size} selected
            </Badge>
          </div>

          {/* Users List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onCheckedChange={(checked) => handleUserSelection(user.id, !!checked)}
                  />
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{user.role}</Badge>
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {user.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Configuration */}
      {selectedUsers.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as BulkUserAction['type'] | '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remove">Remove Users</SelectItem>
                  <SelectItem value="change_role">Change Role</SelectItem>
                  <SelectItem value="block">Block Users</SelectItem>
                  <SelectItem value="unblock">Unblock Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkAction === 'change_role' && (
              <div className="space-y-2">
                <Label>New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this action..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleConfirmAction}
              disabled={!bulkAction || selectedUsers.size === 0}
              className="w-full"
            >
              {getActionIcon(bulkAction)}
              <span className="ml-2">{getActionLabel(bulkAction)} ({selectedUsers.size} users)</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Bulk Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to {getActionLabel(bulkAction).toLowerCase()} {selectedUsers.size} user(s).
              {bulkAction === 'remove' && ' This will permanently remove them from the organization.'}
              {bulkAction === 'change_role' && ` Their role will be changed to ${newRole}.`}
              {bulkAction === 'block' && ' They will lose access to the organization.'}
              
              <div className="mt-3 p-3 bg-muted rounded">
                <strong>Selected Users:</strong> {selectedUsers.size}
                {reason && (
                  <div className="mt-2">
                    <strong>Reason:</strong> {reason}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={executing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={executing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {executing ? 'Processing...' : 'Confirm Action'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Action Results</DialogTitle>
            <DialogDescription>
              Bulk action completed with the following results:
            </DialogDescription>
          </DialogHeader>
          
          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{results.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{results.successfulActions}</div>
                  <div className="text-sm text-muted-foreground">Success</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{results.failedActions}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              {results.results.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {results.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">User ID: {result.userId}</span>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResults(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserBulkActions;
