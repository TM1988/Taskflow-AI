const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TASK_ID = '686aa7bbf1a5fc187c967fb9';
const TEST_PROJECT_ID = 'jH3pRvdw2dwYTCyh9Njy';
const TEST_ORG_ID = 'KQe1cbaUZ7JocUTDbvhi';
const TEST_USER_ID = 'Fy665OWJrkgB6oayuoOkZ8M28Hz2';
const TEST_ASSIGNEE_ID = 'Fy665OWJrkgB6oayuoOkZ8M28Hz2'; // tanish mantri

async function testAssigneeUpdate() {
  console.log('🔧 TESTING ASSIGNEE UPDATE FUNCTIONALITY');
  console.log('============================================================');

  // Test 1: Check current task state
  console.log('\n1. Checking current task state...');
  console.log('-----------------------------------');

  try {
    const response = await fetch(`${BASE_URL}/api/task-direct/${TEST_TASK_ID}?userId=${TEST_USER_ID}&organizationId=${TEST_ORG_ID}&projectId=${TEST_PROJECT_ID}`);
    const taskData = await response.json();

    if (response.ok) {
      console.log('✅ Task loaded successfully');
      console.log('📋 Current task state:');
      console.log('  - Task ID:', taskData.id);
      console.log('  - Title:', taskData.title);
      console.log('  - Current assigneeId:', taskData.assigneeId);
      console.log('  - Current assigneeName:', taskData.assigneeName);
      console.log('  - Has assignee data:', !!(taskData.assigneeId && taskData.assigneeId !== 'unassigned'));
    } else {
      console.log('❌ Failed to load task:', taskData.error);
      return;
    }

    // Test 2: Update assignee to unassigned
    console.log('\n2. Testing assignee update (assign to unassigned)...');
    console.log('----------------------------------------------------');

    const updateResponse = await fetch(`${BASE_URL}/api/tasks/${TEST_TASK_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assigneeId: 'unassigned',
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
      }),
    });

    const updateResult = await updateResponse.json();

    if (updateResponse.ok) {
      console.log('✅ Assignee update successful');
      console.log('📋 Updated task data:');
      console.log('  - New assigneeId:', updateResult.task.assigneeId);
      console.log('  - Updated at:', updateResult.task.updatedAt);
    } else {
      console.log('❌ Failed to update assignee:', updateResult.error);
    }

    // Test 3: Re-assign to original assignee
    console.log('\n3. Testing re-assignment to original assignee...');
    console.log('--------------------------------------------------');

    const reassignResponse = await fetch(`${BASE_URL}/api/tasks/${TEST_TASK_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assigneeId: TEST_ASSIGNEE_ID,
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
        projectId: TEST_PROJECT_ID,
      }),
    });

    const reassignResult = await reassignResponse.json();

    if (reassignResponse.ok) {
      console.log('✅ Re-assignment successful');
      console.log('📋 Re-assigned task data:');
      console.log('  - New assigneeId:', reassignResult.task.assigneeId);
      console.log('  - Updated at:', reassignResult.task.updatedAt);
    } else {
      console.log('❌ Failed to re-assign:', reassignResult.error);
    }

    // Test 4: Verify final state
    console.log('\n4. Verifying final task state...');
    console.log('---------------------------------');

    const finalResponse = await fetch(`${BASE_URL}/api/task-direct/${TEST_TASK_ID}?userId=${TEST_USER_ID}&organizationId=${TEST_ORG_ID}&projectId=${TEST_PROJECT_ID}`);
    const finalData = await finalResponse.json();

    if (finalResponse.ok) {
      console.log('✅ Final verification successful');
      console.log('📋 Final task state:');
      console.log('  - Final assigneeId:', finalData.assigneeId);
      console.log('  - Final assigneeName:', finalData.assigneeName);
      console.log('  - Has assignee data:', !!(finalData.assigneeId && finalData.assigneeId !== 'unassigned'));
    } else {
      console.log('❌ Failed to verify final state:', finalData.error);
    }

    // Test 5: Check workload API
    console.log('\n5. Testing workload API...');
    console.log('---------------------------');

    const workloadResponse = await fetch(`${BASE_URL}/api/analytics/member-workload?projectId=${TEST_PROJECT_ID}&memberId=${TEST_ASSIGNEE_ID}`);
    const workloadData = await workloadResponse.json();

    if (workloadResponse.ok) {
      console.log('✅ Workload API working');
      console.log('📋 Workload data:');
      console.log('  - Assigned tasks:', workloadData.assignedTasks);
      console.log('  - Task limit:', workloadData.taskLimit);
      console.log('  - Workload percentage:', workloadData.workloadPercentage);
      console.log('  - Is at limit:', workloadData.assignedTasks >= workloadData.taskLimit);
    } else {
      console.log('❌ Workload API failed:', workloadData.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n============================================================');
  console.log('🎯 TEST SUMMARY:');
  console.log('If all tests passed, assignee updates should work correctly.');
  console.log('The workload should update automatically when assignments change.');
  console.log('============================================================');
}

// Run the test
testAssigneeUpdate().catch(console.error);
