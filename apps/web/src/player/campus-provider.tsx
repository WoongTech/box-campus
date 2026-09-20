"use client";

import { use, useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext } from "react";
import { toast } from "sonner";
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

const SESSION_KEY = "box-campus-v1";
const LIBRARY_KEY = "box-campus-library-v1";

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
    toggleSave: () => void;
    openAccount: (id: string) => void;
  };
  meta: {
    cardId: string;
    saved: boolean;
  };
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
    if (!data?.shelves) return emptyLibrary();
    return {
      order: data.order ?? [],
      shelves: data.shelves,
      saved: data.saved ?? [],
    };
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

  useEffect(() => {
    if (!state?.notice) return;
    toast(state.notice);
  }, [state?.notice, state?.transitionId]);

  useEffect(() => {
    if (!state || !library) return;
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
  }, [library, queryClient, state]);

  const value = useMemo<CampusContextValue | null>(() => {
    if (!state || !library) return null;
    const now = () => Date.now();

    function writeLibrary(next: Library) {
      window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      queryClient.setQueryData(["library"], next);
    }

    function remember(next: PlayerState, shelf: Library) {
      const id = next.campus.id;
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

    function advance() {
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
      actions: { dispatch, advance, toggleSave, openAccount },
      meta: {
        cardId: cardIdOf(state),
        saved: library.saved.includes(cardIdOf(state)),
      },
    };
  }, [library, queryClient, state]);

  if (!value) return <main className="min-h-dvh bg-background" />;
  return <CampusContext value={value}>{children}</CampusContext>;
}

export function useCampus() {
  const value = use(CampusContext);
  if (!value) throw new Error("CampusProvider가 없습니다.");
  return value;
}
