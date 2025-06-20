import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Upload profile picture via API route using service key
export async function uploadProfilePicture(file: File, userId: string): Promise<string | null> {
  try {
    console.log('=== SERVICE KEY UPLOAD ===');
    console.log('File:', { name: file.name, size: file.size, type: file.type });
    console.log('User ID:', userId);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Service key upload failed:', errorData);
      throw new Error(errorData.error || 'Upload failed');
    }

    const { url } = await response.json();
    console.log('Service key upload successful:', url);
    return url;
    
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    throw error;
  }
}

// Delete profile picture using service key
export async function deleteProfilePicture(userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    return response.ok;
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error);
    return false;
  }
}

// Get profile picture URL
export function getProfilePictureUrl(userId: string, fileExtension: string = 'jpg'): string {
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(`profile_${userId}.${fileExtension}`);

  return publicUrl;
}
