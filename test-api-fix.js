const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TASK_ID = '686aa7bbf1a5fc187c967fb9';
const TEST_PROJECT_ID = 'jH3pRvdw2dwYTCyh9Njy';
const TEST_ORG_ID = 'KQe1cbaUZ7JocUTDbvhi';
const TEST_USER_ID = 'Fy665OWJrkgB6oayuoOkZ8M28Hz2';

async function testTaskDetailAPI() {
  console.log('🔧 TESTING TASK DETAIL API FIXES');
  console.log('============================================================');

  // Test 1: task-direct API (used by task edit dialog)
  console.log('\n1. Testing /api/task-direct/[taskId] (Task Edit Dialog)');
  console.log('---------------------------------------------------');

  const directApiUrl = `${BASE_URL}/api/task-direct/${TEST_TASK_ID}?userId=${TEST_USER_ID}&organizationId=${TEST_ORG_ID}&projectId=${TEST_PROJECT_ID}`;

  try {
    const response = await fetch(directApiUrl);
    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Task-direct API working!');
      console.log('📋 Assignee Data Check:');
      console.log('  - assigneeId:', data.assigneeId);
      console.log('  - assigneeName:', data.assigneeName);
      console.log('  - assignee object:', data.assignee);
      console.log('  - Has assignee data:', !!(data.assigneeId && data.assigneeId !== 'unassigned'));
    } else {
      console.log('❌ Task-direct API failed');
    }
  } catch (error) {
    console.log('❌ Error testing task-direct API:', error.message);
  }

  // Test 2: task-details API (alternative endpoint)
  console.log('\n2. Testing /api/board/task-details/[taskId] (Alternative Endpoint)');
  console.log('-----------------------------------------------------------');

  const taskDetailsApiUrl = `${BASE_URL}/api/board/task-details/${TEST_TASK_ID}?userId=${TEST_USER_ID}&organizationId=${TEST_ORG_ID}&projectId=${TEST_PROJECT_ID}`;

  try {
    const response = await fetch(taskDetailsApiUrl);
    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Task-details API working!');
      console.log('📋 Assignee Data Check:');
      console.log('  - assigneeId:', data.assigneeId);
      console.log('  - assigneeName:', data.assigneeName);
      console.log('  - assignee object:', data.assignee);
      console.log('  - Has assignee data:', !!(data.assigneeId && data.assigneeId !== 'unassigned'));
    } else {
      console.log('❌ Task-details API failed');
    }
  } catch (error) {
    console.log('❌ Error testing task-details API:', error.message);
  }

  // Test 3: Board API (for comparison - should work)
  console.log('\n3. Testing /api/board/[projectId] (Board API - Should Work)');
  console.log('----------------------------------------------------');

  const boardApiUrl = `${BASE_URL}/api/board/${TEST_PROJECT_ID}?userId=${TEST_USER_ID}&organizationId=${TEST_ORG_ID}`;

  try {
    const response = await fetch(boardApiUrl);
    const data = await response.json();

    console.log('Status:', response.status);

    if (response.ok) {
      console.log('✅ Board API working!');

      // Find our test task in the board data
      let foundTask = null;
      for (const column of Object.values(data.board)) {
        foundTask = column.tasks.find(task => task.id === TEST_TASK_ID);
        if (foundTask) break;
      }

      if (foundTask) {
        console.log('📋 Task Found in Board - Assignee Data Check:');
        console.log('  - assigneeId:', foundTask.assigneeId);
        console.log('  - assigneeName:', foundTask.assigneeName);
        console.log('  - assignee object:', foundTask.assignee);
        console.log('  - Has assignee data:', !!(foundTask.assigneeId && foundTask.assigneeId !== 'unassigned'));
      } else {
        console.log('❌ Test task not found in board data');
      }
    } else {
      console.log('❌ Board API failed');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Error testing board API:', error.message);
  }

  console.log('\n============================================================');
  console.log('🎯 SUMMARY:');
  console.log('If all APIs return assigneeId data, the assignee dropdown should work!');
  console.log('The task edit dialog uses the task-direct API, so that\'s the critical one.');
  console.log('============================================================');
}

// Run the test
testTaskDetailAPI().catch(console.error);
