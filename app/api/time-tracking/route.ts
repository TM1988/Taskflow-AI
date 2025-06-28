import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseConnection } from "@/services/db/dynamicConnection";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const taskId = searchParams.get("taskId");
    const projectId = searchParams.get("projectId");
    const date = searchParams.get("date");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const database = await getUserDatabaseConnection(userId);
    if (!database) {
      throw new Error("Database connection failed");
    }

    const query: any = { userId };
    if (taskId) query.taskId = taskId;
    if (projectId) query.projectId = projectId;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const timeEntries = await database.collection("timeTracking").find(query).toArray();

    const formattedEntries = timeEntries.map(entry => ({
      ...entry,
      _id: entry._id.toString(),
      id: entry._id.toString()
    }));

    return NextResponse.json(formattedEntries);

  } catch (error) {
    console.error("Error fetching time tracking entries:", error);
    return NextResponse.json({ error: "Failed to fetch time tracking entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, taskId, projectId, minutes, description, date, type = 'manual' } = body;

    if (!userId || !minutes) {
      return NextResponse.json({ error: "User ID and minutes are required" }, { status: 400 });
    }

    const database = await getUserDatabaseConnection(userId);
    if (!database) {
      throw new Error("Database connection failed");
    }

    const timeEntry = {
      userId,
      taskId: taskId || null,
      projectId: projectId || null,
      minutes: parseInt(minutes),
      description: description || "",
      type, // 'manual', 'timer', 'automatic'
      date: date ? new Date(date) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await database.collection("timeTracking").insertOne(timeEntry);

    const response = {
      ...timeEntry,
      id: result.insertedId.toString(),
      _id: undefined
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error("Error creating time tracking entry:", error);
    return NextResponse.json({ error: "Failed to create time tracking entry" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, userId, minutes, description } = body;

    if (!entryId || !userId) {
      return NextResponse.json({ error: "Entry ID and User ID are required" }, { status: 400 });
    }

    const database = await getUserDatabaseConnection(userId);
    if (!database) {
      throw new Error("Database connection failed");
    }

    const updateData: any = { updatedAt: new Date() };
    if (minutes !== undefined) updateData.minutes = parseInt(minutes);
    if (description !== undefined) updateData.description = description;

    const result = await database.collection("timeTracking").updateOne(
      { _id: new (require('mongodb')).ObjectId(entryId), userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating time tracking entry:", error);
    return NextResponse.json({ error: "Failed to update time tracking entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");
    const userId = searchParams.get("userId");

    console.log('DELETE request - entryId:', entryId, 'userId:', userId);

    if (!entryId || !userId) {
      return NextResponse.json({ error: "Entry ID and User ID are required" }, { status: 400 });
    }

    const database = await getUserDatabaseConnection(userId);
    if (!database) {
      throw new Error("Database connection failed");
    }

    // Convert entryId to ObjectId if it's not already
    let objectId;
    try {
      const { ObjectId } = require('mongodb');
      objectId = new ObjectId(entryId);
    } catch (err) {
      console.error('Invalid ObjectId:', entryId, err);
      return NextResponse.json({ error: "Invalid entry ID format" }, { status: 400 });
    }

    const result = await database.collection("timeTracking").deleteOne({
      _id: objectId,
      userId
    });

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting time tracking entry:", error);
    return NextResponse.json({ error: "Failed to delete time tracking entry" }, { status: 500 });
  }
}
