import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  return NextResponse.json({ message: "Task settings route not implemented yet" });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  return NextResponse.json({ message: "Task settings route not implemented yet" });
}