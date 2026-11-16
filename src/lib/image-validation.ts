/**
 * Server-side image validation. The browser-supplied MIME type is NOT trusted: the file signature
 * (magic bytes) decides. SVG, GIF and anything else are refused (SVG can carry scripts).
 */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type ImageCheck = { ok: true; ext: "png" | "jpg" | "webp"; mime: "image/png" | "image/jpeg" | "image/webp" } | { ok: false; error: string };

export function validateImage(bytes: Uint8Array, declaredMime?: string): ImageCheck {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, error: "Images must be 2 MB or smaller." };
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  let found: ImageCheck | null = null;
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) found = { ok: true, ext: "png", mime: "image/png" };
  else if (startsWith([0xff, 0xd8, 0xff])) found = { ok: true, ext: "jpg", mime: "image/jpeg" };
  else if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) found = { ok: true, ext: "webp", mime: "image/webp" };
  if (!found || !found.ok) return { ok: false, error: "Only PNG, JPEG or WebP images are accepted." };
  if (declaredMime && declaredMime !== found.mime && !(declaredMime === "image/jpg" && found.mime === "image/jpeg")) {
    return { ok: false, error: "The file content does not match its declared type." };
  }
  return found;
}
