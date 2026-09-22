const SEEN_KEY = "box-campus-seen-v1";
const TAP_HINT_KEY = "box-campus-tap-hint-v1";

export function readSeenStories(): string[] {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const data = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(data) ? data.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markStorySeen(campusId: string) {
  if (!campusId || typeof window === "undefined") return;
  const seen = readSeenStories();
  if (seen.includes(campusId)) return;
  window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, campusId]));
}

export function storyWasSeen(campusId: string) {
  return readSeenStories().includes(campusId);
}

export function tapHintDismissed() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(TAP_HINT_KEY) === "1";
}

export function dismissTapHint() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TAP_HINT_KEY, "1");
}
