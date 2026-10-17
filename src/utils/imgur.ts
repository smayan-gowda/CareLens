/**
 * Imgur Anonymous Image Upload Helper
 *
 * Imgur allows free anonymous uploads up to 20MB per image with high resolution.
 * Simply get a free Client-ID from https://api.imgur.com/oauth2/addclient
 * and set VITE_IMGUR_CLIENT_ID in your environment.
 */

export async function uploadToImgur(image: File | string): Promise<string> {
  const meta = import.meta as unknown as { env?: Record<string, string> };
  const clientId = meta.env?.VITE_IMGUR_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      "Missing Imgur Client ID. Please add VITE_IMGUR_CLIENT_ID to your environment."
    );
  }

  const formData = new FormData();
  if (image instanceof File) {
    formData.append("image", image);
  } else if (typeof image === "string") {
    // Strip data url prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    formData.append("image", base64Data);
    formData.append("type", "base64");
  }

  const response = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: {
      Authorization: `Client-ID ${clientId}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.data?.error || "Failed to upload image to Imgur. Check your Client ID."
    );
  }

  // Returns direct CDN URL (e.g., https://i.imgur.com/abc123x.jpg)
  return data.data.link;
}
