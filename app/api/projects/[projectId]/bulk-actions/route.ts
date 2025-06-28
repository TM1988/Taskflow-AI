import { NextRequest, NextResponse } from 'next/server';
import { bulkActionsService } from '@/services/bulk-actions/bulkActionsService';

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { action, taskIds, assigneeId, status, reason } = body;

    let result;
    switch (action) {
      case 'assign':
        if (!assigneeId) {
          return NextResponse.json(
            { error: 'Assignee ID is required for assign action' },
            { status: 400 }
          );
        }
        result = await bulkActionsService.bulkAssignTasks(
          projectId,
          taskIds,
          assigneeId,
          reason
        );
        break;

      case 'update_status':
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          );
        }
        result = await bulkActionsService.bulkUpdateTaskStatus(
          projectId,
          taskIds,
          status,
          reason
        );
        break;

      case 'delete':
        result = await bulkActionsService.bulkDeleteTasks(
          projectId,
          taskIds,
          reason
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const body = await request.json();
    const { action, context = 'project' } = body;

    const validation = await bulkActionsService.validateBulkAction(action, context);

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Bulk action validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate bulk action' },
      { status: 500 }
    );
  }
}
