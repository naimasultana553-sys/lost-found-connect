/**
 * Image matching via perceptual hashing (dHash).
 *
 * A real, working image-similarity signal: no deep model required, but it
 * genuinely compares images. Each image is downscaled to 9x8 grayscale and a
 * 64-bit hash is derived from relative brightness changes between adjacent
 * pixels. Two images are similar when their hashes are close (Hamming
 * distance). This module is intentionally isolated so a real
 * computer-vision/embedding model can replace it later without touching the
 * rest of the app.
 */
import sharp from "sharp";
import path from "path";
import { access, readFile } from "fs/promises";

/**
 * Compute the 64-bit dHash of an image file on disk.
 * Returns null when the file is missing or not a decodable image.
 */
export async function computeImageHash(filePath: string): Promise<string | null> {
  try {
    await access(filePath);
  } catch {
    return null;
  }

  return computeImageHashFromBuffer(await readFile(filePath));
}

/** Compute the 64-bit dHash of raw image bytes. Returns null when undecodable. */
export async function computeImageHashFromBuffer(buffer: Buffer): Promise<string | null> {
  try {
    const { data } = await sharp(buffer)
      .resize(9, 8, { fit: "fill", position: "centre" })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let bits = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = data[y * 9 + x];
        const right = data[y * 9 + x + 1];
        bits += left > right ? "1" : "0";
      }
    }
    return bits;
  } catch {
    return null;
  }
}

/**
 * Compute the dHash for any stored image URL. Remote URLs (e.g. Vercel Blob)
 * are fetched; local URLs (e.g. /uploads/...) are read from disk.
 */
export async function computeImageHashFromUrl(imageUrl: string): Promise<string | null> {
  try {
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      return computeImageHashFromBuffer(Buffer.from(await res.arrayBuffer()));
    }
    return computeImageHash(resolveImagePath(imageUrl));
  } catch {
    return null;
  }
}

/** Resolve a public URL (e.g. "/uploads/x/a.png") to an absolute file path. */
export function resolveImagePath(imageUrl: string): string {
  return path.join(process.cwd(), "public", imageUrl.replace(/^\/+/, ""));
}

export function hammingDistance(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 64;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) distance++;
  }
  return distance;
}

/**
 * Similarity between two hashes, 0-100. Without a hash the score is 0 so a
 * missing image never inflates the match score.
 */
export function imageSimilarity(hashA: string | null, hashB: string | null): number {
  if (!hashA || !hashB) return 0;
  return Math.round((1 - hammingDistance(hashA, hashB) / 64) * 100);
}
