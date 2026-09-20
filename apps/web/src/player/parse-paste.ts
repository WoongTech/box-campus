export function parsePastedCampus(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return { invalid: true };

  const candidates = [trimmed];
  const assigned = trimmed.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (assigned?.[1]) candidates.push(assigned[1]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (isPackWrapper(parsed)) return parsed.BOX_CAMPUS_PACK;
      return parsed;
    } catch {
      continue;
    }
  }

  return { invalid: true };
}

function isPackWrapper(value: unknown): value is { BOX_CAMPUS_PACK: unknown } {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "BOX_CAMPUS_PACK" in value
  );
}
