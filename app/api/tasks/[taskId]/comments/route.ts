import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const taskId = params.taskId;

    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    const comments = await adminDb
      .collection("comments")
      .find({ taskId: new ObjectId(taskId) })
      .sort({ createdAt: 1 })
      .toArray();

    const transformedComments = comments.map(comment => ({
      id: comment._id.toString(),
      content: comment.content,
      taskId: comment.taskId.toString(),
      authorId: comment.authorId,
      authorName: comment.authorName,
      createdAt: comment.createdAt ? comment.createdAt.toISOString() : null,
      updatedAt: comment.updatedAt ? comment.updatedAt.toISOString() : null,
    }));

    return NextResponse.json(transformedComments);
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

    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }

    const commentData = {
      taskId: new ObjectId(taskId),
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName || "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await adminDb.collection("comments").insertOne(commentData);

    return NextResponse.json({
      id: result.insertedId.toString(),
      content: commentData.content,
      taskId: taskId,
      authorId: commentData.authorId,
      authorName: commentData.authorName,
      createdAt: commentData.createdAt.toISOString(),
      updatedAt: commentData.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 },
    );
  }
}
