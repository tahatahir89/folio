const MAX_DIMENSION = 1600;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_CHARS = 3_000_000; // ~2.2 MB of image data per picture

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

/**
 * Downscales and re-encodes an image to PNG or JPEG so it can be stored inside the document
 * and exported reliably (PDF and DOCX both embed PNG/JPEG).
 */
export async function imageFileToDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error('Use a PNG, JPEG, GIF or WebP image.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('That image is larger than 15 MB. Try a smaller one.');

  const img = await loadImage(file);
  let scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
  const keepAlpha = file.type !== 'image/jpeg';

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not process that image.');
    if (!keepAlpha) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const url = keepAlpha && attempt < 2 ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85 - attempt * 0.1);
    if (url.length <= MAX_OUTPUT_CHARS) return url;
    scale *= 0.75;
  }
  throw new Error('That image is too detailed to embed. Try a smaller one.');
}

/** Adds https:// when missing and rejects unsafe schemes. Returns null when the value is unusable. */
export function normalizeUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null; // javascript:, data:, etc.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^[^\s]+\.[^\s]+$/.test(value)) return `https://${value}`;
  return null;
}
