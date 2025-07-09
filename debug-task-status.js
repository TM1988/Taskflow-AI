// DEBUG SCRIPT: Check actual task status values
// Node.js version

const BASE_URL = 'http://localhost:3000';

async function debugTaskStatuses() {
  console.log("🔍 DEBUGGING TASK STATUS VALUES");
  console.log("===============================");
  
  const projectId = 'jH3pRvdw2dwYTCyh9Njy';
  const userId = 'Fy665OWJrkgB6oayuoOkZ8M28Hz2';
  const organizationId = 'KQe1cbaUZ7JocUTDbvhi';
  
  try {
    // 1. Test Board API to see actual task statuses
    console.log("\n📊 BOARD API - Checking actual task statuses:");
    const boardResponse = await fetch(`${BASE_URL}/api/board/${projectId}?organizationId=${organizationId}`);
    if (boardResponse.ok) {
      const boardData = await boardResponse.json();
      
      console.log("📋 All tasks from Board API:");
      boardData.columns?.forEach(column => {
        console.log(`\n📁 Column: "${column.name}"`);
        if (column.tasks && column.tasks.length > 0) {
          column.tasks.forEach((task, index) => {
            console.log(`   ${index + 1}. "${task.title}" - Status: "${task.status}" - Column: "${column.name}"`);
          });
        } else {
          console.log(`   (No tasks in this column)`);
        }
      });
    }
    
    // 2. Test Member Workload API to see task details
    console.log("\n⚡ MEMBER WORKLOAD API - Task details:");
    const workloadResponse = await fetch(`${BASE_URL}/api/analytics/member-workload?projectId=${projectId}&memberId=${userId}&organizationId=${organizationId}`);
    if (workloadResponse.ok) {
      const workloadData = await workloadResponse.json();
      
      console.log("📝 Tasks from Member Workload API:");
      workloadData.tasks?.forEach((task, index) => {
        console.log(`   ${index + 1}. "${task.title}" - Status: "${task.status}" - Priority: "${task.priority}"`);
      });
    }
    
    // 3. Call Project Stats API and see what it's calculating
    console.log("\n📈 PROJECT STATS API - Current calculations:");
    const statsResponse = await fetch(`${BASE_URL}/api/dashboard/project-stats?userId=${userId}&projectId=${projectId}&organizationId=${organizationId}`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      
      console.log("📊 Current Project Stats results:");
      console.log(`   Total Tasks: ${statsData.totalTasks}`);
      console.log(`   Active Tasks: ${statsData.activeTasks}`);
      console.log(`   Completed This Week: ${statsData.completedThisWeek}`);
      console.log(`   Tasks Completed Today: ${statsData.tasksCompletedToday}`);
      console.log(`   Team Size: ${statsData.teamSize}`);
      console.log(`   Completion Rate: ${statsData.completionRate}%`);
    }
    
    // 4. Recommendations
    console.log("\n💡 ANALYSIS & RECOMMENDATIONS:");
    console.log("==============================");
    console.log("1. Check if your completed tasks have status 'completed' or 'done'");
    console.log("2. Check if completed tasks have a 'completedAt' timestamp");
    console.log("3. Tasks might be in a 'Done' column but still have 'todo' status");
    console.log("4. Look for any status mismatches between column position and task.status");
    
  } catch (error) {
    console.error("❌ Debug Error:", error);
  }
}

// Run the debug
debugTaskStatuses();
