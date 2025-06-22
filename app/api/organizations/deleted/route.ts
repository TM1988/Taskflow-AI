import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching deleted organizations for user: ${userId}`);

    // Query for deleted organizations where user is a member
    const q = query(
      collection(db, "organizations"),
      where("deleted", "==", true),
      where("members", "array-contains", userId)
    );

    const querySnapshot = await getDocs(q);
    const deletedOrganizations = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore timestamps to ISO strings
      const convertTimestamp = (timestamp: any) => {
        if (!timestamp) return null;
        if (timestamp && typeof timestamp.toDate === "function") {
          return timestamp.toDate().toISOString();
        }
        return timestamp;
      };

      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        deletedAt: convertTimestamp(data.deletedAt),
      };
    });

    console.log(`Found ${deletedOrganizations.length} deleted organizations for user ${userId}`);
    return NextResponse.json(deletedOrganizations);

  } catch (error) {
    console.error("Error fetching deleted organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch deleted organizations" },
      { status: 500 }
    );
  }
}
