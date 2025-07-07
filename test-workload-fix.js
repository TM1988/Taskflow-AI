// Updated test script to verify workload API fix
// Run this in browser console on the project page

console.log('🔧 TESTING WORKLOAD API FIX');
console.log('============================================================');

// Configuration - replace with your actual IDs
const CONFIG = {
  projectId: 'jH3pRvdw2dwYTCyh9Njy',
  organizationId: 'KQe1cbaUZ7JocUTDbvhi',
  userId: 'Fy665OWJrkgB6oayuoOkZ8M28Hz2',
  memberId: 'Fy665OWJrkgB6oayuoOkZ8M28Hz2'
};

async function testWorkloadFix() {
  try {
    console.log('\n🔍 BEFORE AND AFTER COMPARISON');
    console.log('==============================');

    // Test Board API (working)
    console.log('\n1. Testing Board API (should work)...');
    const boardResponse = await fetch(`/api/board/${CONFIG.projectId}?userId=${CONFIG.userId}&organizationId=${CONFIG.organizationId}`);
    const boardData = await boardResponse.json();

    let boardAssignedCount = 0;
    if (boardResponse.ok) {
      console.log('✅ Board API working');
      for (const [columnId, column] of Object.entries(boardData.board)) {
        const assignedTasks = column.tasks.filter(t => t.assigneeId === CONFIG.memberId);
        boardAssignedCount += assignedTasks.length;

        if (assignedTasks.length > 0) {
          console.log(`  📋 Column ${columnId}: ${assignedTasks.length} tasks assigned to member`);
          assignedTasks.forEach(task => {
            console.log(`    - "${task.title}" (ID: ${task.id})`);
          });
        }
      }
      console.log(`📊 Board API Total: ${boardAssignedCount} tasks assigned to member`);
    } else {
      console.log('❌ Board API failed:', boardData.error);
      return;
    }

    // Test Fixed Workload API
    console.log('\n2. Testing FIXED Workload API...');
    const workloadResponse = await fetch(`/api/analytics/member-workload?projectId=${CONFIG.projectId}&memberId=${CONFIG.memberId}&organizationId=${CONFIG.organizationId}&userId=${CONFIG.userId}`);
    const workloadData = await workloadResponse.json();

    if (workloadResponse.ok) {
      console.log('✅ Workload API working');
      console.log('📊 Workload API Result:', {
        assignedTasks: workloadData.assignedTasks,
        taskLimit: workloadData.taskLimit,
        workloadPercentage: workloadData.workloadPercentage,
        completedThisWeek: workloadData.completedThisWeek,
        overdueTasks: workloadData.overdueTasks
      });

      if (workloadData.tasks && workloadData.tasks.length > 0) {
        console.log('📝 Tasks found by Workload API:');
        workloadData.tasks.forEach(task => {
          console.log(`  - "${task.title}" (ID: ${task.id}, Status: ${task.status})`);
        });
      } else {
        console.log('⚠️ No tasks found in workload response');
      }

      // CRITICAL COMPARISON
      console.log('\n🎯 CRITICAL COMPARISON:');
      console.log('=======================');
      console.log(`📋 Board API shows: ${boardAssignedCount} tasks assigned to member`);
      console.log(`📊 Workload API shows: ${workloadData.assignedTasks} tasks assigned to member`);

      const isFixed = boardAssignedCount === workloadData.assignedTasks;
      console.log(`${isFixed ? '✅' : '❌'} Match: ${isFixed ? 'YES - FIXED! 🎉' : 'NO - Still broken'}`);

      if (isFixed) {
        console.log('\n🎉 SUCCESS! The workload API is now working correctly!');
        console.log('🔄 Triggering workload refresh event...');

        // Trigger workload refresh
        window.dispatchEvent(new CustomEvent('workloadChanged', {
          detail: { projectId: CONFIG.projectId }
        }));

        console.log('✅ Workload refresh event sent. Check the Team Workload component!');
      } else {
        console.log('\n❌ STILL BROKEN. Check server logs for detailed debugging info.');
      }

    } else {
      console.log('❌ Workload API failed:', workloadData.error);
    }

    // Test workload levels
    if (workloadData && workloadData.workloadPercentage !== undefined) {
      console.log('\n3. Testing Workload Level Calculation...');
      const percentage = workloadData.workloadPercentage;
      let level, color;

      if (percentage < 50) {
        level = 'low';
        color = 'blue';
      } else if (percentage <= 80) {
        level = 'medium';
        color = 'yellow';
      } else {
        level = 'high';
        color = 'red';
      }

      console.log(`📊 Workload: ${percentage}% = ${level.toUpperCase()} (${color})`);
      console.log(`${percentage >= 100 ? '🚫' : '✅'} Can assign more tasks: ${percentage < 100 ? 'YES' : 'NO - AT LIMIT'}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Enhanced member workload test
async function testAllMembersWorkload() {
  console.log('\n4. Testing ALL Team Members Workload...');
  console.log('=======================================');

  try {
    // Get all members
    const membersResponse = await fetch(`/api/projects/${CONFIG.projectId}/members?organizationId=${CONFIG.organizationId}`);
    const members = await membersResponse.json();

    if (membersResponse.ok) {
      console.log(`👥 Found ${members.length} team members`);

      for (const member of members) {
        const workloadResponse = await fetch(`/api/analytics/member-workload?projectId=${CONFIG.projectId}&memberId=${member.id}&organizationId=${CONFIG.organizationId}&userId=${CONFIG.userId}`);
        const workloadData = await workloadResponse.json();

        if (workloadResponse.ok) {
          const isAtLimit = workloadData.assignedTasks >= workloadData.taskLimit;
          const percentage = workloadData.workloadPercentage;
          const emoji = isAtLimit ? '🚫' : percentage > 80 ? '⚠️' : percentage > 50 ? '👍' : '💚';

          console.log(`${emoji} ${member.name}: ${workloadData.assignedTasks}/${workloadData.taskLimit} tasks (${percentage}%) ${isAtLimit ? 'AT LIMIT' : 'Available'}`);
        } else {
          console.log(`❌ ${member.name}: Failed to get workload data`);
        }
      }
    } else {
      console.log('❌ Failed to get team members:', members.error);
    }
  } catch (error) {
    console.error('❌ All members test failed:', error);
  }
}

// Run the tests
console.log('🚀 Starting workload fix verification...');
testWorkloadFix().then(() => {
  return testAllMembersWorkload();
}).then(() => {
  console.log('\n============================================================');
  console.log('🎯 TEST COMPLETE');
  console.log('============================================================');
  console.log('If you see "✅ Match: YES - FIXED! 🎉" above, the issue is resolved!');
  console.log('The Team Workload component should now show correct numbers.');
  console.log('============================================================');
});

// Make functions available globally for manual testing
window.testWorkloadFix = testWorkloadFix;
window.testAllMembersWorkload = testAllMembersWorkload;
window.refreshWorkload = () => {
  window.dispatchEvent(new CustomEvent('workloadChanged', {
    detail: { projectId: CONFIG.projectId }
  }));
  console.log('🔄 Manual workload refresh triggered');
};

console.log('\n💡 Available functions:');
console.log('- testWorkloadFix() - Test the main fix');
console.log('- testAllMembersWorkload() - Test all team members');
console.log('- refreshWorkload() - Manually trigger refresh');
