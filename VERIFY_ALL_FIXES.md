# VERIFY ALL FIXES - Comprehensive Test Guide

## 🚨 URGENT ISSUE VERIFICATION

This document provides step-by-step verification for all the assignee and workload fixes implemented.

## 🔧 Quick Verification Steps

### 1. **Assignee Dropdown Fix**
1. Open a task that should be assigned to "tanish mantri"
2. Click "Edit" to open the task detail dialog
3. **✅ EXPECTED**: Assignee dropdown should show "tanish mantri" (not "Unassigned")
4. **❌ IF BROKEN**: Dropdown shows "Unassigned" despite task being assigned

### 2. **Assignee Update Fix** 
1. In the task edit dialog, change the assignee
2. Click "Save"
3. **✅ EXPECTED**: Assignment should save successfully
4. **❌ IF BROKEN**: Changes don't save or revert back

### 3. **Workload Numbers Update**
1. Go to project dashboard
2. Look at "Team Workload AI" section
3. Assign/unassign tasks
4. **✅ EXPECTED**: Numbers should update in real-time (within 5-10 seconds)
5. **❌ IF BROKEN**: Always shows "0/10 tasks" despite assignments

### 4. **Workload Limit Enforcement**
1. In assignee dropdown, look for members at their limit
2. **✅ EXPECTED**: Should see:
   - Red X (🚫) icon next to member name
   - Task count like "10/10" instead of role
   - Warning text: "This member is at their limit..."
   - Cannot assign more tasks to them
   - Toast notification if assignment attempted

## 🧪 Browser Console Tests

### Test 1: Quick API Check
```javascript
// Paste this in browser console on project page
const projectId = 'jH3pRvdw2dwYTCyh9Njy'; // Replace with your project ID
const memberId = 'Fy665OWJrkgB6oayuoOkZ8M28Hz2'; // Replace with member ID
const orgId = 'KQe1cbaUZ7JocUTDbvhi'; // Replace with org ID

fetch(`/api/analytics/member-workload?projectId=${projectId}&memberId=${memberId}&organizationId=${orgId}`)
  .then(r => r.json())
  .then(data => {
    console.log('🔍 Workload API Result:', data);
    console.log(`📊 Member has ${data.assignedTasks}/${data.taskLimit} tasks (${data.workloadPercentage}%)`);
  });
```

### Test 2: Board vs Workload Comparison
```javascript
// Compare board API vs workload API
const projectId = 'jH3pRvdw2dwYTCyh9Njy';
const memberId = 'Fy665OWJrkgB6oayuoOkZ8M28Hz2';
const orgId = 'KQe1cbaUZ7JocUTDbvhi';

Promise.all([
  fetch(`/api/board/${projectId}?organizationId=${orgId}`).then(r => r.json()),
  fetch(`/api/analytics/member-workload?projectId=${projectId}&memberId=${memberId}&organizationId=${orgId}`).then(r => r.json())
]).then(([boardData, workloadData]) => {
  let boardAssignedCount = 0;
  for (const column of Object.values(boardData.board)) {
    boardAssignedCount += column.tasks.filter(t => t.assigneeId === memberId).length;
  }
  
  console.log('📋 Board API shows:', boardAssignedCount, 'tasks assigned to member');
  console.log('📊 Workload API shows:', workloadData.assignedTasks, 'tasks assigned to member');
  console.log('✅ Match:', boardAssignedCount === workloadData.assignedTasks ? 'YES' : 'NO');
});
```

### Test 3: Force Workload Refresh
```javascript
// Trigger workload update event
window.dispatchEvent(new CustomEvent('workloadChanged', {
  detail: { projectId: 'jH3pRvdw2dwYTCyh9Njy' } // Replace with your project ID
}));
console.log('🔄 Workload refresh event triggered');
```

## 🔍 Debugging Common Issues

### Issue 1: Workload Still Shows 0/10
**Symptoms**: Team workload always shows 0 tasks despite visible assignments

**Debug Steps**:
1. Check browser console for API errors
2. Run Test 2 above to compare board vs workload APIs
3. Verify organization ID is being passed correctly
4. Check if tasks are in the correct database (organization vs user)

**Potential Fixes**:
- Organization ID mismatch
- Database connection issues  
- Task assignment IDs not matching exactly

### Issue 2: Assignee Dropdown Shows "Unassigned"
**Symptoms**: Edit dialog shows "Unassigned" but board shows assigned user

**Debug Steps**:
1. Check task detail API: `/api/task-direct/[taskId]`
2. Verify `assigneeId` field is in response
3. Check if task exists in correct database

**Potential Fixes**:
- API not returning `assigneeId` field
- Database connection mismatch
- Task ID format issues

### Issue 3: Assignee Changes Don't Save
**Symptoms**: Can select assignee but changes revert after save

**Debug Steps**:
1. Check task update API: `/api/tasks/[taskId]`
2. Verify PUT request includes `assigneeId`
3. Check response for errors

**Potential Fixes**:
- Update API not handling `assigneeId`
- Database write permissions
- Validation errors

## 📝 API Endpoint Status Check

### Core APIs That Must Work:
1. **`/api/task-direct/[taskId]`** - Returns task with `assigneeId`
2. **`/api/tasks/[taskId]`** - Updates task including `assigneeId`  
3. **`/api/analytics/member-workload`** - Returns accurate workload data
4. **`/api/board/[projectId]`** - Returns tasks with assignments
5. **`/api/projects/[projectId]/members`** - Returns project members

### Testing Each API:
```bash
# Test task detail API
curl "http://localhost:3000/api/task-direct/686aa7bbf1a5fc187c967fb9?userId=USER_ID&organizationId=ORG_ID&projectId=PROJECT_ID"

# Test workload API  
curl "http://localhost:3000/api/analytics/member-workload?projectId=PROJECT_ID&memberId=MEMBER_ID&organizationId=ORG_ID"

# Test board API
curl "http://localhost:3000/api/board/PROJECT_ID?organizationId=ORG_ID"
```

## 🎯 Expected Behavior After Fixes

### Assignee Dropdown:
- ✅ Shows correct current assignee
- ✅ Updates when changed
- ✅ Shows workload info (e.g., "5/10" instead of "member")
- ✅ Prevents assignment to members at limit
- ✅ Shows red X for members at limit
- ✅ Displays warning message
- ✅ Shows toast notification on failed assignment

### Team Workload:
- ✅ Shows real task counts (not 0/10)
- ✅ Updates in real-time when assignments change
- ✅ Shows proper workload levels:
  - **Low** (<50%): Blue
  - **Medium** (50-80%): Yellow  
  - **High** (>80%): Red
- ✅ Provides AI recommendations based on actual workload
- ✅ Refreshes automatically every 30 seconds

### Task Assignment Flow:
1. User selects assignee in dropdown
2. Workload check prevents if at limit (shows toast)
3. If allowed, task updates with new assigneeId
4. Workload change event triggers
5. Team workload component refreshes
6. Assignee dropdown cache invalidates
7. Numbers update across all components

## 🚫 What Should NOT Happen

- ❌ Dropdown showing "Unassigned" when task is assigned
- ❌ Assignment changes not saving
- ❌ Workload always showing 0 tasks
- ❌ Ability to assign to members at 100% capacity
- ❌ No visual indicators for member limits
- ❌ No real-time updates
- ❌ Inconsistent data between components

## 🛠️ If Issues Persist

### 1. **Check Server Logs**
Look for errors in the Next.js console, especially:
- Database connection errors
- MongoDB query failures
- Missing field errors

### 2. **Database Verification**
Ensure tasks are stored with correct:
- `projectId` format
- `assigneeId` values
- Organization association

### 3. **Component State**
Verify React components are:
- Receiving workload change events
- Refreshing data properly
- Using correct API parameters

### 4. **Cache Issues**
Clear any caching:
- Browser cache
- Component cache in assignee dropdown
- API response cache

## ✅ SUCCESS CRITERIA

All fixes are successful when:

1. **Assignee Display**: Edit dialog shows correct assignee
2. **Assignee Updates**: Changes save and persist
3. **Workload Numbers**: Show real counts, not 0/10
4. **Real-time Updates**: Workload refreshes when assignments change
5. **Limit Enforcement**: Cannot assign to members at capacity
6. **Visual Feedback**: Red X, warnings, and notifications work
7. **Data Consistency**: All APIs return matching information

## 🚀 Final Verification

Run this complete test sequence:

1. Assign a task to a member
2. Check workload numbers update
3. Try to assign another task to same member
4. Verify limit enforcement if at capacity
5. Edit existing task assignment
6. Confirm changes save properly
7. Verify real-time updates across components

**If all steps work correctly, the fixes are successful! 🎉**