import { supabase } from './supabase';

/**
 * Uploads a food photo and returns its public URL.
 * `photo` is the data URL that compressFoodPhoto() produces.
 * Built-in sample photos (paths starting with "/") are returned unchanged.
 */
export async function uploadFoodPhoto(userId: string, photo: string): Promise<string> {
  if (photo.startsWith('/')) return photo;

  const blob = await (await fetch(photo)).blob();
  const type = blob.type || 'image/jpeg';
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('food-images')
    .upload(path, blob, { contentType: type });
  if (error) throw new Error('Could not upload the photo. Please try again.');

  return supabase.storage.from('food-images').getPublicUrl(path).data.publicUrl;
}