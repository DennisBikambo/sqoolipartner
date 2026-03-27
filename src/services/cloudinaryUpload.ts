const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "dh50yueq2";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

/**
 * Upload a base64/data-URL image to Cloudinary using an unsigned upload preset.
 * Returns the secure CDN URL of the uploaded image.
 *
 * Requires VITE_CLOUDINARY_UPLOAD_PRESET to be set in .env.local.
 * VITE_CLOUDINARY_CLOUD_NAME defaults to "dh50yueq2" (matches socialPostGenerator).
 */
export async function uploadToCloudinary(
  dataUrl: string,
  options: { folder?: string; publicId?: string } = {}
): Promise<string> {
  if (!UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary upload preset not configured. Set VITE_CLOUDINARY_UPLOAD_PRESET in .env.local."
    );
  }

  const body = new FormData();
  body.append("file", dataUrl);
  body.append("upload_preset", UPLOAD_PRESET);
  if (options.folder) body.append("folder", options.folder);
  if (options.publicId) body.append("public_id", options.publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Cloudinary upload failed: ${err.error?.message ?? res.statusText}`);
  }

  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}
