// EMERGENCY DEBUG: Check assigneeId in database
// Run this in browser console to see what's actually in the database

(async function emergencyAssigneeDebug() {
  console.log('🚨 EMERGENCY ASSIGNEE DEBUG');
  console.log('=' .repeat(50));

  const projectId = window.location.pathname.split('/')[2];
  const orgId = 'KQe1cbaUZ7JocUTDbvhi';

  console.log(`🎯 Project: ${projectId}`);
  console.log(`🏢 Organization: ${orgId}`);

  try {
    // Step 1: Get ALL tasks for this project
    console.log('\n📋 STEP 1: Getting ALL project tasks...');

    const tasksUrl = `/api/tasks?projectId=${projectId}&organizationId=${orgId}&t=${Date.now()}`;
    console.log(`🔗 Tasks URL: ${tasksUrl}`);

    const tasksResponse = await fetch(tasksUrl);
    console.log(`📡 Tasks Response Status: ${tasksResponse.status}`);

    if (tasksResponse.ok) {
      const tasks = await tasksResponse.json();
      console.log(`📊 Found ${tasks.length} tasks`);

      // Check each task for assigneeId
      tasks.forEach((task, index) => {
        console.log(`\n📝 Task ${index + 1}:`, {
          id: task.id,
          title: task.title,
          assigneeId: task.assigneeId,
          assigneeName: task.assigneeName,
          assignee: task.assignee,
          hasAssigneeId: !!task.assigneeId,
          assigneeIdType: typeof task.assigneeId,
          assigneeIdIsUnassigned: task.assigneeId === 'unassigned',
          assigneeIdIsNull: task.assigneeId === null,
          assigneeIdIsUndefined: task.assigneeId === undefined
        });

        // Special check for the task with title 'j'
        if (task.title === 'j') {
          console.log('🎯 FOUND THE "j" TASK!');
          console.log('🔍 Full task data:', task);
          console.log('🔍 AssigneeId analysis:', {
            value: task.assigneeId,
            type: typeof task.assigneeId,
            stringified: JSON.stringify(task.assigneeId),
            truthiness: !!task.assigneeId,
            exactMatch: task.assigneeId === 'unassigned',
            isString: typeof task.assigneeId === 'string',
            length: task.assigneeId?.length
          });
        }
      });
    } else {
      console.error('❌ Failed to fetch tasks:', tasksResponse.status);
    }

    // Step 2: Get project members to compare
    console.log('\n👥 STEP 2: Getting project members...');

    const membersUrl = `/api/projects/${projectId}/members?organizationId=${orgId}&t=${Date.now()}`;
    console.log(`🔗 Members URL: ${membersUrl}`);

    const membersResponse = await fetch(membersUrl);
    console.log(`📡 Members Response Status: ${membersResponse.status}`);

    if (membersResponse.ok) {
      const members = await membersResponse.json();
      console.log(`👥 Found ${members.length} members`);

      members.forEach((member, index) => {
        console.log(`Member ${index + 1}:`, {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role
        });
      });

      // Check if any task assigneeId matches member IDs
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        const memberIds = members.map(m => m.id);

        console.log('\n🔍 STEP 3: Cross-referencing task assignees with members...');
        tasks.forEach(task => {
          if (task.assigneeId && task.assigneeId !== 'unassigned') {
            const memberExists = memberIds.includes(task.assigneeId);
            console.log(`Task "${task.title}" assigneeId "${task.assigneeId}" - Member exists: ${memberExists}`);

            if (memberExists) {
              const member = members.find(m => m.id === task.assigneeId);
              console.log(`  → Assigned to: ${member.name} (${member.email})`);
            }
          }
        });
      }
    } else {
      console.error('❌ Failed to fetch members:', membersResponse.status);
    }

    // Step 3: Direct task fetch test
    console.log('\n🎯 STEP 4: Testing individual task fetch...');

    // Try to find a task ID to test direct fetch
    if (tasksResponse.ok) {
      const tasks = await tasksResponse.json();
      const testTask = tasks.find(t => t.title === 'j');

      if (testTask) {
        console.log(`🔍 Testing direct fetch for task: ${testTask.id}`);

        const directUrl = `/api/task-details/${testTask.id}?t=${Date.now()}`;
        console.log(`🔗 Direct URL: ${directUrl}`);

        const directResponse = await fetch(directUrl);
        console.log(`📡 Direct Response Status: ${directResponse.status}`);

        if (directResponse.ok) {
          const directTask = await directResponse.json();
          console.log('🎯 Direct task fetch result:', {
            id: directTask.id,
            title: directTask.title,
            assigneeId: directTask.assigneeId,
            assigneeName: directTask.assigneeName,
            assignee: directTask.assignee,
            rawData: directTask
          });

          console.log('🔍 Comparing direct vs list fetch:');
          console.log('List fetch assigneeId:', testTask.assigneeId);
          console.log('Direct fetch assigneeId:', directTask.assigneeId);
          console.log('Match:', testTask.assigneeId === directTask.assigneeId);
        }
      }
    }

    // Step 4: Check what the UI thinks
    console.log('\n🖼️ STEP 5: Checking UI state...');

    // Look for task cards showing assignment
    const taskCards = document.querySelectorAll('[class*="card"], [class*="task"]');
    let uiAssignments = [];

    taskCards.forEach(card => {
      if (card.textContent && card.textContent.includes('Assigned to')) {
        const text = card.textContent;
        const match = text.match(/Assigned to ([^]+?)(?:\n|$)/);
        if (match) {
          uiAssignments.push(match[1].trim());
        }
      }
    });

    console.log('🖼️ UI shows these assignments:', uiAssignments);

  } catch (error) {
    console.error('❌ Emergency debug error:', error);
  }

  console.log('\n🎯 SUMMARY');
  console.log('=========');
  console.log('1. Check if the "j" task has assigneeId in the database');
  console.log('2. Check if the assigneeId matches a real member ID');
  console.log('3. Check if direct fetch vs list fetch return different data');
  console.log('4. Compare what DB says vs what UI shows');
  console.log('\n💡 If assigneeId exists in DB but dropdown shows "Unassigned":');
  console.log('   → The issue is in the dropdown component receiving/processing the ID');
  console.log('\n💡 If assigneeId is missing/null in DB:');
  console.log('   → The issue is in task creation/update not saving assigneeId');

})();
