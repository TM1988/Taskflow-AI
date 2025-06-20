import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  return NextResponse.json({ message: "Organization invites route not implemented yet" });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  return NextResponse.json({ message: "Organization invites route not implemented yet" });
}