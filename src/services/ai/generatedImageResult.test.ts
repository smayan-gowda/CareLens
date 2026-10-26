import { describe, expect, it } from 'vitest';
import { extractGeneratedImage } from './generatedImageResult';

describe('extractGeneratedImage', () => {
  it('accepts the Agnes data URL response', () => {
    expect(
      extractGeneratedImage({ data: [{ url: 'https://images.example/generated.png' }] })
    ).toBe('https://images.example/generated.png');
  });

  it('accepts base64 image results and preserves MIME type', () => {
    expect(
      extractGeneratedImage({ data: [{ b64_json: 'aGVsbG8=', mime_type: 'image/webp' }] })
    ).toBe('data:image/webp;base64,aGVsbG8=');
  });

  it('accepts image_url in an images result array', () => {
    expect(
      extractGeneratedImage({ images: [{ image_url: 'https://images.example/generated.webp' }] })
    ).toBe('https://images.example/generated.webp');
  });

  it('ignores malformed or non-image values', () => {
    expect(extractGeneratedImage({ data: [{ url: 'javascript:alert(1)' }] })).toBeUndefined();
    expect(extractGeneratedImage({ data: [{ base64: 'not base64!' }] })).toBeUndefined();
  });
});
