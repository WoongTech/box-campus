"use client";

import { use, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext } from "react";
import { toast } from "sonner";
import { Wordmark } from "./brand";
import { PhoneFrame } from "./phone-frame";
import {
  BOX_CAMPUS_SAMPLE,
  dumpState,
  parseState,
  record,
  schedule,
  type CampusEvent,
  type Frame,
  type PlayerState,
} from "@box-campus/engine";
import {
  beginRemoteApply,
  bindRemoteStale,
  endRemoteApply,
  fetchSharedShelf,
  fetchShelf,
  finishAuthRedirect,
  isRemoteNewer,
  localFeedAt,
  localRemoteUser,
  localSyncedAt,
  markRemoteReady,
  rememberFeedAt,
  rememberRemoteUser,
  rememberSyncedAt,
  schedulePush,
  subscribeAuth,
  type RemoteShelf,
} from "./remote-sync";
import { absorbShelf } from "./place-campus";

const SESSION_KEY = "box-campus-v1";
const LIBRARY_KEY = "box-campus-library-v1";
const SEEDED_CAMPUS_ID = "sample-photo-exposure";

export type Library = {
  order: string[];
  shelves: Record<string, string>;
  saved: string[];
};

type CampusContextValue = {
  state: PlayerState;
  frame: Frame;
  library: Library;
  actions: {
    dispatch: (event: CampusEvent) => void;
    advance: () => void;
    back: () => void;
    toggleSave: () => void;
    openAccount: (id: string) => void;
    openIdea: (ideaId: string) => void;
    openSaved: (cardId: string) => void;
  };
  meta: {
    cardId: string;
    saved: boolean;
  };
  nav: "next" | "back";
};

const CampusContext = createContext<CampusContextValue | null>(null);

const emptyLibrary = (): Library => ({ order: [], shelves: {}, saved: [] });

function loadSession(): PlayerState {
  const raw = window.localStorage.getItem(SESSION_KEY);
  return parseState(raw, BOX_CAMPUS_SAMPLE, Date.now()).state;
}

function loadLibrary(): Library {
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY);
    const data = raw ? (JSON.parse(raw) as Partial<Library>) : null;
    const loaded = !data?.shelves
      ? emptyLibrary()
      : {
          order: data.order ?? [],
          shelves: data.shelves,
          saved: data.saved ?? [],
        };
    const stripped = withoutSeed(loaded);
    if (
      stripped.order.length !== loaded.order.length ||
      stripped.saved.length !== loaded.saved.length
    ) {
      window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(stripped));
    }
    return stripped;
  } catch {
    return emptyLibrary();
  }
}

function feedIdea(state: PlayerState) {
  return state.session.kind === "feed" ? state.session.feed.ideaId : "";
}

function cardIdOf(state: PlayerState) {
  if (state.session.kind !== "feed") return "";
  return state.session.feed.current.cardId ?? "";
}

function publishRemote() {
  const sessionRaw = window.localStorage.getItem(SESSION_KEY);
  const libraryRaw = window.localStorage.getItem(LIBRARY_KEY);
  if (!sessionRaw || !libraryRaw || sessionIsSeed(sessionRaw)) return;
  schedulePush(sessionRaw, libraryRaw);
}

function sessionIsSeed(raw: string) {
  try {
    const data = JSON.parse(raw) as { campus?: { id?: string } };
    return data.campus?.id === SEEDED_CAMPUS_ID;
  } catch {
    return false;
  }
}

function withoutSeed(library: Library): Library {
  const seeded = library.shelves[SEEDED_CAMPUS_ID];
  let saved = library.saved;
  if (seeded) {
    try {
      const dumped = JSON.parse(seeded) as { campus?: { cards?: { id: string }[] } };
      const ids = new Set((dumped.campus?.cards ?? []).map((card) => card.id));
      saved = saved.filter((id) => !ids.has(id));
    } catch {
      saved = library.saved;
    }
  }
  const shelves = { ...library.shelves };
  delete shelves[SEEDED_CAMPUS_ID];
  return {
    order: library.order.filter((id) => id !== SEEDED_CAMPUS_ID),
    shelves,
    saved,
  };
}

function libraryFromText(raw: string): Library | null {
  try {
    const data = JSON.parse(raw) as Partial<Library>;
    if (!data.shelves) return null;
    return {
      order: data.order ?? [],
      shelves: data.shelves,
      saved: data.saved ?? [],
    };
  } catch {
    return null;
  }
}

export function CampusProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: loadSession,
    staleTime: Infinity,
  });
  const libraryQuery = useQuery({
    queryKey: ["library"],
    queryFn: loadLibrary,
    staleTime: Infinity,
  });

  const state = sessionQuery.data;
  const library = libraryQuery.data;
  const navDirection = useRef<"next" | "back">("next");
  const reconciledUser = useRef<string | null>(null);

  useEffect(() => {
    void finishAuthRedirect().then((message) => {
      if (message) toast(message);
    });
  }, []);

  useEffect(() => {
    if (!state?.notice) return;
    toast(state.notice);
  }, [state?.notice, state?.transitionId]);

  useEffect(() => {
    if (!state || !library) return;
    if (state.campus.id !== SEEDED_CAMPUS_ID) return;
    const nextId = library.order.find((id) => library.shelves[id]);
    const raw = nextId ? library.shelves[nextId] : null;
    if (!raw) return;
    const next = parseState(raw, BOX_CAMPUS_SAMPLE, Date.now()).state;
    if (next.campus.id === SEEDED_CAMPUS_ID) return;
    window.localStorage.setItem(SESSION_KEY, dumpState(next));
    queryClient.setQueryData(["session"], next);
  }, [library, queryClient, state]);

  useEffect(() => {
    if (!state || !library) return;
    if (state.campus.id === SEEDED_CAMPUS_ID) return;
    if (library.shelves[state.campus.id]) return;
    const stored: Library = {
      ...library,
      shelves: { ...library.shelves, [state.campus.id]: dumpState(state) },
      order: library.order.includes(state.campus.id)
        ? library.order
        : [...library.order, state.campus.id],
    };
    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(stored));
    queryClient.setQueryData(["library"], stored);
    publishRemote();
  }, [library, queryClient, state]);

  useEffect(() => {
    if (!sessionQuery.isSuccess || !libraryQuery.isSuccess) return;

    function applyShelf(remote: RemoteShelf, message: string | null) {
      const incoming = withoutSeed(libraryFromText(remote.library) ?? emptyLibrary());
      const current = queryClient.getQueryData<Library>(["library"]) ?? emptyLibrary();
      const nextLibrary = absorbShelf(current, incoming, Date.now());
      const parsed = parseState(remote.session, BOX_CAMPUS_SAMPLE, Date.now());
      beginRemoteApply();
      window.localStorage.setItem(SESSION_KEY, dumpState(parsed.state));
      window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(nextLibrary));
      rememberSyncedAt(remote.updatedAt);
      queryClient.setQueryData(["session"], parsed.state);
      queryClient.setQueryData(["library"], nextLibrary);
      endRemoteApply();
      if (message) toast(message);
    }

    async function pullIfNewer(message: string | null) {
      const result = await fetchShelf();
      if ("error" in result || !result.shelf) return;
      if (!isRemoteNewer(result.shelf.updatedAt, localSyncedAt())) return;
      applyShelf(result.shelf, message);
    }

    async function reconcile(userId: string) {
      const result = await fetchShelf();
      if ("error" in result) {
        markRemoteReady();
        toast("다른 기기와 맞추지 못했습니다");
        return;
      }
      const remote = result.shelf;
      const lastUser = localRemoteUser();
      if (remote && (lastUser !== userId || isRemoteNewer(remote.updatedAt, localSyncedAt()))) {
        applyShelf(remote, "다른 기기의 기록을 가져왔습니다");
        rememberRemoteUser(userId);
        return;
      }
      rememberRemoteUser(userId);
      markRemoteReady();
      const current = queryClient.getQueryData<PlayerState>(["session"]);
      const sessionRaw = window.localStorage.getItem(SESSION_KEY) ?? (current ? dumpState(current) : null);
      const libraryRaw = window.localStorage.getItem(LIBRARY_KEY);
      if (sessionRaw && libraryRaw) schedulePush(sessionRaw, libraryRaw);
    }

    bindRemoteStale(() => {
      void pullIfNewer("다른 기기의 기록을 가져왔습니다");
    });
    const stopAuth = subscribeAuth((user) => {
      if (!user) {
        reconciledUser.current = null;
        return;
      }
      if (reconciledUser.current === user.id) return;
      reconciledUser.current = user.id;
      void reconcile(user.id);
    });

    async function pullShared(message: string | null) {
      const result = await fetchSharedShelf();
      if ("error" in result || !result.updatedAt) return;
      if (!isRemoteNewer(result.updatedAt, localFeedAt())) return;
      const current = queryClient.getQueryData<Library>(["library"]) ?? emptyLibrary();
      const nextLibrary = withoutSeed(absorbShelf(current, result.library, Date.now()));
      const added = nextLibrary.order.some((id) => !current.order.includes(id));
      beginRemoteApply();
      window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(nextLibrary));
      rememberFeedAt(result.updatedAt);
      queryClient.setQueryData(["library"], nextLibrary);
      endRemoteApply();
      if (message && added) toast(message);
    }

    void pullShared(null);
    const poll = window.setInterval(() => {
      void pullShared("스토리가 갱신되었습니다");
      void pullIfNewer("스토리가 갱신되었습니다");
    }, 8000);
    function onFocus() {
      void pullShared("스토리가 갱신되었습니다");
      void pullIfNewer("스토리가 갱신되었습니다");
    }
    window.addEventListener("focus", onFocus);
    return () => {
      stopAuth();
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [libraryQuery.isSuccess, queryClient, sessionQuery.isSuccess]);

  const value = useMemo<CampusContextValue | null>(() => {
    if (!state || !library) return null;
    const now = () => Date.now();

    function writeLibrary(next: Library) {
      window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      queryClient.setQueryData(["library"], next);
      publishRemote();
    }

    function remember(next: PlayerState, shelf: Library) {
      const id = next.campus.id;
      if (id === SEEDED_CAMPUS_ID) return shelf;
      const stored: Library = {
        ...shelf,
        shelves: { ...shelf.shelves, [id]: dumpState(next) },
        order: shelf.order.includes(id) ? shelf.order : [...shelf.order, id],
      };
      writeLibrary(stored);
      return stored;
    }

    function commit(next: PlayerState) {
      window.localStorage.setItem(SESSION_KEY, dumpState(next));
      queryClient.setQueryData(["session"], next);
      const shelf = queryClient.getQueryData<Library>(["library"]) ?? library!;
      remember(next, shelf);
      return next;
    }

    function dispatch(event: CampusEvent) {
      const current = queryClient.getQueryData<PlayerState>(["session"]);
      if (!current) return;
      commit(record(current, event, now()));
    }

    function openAccount(id: string) {
      const shelf = queryClient.getQueryData<Library>(["library"]);
      const raw = shelf?.shelves[id];
      if (!raw) return;
      commit(parseState(raw, BOX_CAMPUS_SAMPLE, now()).state);
    }

    function openIdea(ideaId: string) {
      const current = queryClient.getQueryData<PlayerState>(["session"]);
      if (!current) return;
      commit(
        record(
          current,
          { kind: "open-idea", ideaId, transitionId: current.transitionId },
          now(),
        ),
      );
    }

    function openSaved(cardId: string) {
      const current = queryClient.getQueryData<PlayerState>(["session"]);
      const shelf = queryClient.getQueryData<Library>(["library"]);
      if (!current || !shelf) return;
      const onThisCampus = current.campus.cards.some((card) => card.id === cardId);
      if (onThisCampus) {
        commit(
          record(
            current,
            { kind: "open-card", cardId, transitionId: current.transitionId },
            now(),
          ),
        );
        return;
      }
      for (const id of shelf.order) {
        const raw = shelf.shelves[id];
        if (!raw) continue;
        let parsed: { campus?: { cards?: { id: string }[] } };
        try {
          parsed = JSON.parse(raw) as { campus?: { cards?: { id: string }[] } };
        } catch {
          continue;
        }
        if (!parsed.campus?.cards?.some((card) => card.id === cardId)) continue;
        const opened = parseState(raw, BOX_CAMPUS_SAMPLE, now()).state;
        commit(
          record(
            opened,
            { kind: "open-card", cardId, transitionId: opened.transitionId },
            now(),
          ),
        );
        return;
      }
    }

    function advance() {
      navDirection.current = "next";
      const current = queryClient.getQueryData<PlayerState>(["session"]);
      const shelf = queryClient.getQueryData<Library>(["library"]);
      if (!current || !shelf) return;
      const beforeId = current.campus.id;
      const beforeIdea = feedIdea(current);
      const currentFrame = schedule(current, now(), { kind: "resume" });
      if (currentFrame.kind !== "card" || currentFrame.view.control.kind !== "advance") return;
      const next = commit(record(current, { kind: "advance", transitionId: currentFrame.transitionId }, now()));
      const order = queryClient.getQueryData<Library>(["library"])?.order ?? shelf.order;
      if (order.length < 2 || feedIdea(next) === beforeIdea) return;
      const index = order.indexOf(beforeId);
      const nextId = order[(index + 1) % order.length];
      if (nextId && nextId !== next.campus.id) openAccount(nextId);
    }

    function back() {
      navDirection.current = "back";
      const current = queryClient.getQueryData<PlayerState>(["session"]);
      if (!current) return;
      const currentFrame = schedule(current, now(), { kind: "resume" });
      if (currentFrame.kind !== "card") return;
      commit(
        record(current, { kind: "back", transitionId: currentFrame.transitionId }, now()),
      );
    }

    function toggleSave() {
      const current = queryClient.getQueryData<PlayerState>(["session"]);
      const shelf = queryClient.getQueryData<Library>(["library"]);
      if (!current || !shelf) return;
      const cardId = cardIdOf(current);
      if (!cardId) return;
      const saved = shelf.saved.includes(cardId)
        ? shelf.saved.filter((id) => id !== cardId)
        : [...shelf.saved, cardId];
      writeLibrary({ ...shelf, saved });
    }

    return {
      state,
      frame: schedule(state, now(), { kind: "resume" }),
      library,
      actions: { dispatch, advance, back, toggleSave, openAccount, openIdea, openSaved },
      meta: {
        cardId: cardIdOf(state),
        saved: library.saved.includes(cardIdOf(state)),
      },
      nav: navDirection.current,
    };
  }, [library, queryClient, state]);

  if (!value) {
    return (
      <PhoneFrame role="main" className="flex items-center justify-center">
        <Wordmark />
      </PhoneFrame>
    );
  }
  return <CampusContext value={value}>{children}</CampusContext>;
}

export function useCampus() {
  const value = use(CampusContext);
  if (!value) throw new Error("CampusProvider가 없습니다.");
  return value;
}
