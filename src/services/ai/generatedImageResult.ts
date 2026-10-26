type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function asImageReference(value: unknown, mimeType = 'image/png'): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) return undefined;
  const imageValue = value.trim();

  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(imageValue)) return imageValue;
  if (/^https:\/\/[^\s]+$/i.test(imageValue)) return imageValue;
  if (/^[a-z0-9+/]+={0,2}$/i.test(imageValue)) {
    return `data:${mimeType};base64,${imageValue}`;
  }
  return undefined;
}

export function extractGeneratedImage(response: unknown): string | undefined {
  const root = asRecord(response);
  if (!root) return undefined;

  const results = [root.data, root.images, root.output]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(asRecord)
    .filter((value): value is UnknownRecord => value !== undefined);

  for (const result of results) {
    const mimeType =
      typeof result.mime_type === 'string'
        ? result.mime_type
        : typeof result.mimeType === 'string'
          ? result.mimeType
          : 'image/png';

    for (const field of ['url', 'image_url', 'imageUrl', 'b64_json', 'base64', 'image_base64']) {
      const image = asImageReference(result[field], mimeType);
      if (image) return image;
    }
  }

  return asImageReference(root.image);
}
