import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection, getOrganizationDatabaseConnection } from "@/services/db/dynamicConnection";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    console.log("Import API: Importing data for project:", projectId);

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Import API: Received data:", { 
      hasColumns: !!body.columns, 
      hasTasks: !!body.tasks,
      isArray: Array.isArray(body)
    });

    // Get organization ID from search params if available
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");
    const userId = url.searchParams.get("userId"); // Add userId support

    // Get database connection
    const db = organizationId 
      ? await getOrganizationDatabaseConnection(organizationId)
      : await getUserDatabaseConnection(userId || "default-user");

    let importedTaskCount = 0;
    let importedColumnCount = 0;

    // Handle both old format (array of tasks) and new format (object with columns and tasks)
    let tasksToImport: any[] = [];
    let columnsToImport: any[] = [];
    let sourceColumns: any[] = [];

    if (Array.isArray(body)) {
      // Old format: just an array of tasks
      tasksToImport = body;
    } else if (body.tasks || body.columns) {
      // New format: object with tasks and columns
      tasksToImport = body.tasks || [];
      columnsToImport = body.columns || [];
      sourceColumns = body.columns || []; // Keep track of source columns for mapping
    } else {
      return NextResponse.json(
        { error: "Invalid data format. Expected tasks array or object with tasks/columns." },
        { status: 400 }
      );
    }

    // Get existing columns for the project to map imported tasks properly
    const existingColumnsSnapshot = await db
      .collection("columns")
      .find({ projectId })
      .toArray();
    
    const existingColumns = existingColumnsSnapshot.map((doc: any) => ({
      id: doc._id.toString(),
      name: doc.name,
      order: doc.order
    }));
    
    console.log("Project Import API: Existing columns for project:", existingColumns);
    
    // If no columns exist, create default columns first
    if (existingColumns.length === 0) {
      console.log("Project Import API: No columns found, creating default columns...");
      const defaultColumns = [
        { projectId, name: "To Do", order: 0, createdAt: new Date(), updatedAt: new Date() },
        { projectId, name: "In Progress", order: 1, createdAt: new Date(), updatedAt: new Date() },
        { projectId, name: "Review", order: 2, createdAt: new Date(), updatedAt: new Date() },
        { projectId, name: "Done", order: 3, createdAt: new Date(), updatedAt: new Date() }
      ];
      
      const columnResult = await db.collection("columns").insertMany(defaultColumns);
      
      // Update existing columns array with the newly created columns
      Object.entries(columnResult.insertedIds).forEach(([index, id]) => {
        existingColumns.push({
          id: id.toString(),
          name: defaultColumns[parseInt(index)].name,
          order: defaultColumns[parseInt(index)].order
        });
      });
      
      console.log("Project Import API: Created default columns:", existingColumns);
    }

    // Create a mapping from source column IDs to target column IDs based on column names
    const sourceColumnIdToTargetId: Record<string, string> = {};
    const sourceColumnIdToName: Record<string, string> = {};
    
    // Build a map of source column IDs to names
    sourceColumns.forEach(sourceCol => {
      sourceColumnIdToName[sourceCol.id] = sourceCol.name;
    });
    
    console.log("Project Import API: Source columns:", sourceColumns.map(col => ({ id: col.id, name: col.name })));
    console.log("Project Import API: Existing target columns:", existingColumns.map(col => ({ id: col.id, name: col.name })));
    
    // Map source column IDs to target column IDs by matching names (exact match first)
    sourceColumns.forEach(sourceCol => {
      const exactMatch = existingColumns.find(targetCol => 
        targetCol.name.toLowerCase() === sourceCol.name.toLowerCase()
      );
      
      if (exactMatch) {
        sourceColumnIdToTargetId[sourceCol.id] = exactMatch.id;
        console.log(`Project Import API: Exact name match - source column "${sourceCol.name}" (${sourceCol.id}) -> target column "${exactMatch.name}" (${exactMatch.id})`);
      }
    });
    
    // For unmapped source columns, try fuzzy matching with common variations
    sourceColumns.forEach(sourceCol => {
      if (sourceColumnIdToTargetId[sourceCol.id]) return; // Already mapped
      
      const sourceNameLower = sourceCol.name.toLowerCase();
      const commonMappings = {
        "todo": ["todo", "to do", "backlog", "new", "pending"],
        "in progress": ["in-progress", "in progress", "doing", "active", "working", "wip"],
        "review": ["review", "testing", "qa", "pending review", "code review"],
        "done": ["done", "completed", "finished", "closed", "complete"]
      };
      
      // Find matching target column using fuzzy matching
      for (const targetCol of existingColumns) {
        const targetNameLower = targetCol.name.toLowerCase();
        
        // Check if source name matches any of the common patterns for this target column
        for (const [pattern, variations] of Object.entries(commonMappings)) {
          if (variations.some(v => targetNameLower.includes(v))) {
            // This target column matches a pattern, check if source column also matches
            if (variations.some(v => sourceNameLower.includes(v))) {
              sourceColumnIdToTargetId[sourceCol.id] = targetCol.id;
              console.log(`Project Import API: Fuzzy match - source column "${sourceCol.name}" (${sourceCol.id}) -> target column "${targetCol.name}" (${targetCol.id}) via pattern "${pattern}"`);
              return;
            }
          }
        }
      }
    });
    
    // For any remaining unmapped columns, use the fallback
    const fallbackColumnId = existingColumns[0]?.id;
    sourceColumns.forEach(sourceCol => {
      if (!sourceColumnIdToTargetId[sourceCol.id] && fallbackColumnId) {
        sourceColumnIdToTargetId[sourceCol.id] = fallbackColumnId;
        console.log(`Project Import API: Fallback mapping - source column "${sourceCol.name}" (${sourceCol.id}) -> fallback column (${fallbackColumnId})`);
      }
    });
    
    console.log("Project Import API: Final column ID mapping:", sourceColumnIdToTargetId);

    // Import columns first (if any)
    if (columnsToImport.length > 0) {
      console.log("Import API: Importing", columnsToImport.length, "columns");
      
      const existingColumnNames = new Set(
        existingColumns.map((col) => col.name)
      );

      for (const column of columnsToImport) {
        // Skip if column with same name already exists
        if (!existingColumnNames.has(column.name)) {
          const columnData = {
            name: column.name,
            order: column.order || 0,
            projectId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await db.collection("columns").insertOne(columnData);
          importedColumnCount++;
        }
      }
    }

    // Import tasks
    if (tasksToImport.length > 0) {
      console.log("Import API: Importing", tasksToImport.length, "tasks");
      
      for (const task of tasksToImport) {
        // Map the column ID from source project to target project
        let targetColumnId = task.columnId;
        let sourceColumnName = "Unknown";
        
        console.log("Project Import API: Processing task:", {
          title: task.title,
          originalColumnId: task.columnId,
          hasSourceColumns: sourceColumns.length > 0
        });
        
        // If we have source columns info, use the proper mapping
        if (sourceColumns.length > 0 && sourceColumnIdToTargetId[task.columnId]) {
          targetColumnId = sourceColumnIdToTargetId[task.columnId];
          sourceColumnName = sourceColumnIdToName[task.columnId] || "Unknown";
          console.log("Project Import API: Mapped task from source column", sourceColumnName, "(", task.columnId, ") to target column ID", targetColumnId);
        } else if (sourceColumns.length > 0) {
          // We have source columns but couldn't map this specific task's column
          console.log("Project Import API: Could not map column ID", task.columnId, "from source. Available mappings:", Object.keys(sourceColumnIdToTargetId));
          const fallbackColumnId = existingColumns[0]?.id;
          if (fallbackColumnId) {
            targetColumnId = fallbackColumnId;
            console.log("Project Import API: Using fallback column for unmapped source column:", targetColumnId);
          }
        } else {
          // No source column info (legacy import or personal board), try to map by status/column ID patterns
          console.log("Project Import API: No source column info available, trying to map by patterns for columnId:", task.columnId);
          
          // Try to find a matching column by name patterns
          const taskColumnIdLower = (task.columnId || "").toLowerCase();
          const commonPatterns = [
            { patterns: ["todo", "to do", "backlog", "new"], targetPattern: ["todo", "to do", "backlog"] },
            { patterns: ["inprogress", "in-progress", "in progress", "doing", "active", "working"], targetPattern: ["in progress", "in-progress", "doing", "active"] },
            { patterns: ["review", "testing", "qa", "pending"], targetPattern: ["review", "testing", "qa"] },
            { patterns: ["done", "completed", "finished", "closed"], targetPattern: ["done", "completed", "finished"] }
          ];
          
          let mapped = false;
          for (const { patterns, targetPattern } of commonPatterns) {
            if (patterns.some(pattern => taskColumnIdLower.includes(pattern))) {
              // Find a target column that matches this pattern
              const matchingColumn = existingColumns.find(col => 
                targetPattern.some(tp => col.name.toLowerCase().includes(tp))
              );
              if (matchingColumn) {
                targetColumnId = matchingColumn.id;
                console.log("Project Import API: Mapped by pattern - task column", task.columnId, "to target column", matchingColumn.name, "(", targetColumnId, ")");
                mapped = true;
                break;
              }
            }
          }
          
          // If still no mapping found, use fallback
          if (!mapped) {
            const fallbackColumnId = existingColumns[0]?.id;
            if (fallbackColumnId) {
              targetColumnId = fallbackColumnId;
              console.log("Project Import API: No pattern mapping found, using fallback column:", targetColumnId);
            }
          }
        }
        
        // Clean the task data and ensure compatibility between personal and project tasks
        const taskData = {
          title: task.title || "Untitled Task",
          description: task.description || "",
          columnId: targetColumnId,
          status: task.status || targetColumnId || "todo", 
          priority: task.priority || "medium",
          order: task.order !== undefined ? task.order : 0,
          isBlocked: task.isBlocked || false,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          projectId, // Always use the target project ID
          // Include userId, but prioritize the current user making the import
          userId: userId || task.userId || "default-user", 
          tags: Array.isArray(task.tags) ? task.tags : [],
          assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [],
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
          updatedAt: new Date(),
        };
        
        // Remove any conflicting fields from the original task
        delete (taskData as any)._id;
        delete (taskData as any).id;
        delete (taskData as any).customDbProjectId; // Remove any legacy fields
        
        console.log("Project Import API: About to insert task:", {
          title: taskData.title,
          projectId: taskData.projectId,
          sourceColumnName: sourceColumnName,
          originalColumnId: task.columnId,
          mappedColumnId: taskData.columnId,
          userId: taskData.userId,
          allAvailableColumns: existingColumns.map(col => ({ id: col.id, name: col.name }))
        });
        
        // Validate that the target column exists
        const targetColumnExists = existingColumns.some(col => col.id === taskData.columnId);
        if (!targetColumnExists) {
          console.error("Project Import API: Target column does not exist:", taskData.columnId);
          console.error("Project Import API: Available columns:", existingColumns.map(col => ({ id: col.id, name: col.name })));
          // Force to first available column if target doesn't exist
          taskData.columnId = existingColumns[0]?.id || "todo";
          taskData.status = taskData.columnId;
          console.log("Project Import API: Forced to use first available column:", taskData.columnId);
        }
        
        const result = await db.collection("tasks").insertOne(taskData);
        importedTaskCount++;
        console.log("Project Import API: Successfully inserted task with ID:", result.insertedId, "in column:", taskData.columnId);
      }
    }

    console.log(`Import API: Successfully imported ${importedTaskCount} tasks and ${importedColumnCount} columns`);

    return NextResponse.json({
      success: true,
      importedTaskCount,
      importedColumnCount,
      message: `Successfully imported ${importedTaskCount} tasks${importedColumnCount ? ` and ${importedColumnCount} columns` : ''}`
    });

  } catch (error) {
    console.error("Import API error:", error);
    return NextResponse.json(
      { error: "Failed to import project data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}