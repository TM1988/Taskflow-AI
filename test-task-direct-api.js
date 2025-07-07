// Test script to verify the fixed task-direct API
// Run this in browser console to test if assigneeId is now included

(async function testTaskDirectAPI() {
  console.log('🧪 TESTING FIXED TASK-DIRECT API');
  console.log('=' .repeat(50));

  const projectId = window.location.pathname.split('/')[2];
  const orgId = 'KQe1cbaUZ7JocUTDbvhi';
  const userId = 'Fy665OWJrkgB6oayuoOkZ8M28Hz2';

  console.log(`🎯 Project: ${projectId}`);
  console.log(`🏢 Organization: ${orgId}`);
  console.log(`👤 User: ${userId}`);

  try {
    // Step 1: Get the task from Board API to get the task ID
    console.log('\n📋 STEP 1: Getting task from Board API...');

    const boardUrl = `/api/board/${projectId}?userId=${userId}&organizationId=${orgId}&t=${Date.now()}`;
    const boardResponse = await fetch(boardUrl);

    if (boardResponse.ok) {
      const boardData = await boardResponse.json();

      // Extract all tasks
      let allTasks = [];
      if (boardData.board) {
        Object.values(boardData.board).forEach(column => {
          if (column.tasks) {
            allTasks = allTasks.concat(column.tasks);
          }
        });
      }

      const taskJ = allTasks.find(task => task.title === 'j');

      if (taskJ) {
        console.log('✅ Found task "j" in Board API:', {
          id: taskJ.id,
          title: taskJ.title,
          assigneeId: taskJ.assigneeId,
          hasAssigneeId: !!taskJ.assigneeId
        });

        // Step 2: Test the FIXED task-direct API
        console.log('\n🔧 STEP 2: Testing FIXED task-direct API...');

        const taskDirectUrl = `/api/task-direct/${taskJ.id}?userId=${userId}&organizationId=${orgId}&projectId=${projectId}&t=${Date.now()}`;
        console.log(`🔗 Task Direct URL: ${taskDirectUrl}`);

        const taskDirectResponse = await fetch(taskDirectUrl);
        console.log(`📡 Response Status: ${taskDirectResponse.status}`);

        if (taskDirectResponse.ok) {
          const taskDirectData = await taskDirectResponse.json();

          console.log('✅ Task-direct API SUCCESS!');
          console.log('📋 Response data:', {
            id: taskDirectData.id,
            title: taskDirectData.title,
            assigneeId: taskDirectData.assigneeId,
            tags: taskDirectData.tags,
            hasAssigneeId: !!taskDirectData.assigneeId,
            assigneeIdType: typeof taskDirectData.assigneeId,
            fullResponse: taskDirectData
          });

          // Step 3: Compare Board API vs Task-direct API
          console.log('\n🔍 STEP 3: Comparing APIs...');

          const comparison = {
            boardAssigneeId: taskJ.assigneeId,
            taskDirectAssigneeId: taskDirectData.assigneeId,
            match: taskJ.assigneeId === taskDirectData.assigneeId,
            boardHasAssignee: !!taskJ.assigneeId,
            taskDirectHasAssignee: !!taskDirectData.assigneeId,
            bothHaveAssignee: !!taskJ.assigneeId && !!taskDirectData.assigneeId
          };

          console.log('📊 Comparison:', comparison);

          if (comparison.match && comparison.bothHaveAssignee) {
            console.log('🎉 SUCCESS! Both APIs return the same assigneeId');
            console.log('✅ The fix is working correctly');
          } else if (!comparison.taskDirectHasAssignee) {
            console.log('❌ STILL BROKEN: Task-direct API not returning assigneeId');
          } else {
            console.log('⚠️ MISMATCH: APIs return different assigneeIds');
          }

          // Step 4: Test if this fixes the dropdown
          console.log('\n🔽 STEP 4: Testing dropdown fix...');

          console.log('💡 To test dropdown:');
          console.log('1. Close and reopen the task edit dialog');
          console.log('2. The assignee dropdown should now show the correct assignee');
          console.log('3. Check browser console for assignee dropdown debug logs');

        } else {
          const errorText = await taskDirectResponse.text();
          console.error('❌ Task-direct API failed:', {
            status: taskDirectResponse.status,
            error: errorText
          });
        }

      } else {
        console.error('❌ Task "j" not found in Board API');
      }
    } else {
      console.error('❌ Board API failed:', boardResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n🎯 TEST SUMMARY');
  console.log('===============');
  console.log('This test checks if the task-direct API now includes assigneeId');
  console.log('If successful, the edit dialog should show the correct assignee');
  console.log('The assignee dropdown debug logs will show the correct selectedAssigneeId');

})();
