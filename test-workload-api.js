const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_PROJECT_ID = 'jH3pRvdw2dwYTCyh9Njy';
const TEST_ORG_ID = 'KQe1cbaUZ7JocUTDbvhi';
const TEST_USER_ID = 'Fy665OWJrkgB6oayuoOkZ8M28Hz2';
const TEST_MEMBER_ID = 'Fy665OWJrkgB6oayuoOkZ8M28Hz2'; // tanish mantri

async function testWorkloadAPI() {
  console.log('🔧 TESTING WORKLOAD API');
  console.log('============================================================');

  // Test 1: Check board API to see actual task assignments
  console.log('\n1. Checking board API for task assignments...');
  console.log('----------------------------------------------');

  try {
    const boardResponse = await fetch(`${BASE_URL}/api/board/${TEST_PROJECT_ID}?userId=${TEST_USER_ID}&organizationId=${TEST_ORG_ID}`);
    const boardData = await boardResponse.json();

    if (boardResponse.ok) {
      console.log('✅ Board API working');

      let totalTasks = 0;
      let assignedToMember = 0;

      for (const [columnId, column] of Object.entries(boardData.board)) {
        console.log(`📋 Column ${columnId}: ${column.tasks.length} tasks`);
        totalTasks += column.tasks.length;

        column.tasks.forEach(task => {
          if (task.assigneeId === TEST_MEMBER_ID) {
            assignedToMember++;
            console.log(`  ✓ Task "${task.title}" assigned to member (${task.assigneeId})`);
          } else {
            console.log(`  - Task "${task.title}" assigned to: ${task.assigneeId || 'unassigned'}`);
          }
        });
      }

      console.log(`📊 Summary: ${assignedToMember} tasks assigned to test member out of ${totalTasks} total tasks`);
    } else {
      console.log('❌ Board API failed:', boardData.error);
      return;
    }

    // Test 2: Test workload API without organizationId
    console.log('\n2. Testing workload API without organizationId...');
    console.log('------------------------------------------------');

    const workloadUrl1 = `${BASE_URL}/api/analytics/member-workload?projectId=${TEST_PROJECT_ID}&memberId=${TEST_MEMBER_ID}`;
    const workloadResponse1 = await fetch(workloadUrl1);
    const workloadData1 = await workloadResponse1.json();

    if (workloadResponse1.ok) {
      console.log('✅ Workload API (without org) working');
      console.log('📊 Workload data:', {
        assignedTasks: workloadData1.assignedTasks,
        taskLimit: workloadData1.taskLimit,
        workloadPercentage: workloadData1.workloadPercentage,
        completedThisWeek: workloadData1.completedThisWeek,
        overdueTasks: workloadData1.overdueTasks,
      });
    } else {
      console.log('❌ Workload API (without org) failed:', workloadData1.error);
    }

    // Test 3: Test workload API with organizationId
    console.log('\n3. Testing workload API with organizationId...');
    console.log('----------------------------------------------');

    const workloadUrl2 = `${BASE_URL}/api/analytics/member-workload?projectId=${TEST_PROJECT_ID}&memberId=${TEST_MEMBER_ID}&organizationId=${TEST_ORG_ID}`;
    const workloadResponse2 = await fetch(workloadUrl2);
    const workloadData2 = await workloadResponse2.json();

    if (workloadResponse2.ok) {
      console.log('✅ Workload API (with org) working');
      console.log('📊 Workload data:', {
        assignedTasks: workloadData2.assignedTasks,
        taskLimit: workloadData2.taskLimit,
        workloadPercentage: workloadData2.workloadPercentage,
        completedThisWeek: workloadData2.completedThisWeek,
        overdueTasks: workloadData2.overdueTasks,
      });

      console.log('📝 Tasks found:', workloadData2.tasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority
      })));
    } else {
      console.log('❌ Workload API (with org) failed:', workloadData2.error);
    }

    // Test 4: Test project members API
    console.log('\n4. Testing project members API...');
    console.log('----------------------------------');

    const membersResponse = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/members?organizationId=${TEST_ORG_ID}`);
    const membersData = await membersResponse.json();

    if (membersResponse.ok) {
      console.log('✅ Members API working');
      console.log('👥 Project members:', membersData.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email
      })));

      const testMember = membersData.find(member => member.id === TEST_MEMBER_ID);
      if (testMember) {
        console.log('✓ Test member found in project:', testMember.name);
      } else {
        console.log('❌ Test member NOT found in project members');
      }
    } else {
      console.log('❌ Members API failed:', membersData.error);
    }

    // Test 5: Direct MongoDB query simulation
    console.log('\n5. Database Connection Debug...');
    console.log('------------------------------');

    console.log('🔍 Query parameters that should be used:');
    console.log('  - projectId:', TEST_PROJECT_ID);
    console.log('  - assigneeId:', TEST_MEMBER_ID);
    console.log('  - organizationId:', TEST_ORG_ID);
    console.log('  - Query: { projectId: "' + TEST_PROJECT_ID + '", assigneeId: "' + TEST_MEMBER_ID + '", status: { $ne: "completed" } }');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n============================================================');
  console.log('🎯 DEBUGGING SUMMARY:');
  console.log('1. Check if board API shows assigned tasks correctly');
  console.log('2. Check if workload API finds the same tasks');
  console.log('3. Check if the database connection is correct');
  console.log('4. Check if the query parameters match');
  console.log('============================================================');
}

// Run the test
testWorkloadAPI().catch(console.error);
