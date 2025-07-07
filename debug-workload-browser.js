// Browser Debug Script for Workload Testing
// Open browser console and paste this script to test workload functionality

(function() {
  console.log('🔧 WORKLOAD DEBUG SCRIPT - BROWSER VERSION');
  console.log('============================================================');

  // Configuration - adjust these based on your current project
  const CONFIG = {
    projectId: 'jH3pRvdw2dwYTCyh9Njy',
    organizationId: 'KQe1cbaUZ7JocUTDbvhi',
    userId: 'Fy665OWJrkgB6oayuoOkZ8M28Hz2',
    memberId: 'Fy665OWJrkgB6oayuoOkZ8M28Hz2' // tanish mantri
  };

  async function testWorkloadUpdates() {
    try {
      console.log('\n1. Testing Board API...');
      console.log('------------------------');

      const boardResponse = await fetch(`/api/board/${CONFIG.projectId}?userId=${CONFIG.userId}&organizationId=${CONFIG.organizationId}`);
      const boardData = await boardResponse.json();

      if (boardResponse.ok) {
        console.log('✅ Board API working');

        let assignedToMember = 0;
        for (const [columnId, column] of Object.entries(boardData.board)) {
          column.tasks.forEach(task => {
            if (task.assigneeId === CONFIG.memberId) {
              assignedToMember++;
              console.log(`  ✓ Task "${task.title}" assigned to member`);
            }
          });
        }
        console.log(`📊 Total tasks assigned to member: ${assignedToMember}`);
      } else {
        console.log('❌ Board API failed:', boardData.error);
      }

      console.log('\n2. Testing Workload API...');
      console.log('---------------------------');

      const workloadResponse = await fetch(`/api/analytics/member-workload?projectId=${CONFIG.projectId}&memberId=${CONFIG.memberId}&organizationId=${CONFIG.organizationId}`);
      const workloadData = await workloadResponse.json();

      if (workloadResponse.ok) {
        console.log('✅ Workload API working');
        console.log('📊 Workload data:', {
          assignedTasks: workloadData.assignedTasks,
          taskLimit: workloadData.taskLimit,
          workloadPercentage: workloadData.workloadPercentage,
          completedThisWeek: workloadData.completedThisWeek,
          overdueTasks: workloadData.overdueTasks
        });

        if (workloadData.tasks && workloadData.tasks.length > 0) {
          console.log('📝 Tasks found:');
          workloadData.tasks.forEach(task => {
            console.log(`  - ${task.title} (${task.status})`);
          });
        } else {
          console.log('⚠️ No tasks found in workload response');
        }
      } else {
        console.log('❌ Workload API failed:', workloadData.error);
      }

      console.log('\n3. Testing Members API...');
      console.log('--------------------------');

      const membersResponse = await fetch(`/api/projects/${CONFIG.projectId}/members?organizationId=${CONFIG.organizationId}`);
      const membersData = await membersResponse.json();

      if (membersResponse.ok) {
        console.log('✅ Members API working');
        const testMember = membersData.find(member => member.id === CONFIG.memberId);
        if (testMember) {
          console.log(`✓ Member found: ${testMember.name}`);
        } else {
          console.log('❌ Member not found in project');
        }
      } else {
        console.log('❌ Members API failed:', membersData.error);
      }

      console.log('\n4. Triggering Workload Refresh...');
      console.log('----------------------------------');

      // Dispatch workload change event
      window.dispatchEvent(new CustomEvent('workloadChanged', {
        detail: { projectId: CONFIG.projectId }
      }));
      console.log('✅ Workload change event dispatched');

      console.log('\n5. Testing Team Workload Component...');
      console.log('--------------------------------------');

      // Check if team workload component exists
      const teamWorkloadElement = document.querySelector('[data-testid="team-workload"], .team-workload, [class*="team-workload"]');
      if (teamWorkloadElement) {
        console.log('✅ Team workload component found in DOM');
      } else {
        console.log('⚠️ Team workload component not found in DOM (might not be on current page)');
      }

      console.log('\n============================================================');
      console.log('🎯 WORKLOAD DEBUG SUMMARY');
      console.log('============================================================');
      console.log('Check the console output above to identify any issues.');
      console.log('If workload is still showing 0, check:');
      console.log('1. Database connection (organization vs user database)');
      console.log('2. Task assignment IDs match exactly');
      console.log('3. Project ID and organization ID are correct');
      console.log('4. Member exists in project members list');
      console.log('============================================================');

    } catch (error) {
      console.error('❌ Debug script failed:', error);
    }
  }

  // Function to manually refresh workload
  window.refreshWorkload = function() {
    console.log('🔄 Manual workload refresh triggered');
    window.dispatchEvent(new CustomEvent('workloadChanged', {
      detail: { projectId: CONFIG.projectId }
    }));
  };

  // Function to test assignee dropdown
  window.testAssigneeDropdown = async function() {
    console.log('🔽 Testing assignee dropdown workload data...');

    // Simulate what the assignee dropdown does
    const membersResponse = await fetch(`/api/projects/${CONFIG.projectId}/members?organizationId=${CONFIG.organizationId}&t=${Date.now()}`);
    const members = await membersResponse.json();

    for (const member of members) {
      const workloadResponse = await fetch(`/api/analytics/member-workload?projectId=${CONFIG.projectId}&memberId=${member.id}&organizationId=${CONFIG.organizationId}`);
      const workloadData = await workloadResponse.json();

      if (workloadResponse.ok) {
        const isAtLimit = workloadData.assignedTasks >= workloadData.taskLimit;
        console.log(`👤 ${member.name}: ${workloadData.assignedTasks}/${workloadData.taskLimit} tasks (${workloadData.workloadPercentage}%) ${isAtLimit ? '🚫 AT LIMIT' : '✅ Available'}`);
      } else {
        console.log(`👤 ${member.name}: Failed to get workload data`);
      }
    }
  };

  // Run the main test
  testWorkloadUpdates();

  console.log('\n💡 Available functions:');
  console.log('- refreshWorkload() - Manually trigger workload refresh');
  console.log('- testAssigneeDropdown() - Test assignee dropdown workload data');

})();
