import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { APP_CONFIG } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepts multipart/form-data with a single `file` field.
 * Validates type + size, re-encodes with sharp, and stores the image bytes
 * in the database so uploads work on any filesystem (including Vercel's
 * read-only serverless environment). The returned URL serves the bytes via
 * /api/image/<id>.
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
      return NextResponse.json({ error: "Please upload a JPG, PNG or WebP image." }, { status: 400 });
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

    const image = await prisma.image.create({
      data: { data: normalized, mimeType: "image/jpeg" },
    });

    return NextResponse.json({ url: `/api/image/${image.id}` });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
