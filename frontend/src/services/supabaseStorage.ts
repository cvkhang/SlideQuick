
/**
 * Supabase Storage Service
 * Handles image uploads to Supabase Storage using raw fetch API
 * (No extra dependencies required)
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET || 'uploads';

export const isSupabaseConfigured = () => {
  return !!SUPABASE_URL && !!SUPABASE_KEY;
};

export const uploadImageToSupabase = async (file: File): Promise<string> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload to Supabase Storage
  // POST /storage/v1/object/{bucket}/{wildcard}
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      // Content-Type is distinct from file type for the request itself, 
      // but Supabase usually handles raw body. 
      // Do NOT set Content-Type to multipart/form-data boundary manually if sending File body directly
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false'
    },
    body: file
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  // Get Public URL
  // your-project.supabase.co/storage/v1/object/public/{bucket}/{key}
  const { publicUrl } = getPublicUrl(filePath);
  return publicUrl;
};

const getPublicUrl = (path: string) => {
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
  return { publicUrl };
};
