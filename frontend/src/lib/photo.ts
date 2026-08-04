// lib/photo.ts - build a same-origin URL for a Google Places photo reference.
// The actual Google request (with the server key) happens in /api/photo.
export function businessPhotoUrl(
  photoReference: string | null | undefined,
  width = 400
): string | null {
  if (!photoReference) return null;
  return `/api/photo?ref=${encodeURIComponent(photoReference)}&w=${width}`;
}
