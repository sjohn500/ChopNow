import { apiRequest } from './api';

/**
 * Uploads a compressed data-URL food photo to the Python backend and returns
 * its `/uploads/...` URL. Built-in `/assets/...` sample paths pass through unchanged.
 */
export async function uploadFoodPhoto(
  _userId: string,
  photo: string
): Promise<string> {
  if (photo.startsWith('/')) return photo;

  const res = await apiRequest<{ url: string }>('/api/storage/upload', {
    method: 'POST',
    body: JSON.stringify({ photo }),
  });
  return res.url;
}