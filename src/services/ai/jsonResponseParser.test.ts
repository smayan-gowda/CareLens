import { describe, expect, it } from 'vitest';
import { parseJsonObjectResponse } from './jsonResponseParser';

describe('parseJsonObjectResponse', () => {
  it('parses a plain JSON object', () => {
    expect(parseJsonObjectResponse('{"roomType":"Bedroom"}')).toEqual({ roomType: 'Bedroom' });
  });

  it('parses a JSON object inside a markdown fence', () => {
    expect(parseJsonObjectResponse('```json\n{"roomType":"Bedroom"}\n```')).toEqual({
      roomType: 'Bedroom',
    });
  });

  it('ignores trailing non-JSON text after the complete object', () => {
    expect(parseJsonObjectResponse('{"description":"clear } path"}\nAdditional text')).toEqual({
      description: 'clear } path',
    });
  });

  it('does not treat escaped quotes or braces in strings as structure', () => {
    expect(parseJsonObjectResponse('{"text":"say \\"hi\\" } now"} trailing')).toEqual({
      text: 'say "hi" } now',
    });
  });

  it('rejects a response with no complete JSON object', () => {
    expect(() => parseJsonObjectResponse('{"roomType":"Bedroom"')).toThrow(
      'Model response contained an incomplete JSON object'
    );
  });

  it('rejects malformed JSON inside the object', () => {
    expect(() => parseJsonObjectResponse('{"roomType":} trailing')).toThrow();
  });
});
