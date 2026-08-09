import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { requireApiUser } from "@/lib/auth";
import { APP_CONFIG } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepts multipart/form-data with a single `file` field.
 * Validates type + size, re-encodes with sharp, stores under public/uploads.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }
    if (!(APP_CONFIG.allowedImageTypes as readonly string[]).includes(file.type)) {
      return NextResponse.json({ error: "Please upload a JPG, PNG, WebP or GIF image." }, { status: 400 });
    }
    if (file.size > APP_CONFIG.maxUploadBytes) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Re-encode with sharp to normalize the image and validate it decodes.
    let normalized: Buffer;
    try {
      normalized = await sharp(buffer).rotate().resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    } catch {
      return NextResponse.json({ error: "The uploaded file is not a valid image." }, { status: 400 });
    }

    const ext = "jpg";
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", user.id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), normalized);

    const url = `/uploads/${user.id}/${filename}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
