// Fixed debug script to test the correct task detail API
// Run this in browser console when you have the task edit dialog open

(async function debugTaskDetailAPI() {
  console.log('🔧 TASK DETAIL API DEBUG - FIXED VERSION');
  console.log('=' .repeat(60));

  const projectId = window.location.pathname.split('/')[2];
  const orgId = 'KQe1cbaUZ7JocUTDbvhi';

  console.log(`🎯 Project: ${projectId}`);
  console.log(`🏢 Organization: ${orgId}`);

  try {
    // Step 1: Test the CORRECT task detail API that the edit dialog uses
    console.log('\n📋 STEP 1: Testing the actual task detail API...');

    // Look for task title in the current page to get the task ID
    let taskId = null;

    // Try to find task ID from URL if we're in a task detail view
    if (window.location.hash) {
      const hashMatch = window.location.hash.match(/task[=\/]([a-zA-Z0-9]+)/);
      if (hashMatch) {
        taskId = hashMatch[1];
      }
    }

    // Try to find task ID from dialog elements
    if (!taskId) {
      const dialogElements = document.querySelectorAll('[role="dialog"] input[value], [role="dialog"] h1, [role="dialog"] h2');
      for (const element of dialogElements) {
        if (element.value === 'j' || element.textContent === 'j') {
          // Found the task, but we need the ID
          console.log('🎯 Found task "j" in dialog, but need to extract ID');
          break;
        }
      }
    }

    // If we can't find the exact task ID, let's test the board API instead
    console.log('\n📋 STEP 2: Testing board API (where tasks actually come from)...');

    const boardUrl = `/api/board/${projectId}?userId=Fy665OWJrkgB6oayuoOkZ8M28Hz2&organizationId=${orgId}&t=${Date.now()}`;
    console.log(`🔗 Board URL: ${boardUrl}`);

    const boardResponse = await fetch(boardUrl);
    console.log(`📡 Board Response Status: ${boardResponse.status}`);

    if (boardResponse.ok) {
      const boardData = await boardResponse.json();
      console.log('📊 Board data structure:', {
        hasBoard: !!boardData.board,
        hasColumns: !!boardData.columns,
        columnsCount: boardData.columns?.length || 0,
        boardKeys: Object.keys(boardData.board || {})
      });

      // Extract all tasks from all columns
      let allTasks = [];
      if (boardData.board) {
        Object.values(boardData.board).forEach(column => {
          if (column.tasks) {
            allTasks = allTasks.concat(column.tasks);
          }
        });
      }

      console.log(`📝 Found ${allTasks.length} tasks in board API`);

      // Look for our task "j"
      const taskJ = allTasks.find(task => task.title === 'j');
      if (taskJ) {
        console.log('🎯 FOUND TASK "j" IN BOARD API!');
        console.log('🔍 Task "j" data:', {
          id: taskJ.id,
          title: taskJ.title,
          assigneeId: taskJ.assigneeId,
          assigneeName: taskJ.assigneeName,
          assignee: taskJ.assignee,
          hasAssigneeId: !!taskJ.assigneeId,
          assigneeIdType: typeof taskJ.assigneeId,
          fullTask: taskJ
        });

        // Now test the task detail API with the actual task ID
        console.log('\n🎯 STEP 3: Testing task detail API with real task ID...');

        const taskDetailUrl = `/api/task-details/${taskJ.id}?t=${Date.now()}`;
        console.log(`🔗 Task Detail URL: ${taskDetailUrl}`);

        const taskDetailResponse = await fetch(taskDetailUrl);
        console.log(`📡 Task Detail Response Status: ${taskDetailResponse.status}`);

        if (taskDetailResponse.ok) {
          const taskDetailData = await taskDetailResponse.json();
          console.log('📋 Task detail API data:', {
            id: taskDetailData.id,
            title: taskDetailData.title,
            assigneeId: taskDetailData.assigneeId,
            assigneeName: taskDetailData.assigneeName,
            assignee: taskDetailData.assignee,
            hasAssigneeId: !!taskDetailData.assigneeId,
            assigneeIdType: typeof taskDetailData.assigneeId,
            fullData: taskDetailData
          });

          console.log('\n🔍 COMPARISON: Board API vs Task Detail API');
          console.log('Board assigneeId:', taskJ.assigneeId);
          console.log('Detail assigneeId:', taskDetailData.assigneeId);
          console.log('Match:', taskJ.assigneeId === taskDetailData.assigneeId);
        } else {
          console.error('❌ Task detail API failed:', taskDetailResponse.status);
        }
      } else {
        console.warn('⚠️ Task "j" not found in board API');

        // Show all tasks for debugging
        console.log('📝 All tasks found:');
        allTasks.forEach((task, index) => {
          console.log(`Task ${index + 1}:`, {
            id: task.id,
            title: task.title,
            assigneeId: task.assigneeId,
            hasAssignee: !!task.assigneeId
          });
        });
      }
    } else {
      console.error('❌ Board API failed:', boardResponse.status);
    }

    // Step 4: Test Firebase direct access
    console.log('\n🔥 STEP 4: Testing Firebase direct access...');

    if (typeof window.firebase !== 'undefined' && window.firebase.firestore) {
      console.log('🔥 Firebase available, checking project document...');

      const db = window.firebase.firestore();
      const projectDoc = await db.collection('projects').doc(projectId).get();

      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        console.log('🔥 Firebase project data:', {
          name: projectData.name,
          ownerId: projectData.ownerId,
          members: projectData.members,
          organizationId: projectData.organizationId
        });

        // Check for tasks in Firebase
        const tasksQuery = db.collection('tasks').where('projectId', '==', projectId);
        const tasksSnapshot = await tasksQuery.get();

        console.log(`🔥 Firebase tasks: ${tasksSnapshot.size} found`);

        tasksSnapshot.forEach(doc => {
          const taskData = doc.data();
          console.log(`Firebase task:`, {
            id: doc.id,
            title: taskData.title,
            assigneeId: taskData.assigneeId,
            projectId: taskData.projectId
          });
        });
      }
    } else {
      console.log('🔥 Firebase not available in browser');
    }

    // Step 5: Test members API to cross-reference
    console.log('\n👥 STEP 5: Cross-referencing with members...');

    const membersUrl = `/api/projects/${projectId}/members?organizationId=${orgId}&t=${Date.now()}`;
    const membersResponse = await fetch(membersUrl);

    if (membersResponse.ok) {
      const members = await membersResponse.json();
      console.log('👥 Available members:');
      members.forEach(member => {
        console.log(`- ${member.name} (${member.id})`);
      });

      // Check if the assigneeId from the task matches any member
      if (allTasks.length > 0) {
        const taskJ = allTasks.find(task => task.title === 'j');
        if (taskJ && taskJ.assigneeId) {
          const matchingMember = members.find(m => m.id === taskJ.assigneeId);
          console.log('🔍 AssigneeId match check:', {
            taskAssigneeId: taskJ.assigneeId,
            foundMember: matchingMember ? matchingMember.name : 'NOT FOUND',
            memberExists: !!matchingMember
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }

  console.log('\n🎯 DIAGNOSIS SUMMARY');
  console.log('==================');
  console.log('1. Board API - Where task cards get their data');
  console.log('2. Task Detail API - Where edit dialog gets data');
  console.log('3. Firebase - Original data source');
  console.log('4. Members API - Available assignees');
  console.log('\n💡 The issue is likely:');
  console.log('   → Board API and Task Detail API returning different data');
  console.log('   → Task exists in Firebase but not in organization database');
  console.log('   → AssigneeId mismatch between data sources');

})();
