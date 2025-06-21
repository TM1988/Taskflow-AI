import { NextRequest, NextResponse } from "next/server";
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userEmail = searchParams.get('userEmail');

    if (type !== 'received' || !userEmail) {
      return NextResponse.json(
        { error: "Invalid parameters for received invitations" },
        { status: 400 }
      );
    }

    console.log(`Fetching received invitations for email: ${userEmail}`);

    const invitationsRef = collection(db, "invitations");
    const q = query(
      invitationsRef,
      where("invitedEmail", "==", userEmail),
      where("status", "==", "pending")
    );

    const querySnapshot = await getDocs(q);
    const invitations: any[] = [];

    // Get current time to check for expired invitations
    const now = new Date();

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const expiresAt = data.expiresAt?.toDate() || new Date(data.expiresAt);
      
      // Only include non-expired invitations
      if (expiresAt > now) {
        // Get organization details
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
          throw new Error('NEXT_PUBLIC_BASE_URL is not configured');
        }
        
        const orgResponse = await fetch(`${baseUrl}/api/organizations/${data.organizationId}`);
        let organizationName = data.organizationId;
        
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          organizationName = orgData.name;
        }

        invitations.push({
          id: docSnapshot.id,
          ...data,
          organizationName,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          expiresAt: expiresAt.toISOString(),
        });
      }
    }

    console.log(`Found ${invitations.length} valid received invitations for ${userEmail}`);
    return NextResponse.json(invitations);

  } catch (error) {
    console.error("Error fetching received invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
