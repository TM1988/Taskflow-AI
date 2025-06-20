'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import {
  CheckSquare,
  Trash2,
  Move,
  UserPlus,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bulkActionsService } from '@/services/bulk-actions/bulkActionsService';
import { BulkUserActionSummary } from '@/types/bulk-actions';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  assigneeName?: string;
  columnId: string;
  columnName: string;
  createdAt: Date;
}

interface Column {
  id: string;
  name: string;
  position: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface TaskBulkActionsProps {
  projectId: string;
  tasks: Task[];
  columns: Column[];
  teamMembers: TeamMember[];
  onTasksUpdated: () => void;
  className?: string;
}

type BulkTaskAction = 'delete' | 'move' | 'assign' | 'update_status';

const TaskBulkActions: React.FC<TaskBulkActionsProps> = ({
  projectId,
  tasks,
  columns,
  teamMembers,
  onTasksUpdated,
  className = ''
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkTaskAction | ''>('');
  const [targetColumnId, setTargetColumnId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: any;
  }>({ open: false, action: null });
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<BulkUserActionSummary | null>(null);
  const [showResults, setShowResults] = useState(false);

  const { toast } = useToast();

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'done', label: 'Done' }
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'move': return <Move className="h-4 w-4" />;
      case 'assign': return <UserPlus className="h-4 w-4" />;
      case 'update_status': return <BarChart3 className="h-4 w-4" />;
      default: return <CheckSquare className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'delete': return 'Delete Tasks';
      case 'move': return 'Move Tasks';
      case 'assign': return 'Assign Tasks';
      case 'update_status': return 'Update Status';
      default: return action;
    }
  };

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    const newSelection = new Set(selectedTasks);
    if (checked) {
      newSelection.add(taskId);
    } else {
      newSelection.delete(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const validateAction = (): string[] => {
    const errors: string[] = [];

    if (selectedTasks.size === 0) {
      errors.push('Please select at least one task');
    }

    if (!bulkAction) {
      errors.push('Please select an action');
    }

    if (bulkAction === 'move' && !targetColumnId) {
      errors.push('Please select a target column');
    }

    if (bulkAction === 'assign' && !assigneeId) {
      errors.push('Please select an assignee');
    }

    if (bulkAction === 'update_status' && !newStatus) {
      errors.push('Please select a new status');
    }

    if (selectedTasks.size > 100) {
      errors.push('Maximum 100 tasks can be processed at once');
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

    const action = {
      type: bulkAction,
      taskIds: Array.from(selectedTasks),
      targetColumnId: bulkAction === 'move' ? targetColumnId : undefined,
      assigneeId: bulkAction === 'assign' ? assigneeId : undefined,
      status: bulkAction === 'update_status' ? newStatus : undefined,
      reason: reason.trim() || undefined
    };

    setConfirmDialog({ open: true, action });
  };

  const executeAction = async () => {
    if (!confirmDialog.action) return;

    setExecuting(true);
    try {
      const result = await bulkActionsService.performBulkTaskAction(
        projectId,
        confirmDialog.action
      );

      setResults(result);
      setShowResults(true);

      if (result.successfulActions > 0) {
        toast({
          title: 'Action Completed',
          description: `${result.successfulActions} tasks processed successfully`
        });
        onTasksUpdated();
      }

      if (result.failedActions > 0) {
        toast({
          title: 'Partial Success',
          description: `${result.failedActions} actions failed`,
          variant: 'destructive'
        });
      }

      // Reset form
      setSelectedTasks(new Set());
      setBulkAction('');
      setTargetColumnId('');
      setAssigneeId('');
      setNewStatus('');
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

  const getSelectedTasksInfo = () => {
    const selected = tasks.filter(task => selectedTasks.has(task.id));
    const columnCounts = selected.reduce((acc, task) => {
      acc[task.columnName] = (acc[task.columnName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { selected, columnCounts };
  };

  const { selected: selectedTasksData, columnCounts } = getSelectedTasksInfo();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Task Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Bulk Task Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select All */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTasks.size === tasks.length && tasks.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label>Select All ({tasks.length} tasks)</Label>
            </div>
            <Badge variant="outline">
              {selectedTasks.size} selected
            </Badge>
          </div>

          {/* Column Summary */}
          {selectedTasks.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(columnCounts).map(([columnName, count]) => (
                <Badge key={columnName} variant="secondary">
                  {columnName}: {count}
                </Badge>
              ))}
            </div>
          )}

          {/* Tasks List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={(checked) => handleTaskSelection(task.id, !!checked)}
                  />
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {task.columnName} • {task.assigneeName || 'Unassigned'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={
                    task.priority === 'high' ? 'border-red-500 text-red-500' :
                    task.priority === 'medium' ? 'border-yellow-500 text-yellow-500' :
                    'border-green-500 text-green-500'
                  }>
                    {task.priority}
                  </Badge>
                  <Badge variant="secondary">{task.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Configuration */}
      {selectedTasks.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as BulkTaskAction | '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delete">Delete Tasks</SelectItem>
                  <SelectItem value="move">Move to Column</SelectItem>
                  <SelectItem value="assign">Assign to User</SelectItem>
                  <SelectItem value="update_status">Update Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkAction === 'move' && (
              <div className="space-y-2">
                <Label>Target Column</Label>
                <Select value={targetColumnId} onValueChange={setTargetColumnId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {bulkAction === 'assign' && (
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {bulkAction === 'update_status' && (
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
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
              disabled={!bulkAction || selectedTasks.size === 0}
              className="w-full"
            >
              {getActionIcon(bulkAction)}
              <span className="ml-2">{getActionLabel(bulkAction)} ({selectedTasks.size} tasks)</span>
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
              You are about to {getActionLabel(bulkAction).toLowerCase()} {selectedTasks.size} task(s).
              {bulkAction === 'delete' && ' This action cannot be undone.'}
              {bulkAction === 'move' && ` Tasks will be moved to "${columns.find(c => c.id === targetColumnId)?.name}".`}
              {bulkAction === 'assign' && ` Tasks will be assigned to "${teamMembers.find(m => m.id === assigneeId)?.name || 'Unassigned'}".`}
              {bulkAction === 'update_status' && ` Status will be changed to "${statusOptions.find(s => s.value === newStatus)?.label}".`}
              
              <div className="mt-3 p-3 bg-muted rounded">
                <strong>Selected Tasks:</strong> {selectedTasks.size}
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
              className={bulkAction === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
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
                      <span className="text-sm">Task ID: {result.userId}</span>
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

export default TaskBulkActions;
