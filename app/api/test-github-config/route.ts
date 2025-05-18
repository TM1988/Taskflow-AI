// app/api/test-github-config/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  return NextResponse.json({
    clientIdAvailable: !!clientId,
    clientSecretAvailable: !!clientSecret,
    clientIdFirstChars: clientId ? clientId.slice(0, 3) + "..." : null,
    // Never log the actual secret, just check if it exists
  });
}
