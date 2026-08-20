"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { initialsFor } from "@/lib/initials";
import { updateAvatar } from "./actions";

// Resized/cropped client-side before upload so the base64-in-Postgres
// column (no blob storage wired up yet) stays small regardless of what
// photo the user picks — a 4000x3000 phone photo becomes a ~256x256 JPEG.
async function resizeToSquare(file: File, size = 256, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))), "image/jpeg", quality);
  });
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 7h2.3l1-1.8h7.4l1 1.8H17a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <circle cx="10" cy="11.2" r="3" />
    </svg>
  );
}

export function AvatarUploader({
  name,
  email,
  imageUrl,
}: {
  name?: string | null;
  email?: string | null;
  imageUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const resized = await resizeToSquare(file);
        setPreview(URL.createObjectURL(resized));

        const formData = new FormData();
        formData.append("avatar", resized, "avatar.jpg");
        const result = await updateAvatar(formData);
        if (result.error) {
          setError(result.error);
          setPreview(imageUrl ?? null);
        } else {
          router.refresh();
        }
      } catch {
        setError("Could not process that image");
        setPreview(imageUrl ?? null);
      }
    });
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-brand-dark bg-brand-pink"
      >
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white">
            {initialsFor(name, email)}
          </span>
        )}
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
          <CameraIcon />
          {isPending ? "Uploading…" : "Change photo"}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
