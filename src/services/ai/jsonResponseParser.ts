export function parseJsonObjectResponse(text: string): Record<string, unknown> {
  const start = text.indexOf('{');
  if (start < 0) {
    throw new Error('Model response did not contain a JSON object');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index++) {
    const character = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === '{') {
      depth++;
    } else if (character === '}') {
      depth--;
      if (depth === 0) {
        const parsed: unknown = JSON.parse(text.slice(start, index + 1));
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
          throw new Error('Model response JSON must be an object');
        }
        return parsed as Record<string, unknown>;
      }
    }
  }

  throw new Error('Model response contained an incomplete JSON object');
}
