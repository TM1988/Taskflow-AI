import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/services/admin/firebaseAdmin";
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";

// Define interfaces for type checking
interface CommentData {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  authorName: string;
  createdAt: any; // Using 'any' for flexibility with date types
  updatedAt: any;
}

// Helper function to safely get date values
function getDateValue(timestamp: any): number {
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate().getTime();
  }
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }
  try {
    return new Date(timestamp).getTime();
  } catch (e) {
    return 0;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const taskId = params.taskId;

    // Get comments without ordering to avoid index issues
    const commentsSnapshot = await adminDb
      .collection("comments")
      .where("taskId", "==", taskId)
      .get();

    const comments = commentsSnapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      }),
    );

    // Sort locally instead of using orderBy in Firestore
    comments.sort((a: CommentData, b: CommentData) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return getDateValue(a.createdAt) - getDateValue(b.createdAt);
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const taskId = params.taskId;
    const data = await request.json();

    if (!data.content || !data.authorId) {
      return NextResponse.json(
        { error: "Comment content and author ID are required" },
        { status: 400 },
      );
    }

    const commentRef = adminDb.collection("comments").doc();
    const now = new Date();

    const commentData = {
      taskId,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName || "User",
      createdAt: now,
      updatedAt: now,
    };

    await commentRef.set(commentData);

    return NextResponse.json({
      id: commentRef.id,
      ...commentData,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 },
    );
  }
}
