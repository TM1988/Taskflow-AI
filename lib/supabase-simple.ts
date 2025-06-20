import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadProfilePicture(file: File, userId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `profile_${userId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('public-files') // New bucket name
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('public-files')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
