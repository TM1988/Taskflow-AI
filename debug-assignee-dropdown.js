// Debug script to test assignee dropdown loading issues
// Run this in browser console when you have a task dialog open

(async function debugAssigneeDropdown() {
  console.log('🔍 DEBUGGING ASSIGNEE DROPDOWN LOADING');
  console.log('=' .repeat(50));

  // Get project ID from URL
  const projectId = window.location.pathname.split('/')[2];
  const orgId = 'KQe1cbaUZ7JocUTDbvhi'; // Your org ID

  console.log(`🎯 Project ID: ${projectId}`);
  console.log(`🏢 Organization ID: ${orgId}`);

  // Test 1: Check if members API is working
  console.log('\n📡 Test 1: Members API Response');
  try {
    const membersUrl = `/api/projects/${projectId}/members?organizationId=${orgId}&t=${Date.now()}`;
    const response = await fetch(membersUrl);
    const members = await response.json();

    console.log('✅ Members API Response:', {
      status: response.status,
      memberCount: members.length,
      members: members.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        email: m.email
      }))
    });
  } catch (error) {
    console.error('❌ Members API Error:', error);
  }

  // Test 2: Check task data
  console.log('\n📋 Test 2: Task Data Check');

  // Look for task data in the page
  const taskTitleElements = document.querySelectorAll('input[placeholder*="task" i], input[value*="task" i]');
  const assigneeDropdowns = document.querySelectorAll('[data-testid="assignee-dropdown"], button:has(svg)');

  console.log('🔍 Found elements:', {
    taskInputs: taskTitleElements.length,
    assigneeDropdowns: assigneeDropdowns.length
  });

  // Try to find React component data
  const taskDialogs = document.querySelectorAll('[role="dialog"], .task-detail, .task-dialog');

  if (taskDialogs.length > 0) {
    console.log('📝 Found task dialog elements:', taskDialogs.length);

    // Look for any text that might be assignee IDs
    const dialogText = Array.from(taskDialogs).map(dialog => dialog.textContent).join(' ');
    const possibleAssigneeIds = dialogText.match(/[a-zA-Z0-9]{20,}/g) || [];

    console.log('🔍 Possible assignee IDs in dialog:', possibleAssigneeIds);
  }

  // Test 3: Check localStorage/sessionStorage for cached data
  console.log('\n💾 Test 3: Cache Check');

  const storageKeys = Object.keys(localStorage).filter(key =>
    key.includes('assignee') ||
    key.includes('member') ||
    key.includes('task') ||
    key.includes(projectId)
  );

  console.log('🗃️ Relevant storage keys:', storageKeys);

  storageKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(`📦 ${key}:`, JSON.parse(value || '{}'));
    } catch (e) {
      console.log(`📦 ${key}:`, value);
    }
  });

  // Test 4: Check if assignee dropdown cache exists
  console.log('\n🔄 Test 4: Assignee Dropdown Cache');

  // Try to access the cache programmatically
  if (window.clearAssigneeCache) {
    console.log('✅ clearAssigneeCache function exists');

    // Get current cache state
    console.log('🧹 Clearing cache for debugging...');
    window.clearAssigneeCache(projectId);

    console.log('✅ Cache cleared');
  } else {
    console.log('❌ clearAssigneeCache function not found');
  }

  // Test 5: Simulate task with assignee
  console.log('\n🧪 Test 5: Create Test Task with Assignee');

  try {
    // Get the first member ID for testing
    const membersUrl = `/api/projects/${projectId}/members?organizationId=${orgId}`;
    const membersResponse = await fetch(membersUrl);
    const members = await membersResponse.json();

    if (members.length > 0) {
      const testAssigneeId = members[0].id;
      console.log(`🎯 Testing with assignee ID: ${testAssigneeId}`);
      console.log(`👤 Assignee name: ${members[0].name}`);

      // Check if this ID would be recognized by the dropdown
      const testTask = {
        id: 'test-task-' + Date.now(),
        title: 'Debug Test Task',
        assigneeId: testAssigneeId,
        projectId: projectId
      };

      console.log('📋 Test task object:', testTask);

      // Try to find if there's a way to test the dropdown directly
      const dropdownButtons = document.querySelectorAll('button');
      const assigneeButton = Array.from(dropdownButtons).find(btn =>
        btn.textContent &&
        (btn.textContent.includes('Unassigned') ||
         btn.textContent.includes('assignee') ||
         btn.textContent.includes('Assign'))
      );

      if (assigneeButton) {
        console.log('🎯 Found potential assignee button:', assigneeButton.textContent);
        console.log('🖱️ Try clicking this button to see the dropdown');
      }
    }
  } catch (error) {
    console.error('❌ Test 5 error:', error);
  }

  // Test 6: Check for task edit state
  console.log('\n✏️ Test 6: Task Edit State');

  // Look for form inputs that might contain task data
  const inputs = document.querySelectorAll('input, textarea, select');
  const formData = {};

  inputs.forEach((input, index) => {
    if (input.value && input.value.trim()) {
      const label = input.labels?.[0]?.textContent ||
                   input.placeholder ||
                   input.name ||
                   input.id ||
                   `input-${index}`;
      formData[label] = input.value;
    }
  });

  console.log('📝 Current form data:', formData);

  // Final recommendations
  console.log('\n💡 DEBUGGING RECOMMENDATIONS:');
  console.log('=' .repeat(40));
  console.log('1. Open a task that you know has an assignee');
  console.log('2. Check the browser network tab for API calls');
  console.log('3. Look for any error messages in the console');
  console.log('4. Verify the task actually has assigneeId saved in database');
  console.log('5. Check if the assignee ID matches a real user ID');

  console.log('\n🎯 NEXT STEPS:');
  console.log('- If members API works but dropdown shows "unassigned":');
  console.log('  → The task probably doesn\'t have assigneeId saved');
  console.log('- If assigneeId exists but user not found:');
  console.log('  → The assigneeId might be invalid or user removed');
  console.log('- If dropdown loads but wrong selection:');
  console.log('  → Cache issue or component state problem');

})();
