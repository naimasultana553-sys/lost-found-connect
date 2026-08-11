"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
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
        <div className="relative overflow-hidden rounded-[24px] border border-surface-variant/50 shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Item preview" className="aspect-[4/3] w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-on-surface-variant shadow transition-colors hover:bg-white hover:text-error"
            aria-label="Remove image"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
            uploadError || error
              ? "border-error-container bg-error-container/20 hover:border-error"
              : "border-tertiary-fixed-dim bg-surface-container-low hover:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {uploading ? (
            <>
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/20">
                <Icon name="hourglass_top" className="animate-spin text-[28px] text-primary" />
              </div>
              <span className="font-label-md text-label-md text-primary">Uploading image…</span>
            </>
          ) : (
            <>
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/20">
                <Icon name="add_a_photo" className="text-[28px] text-primary" />
              </div>
              <span className="font-label-md text-label-md text-primary">Upload item photo</span>
              <span className="mt-1 font-caption text-caption text-on-surface-variant">
                PNG, JPG up to 5MB
              </span>
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
        <p className="mt-2 flex items-center gap-1.5 text-sm text-error">
          <Icon name="error" className="text-[18px]" />
          {uploadError ?? error}
        </p>
      )}
    </div>
  );
}
