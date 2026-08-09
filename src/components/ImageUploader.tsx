"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string | null;
}

export function ImageUploader({ value, onChange, error }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file (JPG, PNG or WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setUploadError(data?.error ?? "Upload failed. Please try again.");
        return;
      }
      onChange(data.url);
    } catch {
      setUploadError("Could not reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Item preview" className="aspect-[4/3] w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition-colors hover:bg-white hover:text-rose-600"
            aria-label="Remove image"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors",
            uploadError || error
              ? "border-rose-300 bg-rose-50/50 hover:border-rose-400"
              : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Uploading image…</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-7 w-7 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                Click to upload an image
              </span>
              <span className="text-xs text-slate-400">JPG, PNG or WEBP · max 5MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {(uploadError || error) && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError ?? error}
        </p>
      )}
    </div>
  );
}
