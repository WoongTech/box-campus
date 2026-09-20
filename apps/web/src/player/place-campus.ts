import {
  createInitialState,
  dumpState,
  parseCampus,
  parseState,
  type PlayerState,
} from "@box-campus/engine";

export type ShelfLibrary = {
  order: string[];
  shelves: Record<string, string>;
  saved: string[];
};

export function emptyShelf(): ShelfLibrary {
  return { order: [], shelves: {}, saved: [] };
}

export function readShelf(value: unknown): ShelfLibrary {
  if (!value || typeof value !== "object") return emptyShelf();
  const data = value as Partial<ShelfLibrary>;
  if (!data.shelves || typeof data.shelves !== "object") return emptyShelf();
  return {
    order: Array.isArray(data.order) ? data.order.filter((id) => typeof id === "string") : [],
    shelves: data.shelves,
    saved: Array.isArray(data.saved) ? data.saved.filter((id) => typeof id === "string") : [],
  };
}

function feedCardId(state: PlayerState) {
  if (state.session.kind !== "feed") return "";
  return state.session.feed.current.cardId ?? "";
}

function keptState(previous: string | null, campus: PlayerState["campus"], now: number) {
  const fresh = createInitialState(campus, now);
  if (!previous) return fresh;
  const parsed = parseState(previous, campus, now);
  if (parsed.recovered) return fresh;
  const cardId = feedCardId(parsed.state);
  const stillThere = Boolean(cardId) && campus.cards.some((card) => card.id === cardId);
  if (!stillThere) return fresh;
  return { ...parsed.state, campus, notice: null };
}

export function placeCampus(input: {
  sessionText: string | null;
  library: ShelfLibrary;
  raw: unknown;
  now: number;
}) {
  const campus = parseCampus(input.raw);
  const shelfState = keptState(input.library.shelves[campus.id] ?? null, campus, input.now);
  const dumped = dumpState(shelfState);
  const order = input.library.order.includes(campus.id)
    ? input.library.order
    : [...input.library.order, campus.id];
  const library: ShelfLibrary = {
    ...input.library,
    order,
    shelves: { ...input.library.shelves, [campus.id]: dumped },
  };

  let sessionText = input.sessionText;
  if (!sessionText) {
    sessionText = dumped;
  } else {
    const active = parseState(sessionText, campus, input.now);
    if (!active.recovered && active.state.campus.id === campus.id) {
      sessionText = dumpState(keptState(sessionText, campus, input.now));
    }
  }

  return { sessionText, library, id: campus.id, title: campus.title };
}

function campusSignature(raw: string | undefined) {
  if (!raw) return "";
  try {
    const dumped = JSON.parse(raw) as { campus?: unknown };
    return JSON.stringify(dumped.campus ?? null);
  } catch {
    return "";
  }
}

export function absorbFeed(local: ShelfLibrary, incoming: ShelfLibrary, now: number): ShelfLibrary {
  const shelves = { ...local.shelves };
  const order = [...local.order];
  const seen = new Set<string>();
  for (const id of [...incoming.order, ...Object.keys(incoming.shelves)]) {
    if (seen.has(id)) continue;
    seen.add(id);
    const raw = incoming.shelves[id];
    if (!raw) continue;
    const campus = campusFromDump(raw);
    if (!campus) continue;
    if (!order.includes(id)) order.push(id);
    const previous = shelves[id];
    if (!previous) {
      shelves[id] = raw;
      continue;
    }
    if (campusSignature(previous) === campusSignature(raw)) continue;
    shelves[id] = dumpState(keptState(previous, campus, now));
  }
  return { order, shelves, saved: local.saved };
}

export function describeShelf(sessionText: string | null, library: ShelfLibrary, requestedId?: string) {
  const stories = library.order.map((id) => ({
    id,
    title: titleFromDump(library.shelves[id], id),
  }));
  const activeCampus = campusFromDump(sessionText);
  const activeId = activeCampus?.id ?? stories[0]?.id ?? "";
  const chosenId = requestedId && library.shelves[requestedId] ? requestedId : activeId;
  const campus = campusFromDump(chosenId ? library.shelves[chosenId] : sessionText);
  return { activeId, stories, campus, progress: progressFromSession(sessionText) };
}

function campusFromDump(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const dumped = JSON.parse(raw) as { campus?: unknown };
    return parseCampus(dumped.campus);
  } catch {
    return null;
  }
}

function progressFromSession(raw: string | null) {
  if (!raw) return null;
  try {
    const dumped = JSON.parse(raw) as {
      session?: { kind?: string; feed?: { current?: { cardId?: string }; completedCardIds?: string[] } };
      progress?: { dailyGoal?: number; dayPulse?: { completed?: number } };
    };
    if (dumped.session?.kind !== "feed") return null;
    return {
      cardId: dumped.session.feed?.current?.cardId ?? null,
      completedCardIds: dumped.session.feed?.completedCardIds ?? [],
      dailyGoal: dumped.progress?.dailyGoal ?? null,
      today: dumped.progress?.dayPulse?.completed ?? null,
    };
  } catch {
    return null;
  }
}
function titleFromDump(raw: string | undefined, fallback: string) {
  if (!raw) return fallback;
  try {
    const dumped = JSON.parse(raw) as { campus?: { title?: string } };
    return dumped.campus?.title || fallback;
  } catch {
    return fallback;
  }
}
