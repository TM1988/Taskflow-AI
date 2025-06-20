import { NextRequest, NextResponse } from "next/server";
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    
    console.log(`Permanently deleting organization: ${organizationId}`);

    // Create a batch to delete everything atomically
    const batch = writeBatch(db);
    
    // 1. Delete all projects in this organization
    const projectsQuery = query(
      collection(db, "projects"),
      where("organizationId", "==", organizationId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    
    console.log(`Found ${projectsSnapshot.size} projects to delete`);
    
    // For each project, also delete its tasks and columns
    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      
      // Delete project tasks
      const tasksQuery = query(
        collection(db, "tasks"),
        where("projectId", "==", projectId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      console.log(`Deleting ${tasksSnapshot.size} tasks from project ${projectId}`);
      
      tasksSnapshot.docs.forEach(taskDoc => {
        batch.delete(doc(db, "tasks", taskDoc.id));
      });
      
      // Delete project columns
      const columnsQuery = query(
        collection(db, "columns"),
        where("projectId", "==", projectId)
      );
      const columnsSnapshot = await getDocs(columnsQuery);
      console.log(`Deleting ${columnsSnapshot.size} columns from project ${projectId}`);
      
      columnsSnapshot.docs.forEach(columnDoc => {
        batch.delete(doc(db, "columns", columnDoc.id));
      });
      
      // Delete the project itself
      batch.delete(doc(db, "projects", projectId));
    }
    
    // 2. Delete organization members/roles
    const rolesQuery = query(
      collection(db, "organizationRoles"),
      where("organizationId", "==", organizationId)
    );
    const rolesSnapshot = await getDocs(rolesQuery);
    console.log(`Deleting ${rolesSnapshot.size} organization roles`);
    
    rolesSnapshot.docs.forEach(roleDoc => {
      batch.delete(doc(db, "organizationRoles", roleDoc.id));
    });
    
    // 3. Delete the organization itself
    batch.delete(doc(db, "organizations", organizationId));
    
    // Execute the batch delete
    await batch.commit();
    
    console.log(`Organization ${organizationId} and all related data permanently deleted`);
    return NextResponse.json({ 
      success: true, 
      message: "Organization and all related data permanently deleted" 
    });

  } catch (error) {
    console.error("Error permanently deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete organization" },
      { status: 500 }
    );
  }
}
