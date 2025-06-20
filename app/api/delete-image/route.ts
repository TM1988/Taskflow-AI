import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create service role client that bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log('Deleting profile images for user:', userId);

    // List all files that start with the userId
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('profile-pictures')
      .list('', {
        search: `profile_${userId}`
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return NextResponse.json(
        { error: "Failed to list files" },
        { status: 500 }
      );
    }

    if (files && files.length > 0) {
      const filesToDelete = files
        .filter(file => file.name.includes(userId))
        .map(file => file.name);

      console.log('Files to delete:', filesToDelete);

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabaseAdmin.storage
          .from('profile-pictures')
          .remove(filesToDelete);

        if (deleteError) {
          console.error('Error deleting files:', deleteError);
          return NextResponse.json(
            { error: "Failed to delete files" },
            { status: 500 }
          );
        }
      }
    }

    console.log('Profile images deleted successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting profile images:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
