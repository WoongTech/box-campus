"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppIcon, phoneIconSize } from "@/lib/icons";
import { StoryRail } from "./story-rail";
import { StoryMark } from "./story-mark";
import { Wordmark } from "./brand";
import { useCampus, type Library } from "./campus-provider";

type LooseCard = {
  id: string;
  ideaId: string;
  thesis?: string;
  question?: string;
  argument?: string;
  analogy?: string;
  image?: { src: string; alt: string };
};

type StoryWeek = { id: string; number: number; title: string; promise?: string; ideaIds: string[] };

type StoryPost = {
  id: string;
  title: string;
  format: string;
  weeks: StoryWeek[];
  ideas: { id: string; title: string }[];
  cards: LooseCard[];
};

type FeedRow = {
  key: string;
  campusId: string;
  handle: string;
  ideaId: string;
  cardId: string;
  title: string;
  thesis: string;
  meta: string;
  current: boolean;
  weekLabel: string;
  thread: "solo" | "start" | "mid" | "end";
};

export function HomeView({
  onCompose,
  onOpenStory,
  onOpenIdea,
}: {
  onCompose: () => void;
  onOpenStory: () => void;
  onOpenIdea: (campusId: string, ideaId: string) => void;
}) {
  const { state, library, actions } = useCampus();
  const [resetArmed, setResetArmed] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const activeIdeaId = state.session.kind === "feed" ? state.session.feed.ideaId : "";
  const active = activePost(state);
  const rows = useMemo(
    () => buildTimeline(active, library, activeIdeaId),
    [active, library, activeIdeaId],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.handle.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.thesis.toLowerCase().includes(q) ||
        row.meta.toLowerCase().includes(q) ||
        row.weekLabel.toLowerCase().includes(q),
    );
  }, [rows, query]);
  const continueRow = rows.find((row) => row.current) ?? null;
  const ideaCount = active.ideas.length;
  const weekCount = active.weeks.filter((week) => week.ideaIds.length > 0).length;

  useEffect(() => {
    function onTop() {
      scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.addEventListener("alter:home-top", onTop);
    return () => window.removeEventListener("alter:home-top", onTop);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="relative flex shrink-0 items-center justify-center px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-2">
        <h1 className="m-0 font-normal">
          <Wordmark />
        </h1>
        <button
          type="button"
          className="absolute right-3 top-[max(0.55rem,calc(env(safe-area-inset-top)-0.1rem))] flex size-10 items-center justify-center text-secondary active:text-primary"
          aria-label={searchOpen ? "검색 닫기" : "검색"}
          aria-pressed={searchOpen}
          onClick={() => {
            setSearchOpen((open) => {
              if (open) setQuery("");
              return !open;
            });
          }}
        >
          <AppIcon name={searchOpen ? "close" : "search"} size={20} />
        </button>
      </header>
      <div className="shrink-0 pb-1">
        <StoryRail
          onCompose={onCompose}
          onSelect={(id) => {
            if (id !== state.campus.id) actions.openAccount(id);
            onOpenStory();
          }}
        />
      </div>

      {searchOpen ? (
        <div className="shrink-0 border-y border-white/[0.08] px-4 py-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="글·스토리 검색"
            aria-label="검색"
            autoFocus
            className="h-10 w-full rounded-full border border-white/15 bg-white/5 px-4 text-[15px] text-primary outline-none placeholder:text-secondary"
          />
        </div>
      ) : (
        <>
          <button
            type="button"
            className="flex shrink-0 items-center gap-3 border-y border-white/[0.08] px-4 py-3 text-left active:bg-white/[0.03]"
            onClick={onCompose}
          >
            <StoryMark seed={active.id} size={36} />
            <span className="min-w-0 flex-1 text-[15px] text-secondary">새 스토리를 적어 보세요…</span>
          </button>
          <div className="flex shrink-0 items-center gap-3 px-4 py-3">
            <StoryMark seed={active.id} size={44} title={active.title} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-5">{shortName(active.title)}</p>
              <p className="truncate text-[13px] text-secondary">
                글 {ideaCount} · {active.format === "course" ? `주 ${weekCount}` : active.format === "series" ? "시리즈" : "묶음"}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[13px] font-medium active:bg-white/10"
              onClick={onOpenStory}
            >
              열기
            </button>
          </div>
          {continueRow ? (
            <button
              type="button"
              className="mx-4 mb-2 flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left active:bg-white/[0.07]"
              onClick={onOpenStory}
            >
              <StoryMark seed={continueRow.campusId} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium text-secondary">이어서 보기</span>
                <span className="mt-0.5 block truncate text-[14px] font-semibold">{continueRow.title}</span>
              </span>
              <span className="shrink-0 text-[13px] text-secondary">계속</span>
            </button>
          ) : null}
        </>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {filtered.length === 0 ? (
          query.trim() ? (
            <EmptyCopy title="검색 결과가 없습니다" detail="다른 단어로 다시 찾아 보세요." />
          ) : (
            <EmptyCopy title="아직 글이 없습니다" detail="추가로 이 스토리를 채우세요." onClick={onCompose} />
          )
        ) : (
          <section>
            <h2 className="sr-only">글 모음</h2>
            {filtered.map((row, index) => {
              const prev = filtered[index - 1];
              const showWeek =
                Boolean(row.weekLabel) &&
                (!prev || prev.campusId !== row.campusId || prev.weekLabel !== row.weekLabel);
              const saved = library.saved.includes(row.cardId);
              return (
                <div key={row.key}>
                  {showWeek ? (
                    <p className="px-4 pt-5 pb-1 text-[12px] font-medium tracking-wide text-secondary/80">
                      {row.campusId === active.id ? row.weekLabel : `${row.handle} · ${row.weekLabel}`}
                    </p>
                  ) : null}
                  <article
                    className={`grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 border-b border-white/[0.08] px-4 pt-3.5 ${
                      row.current ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    <div className="relative flex flex-col items-center">
                      <span className="z-10">
                        <StoryMark seed={row.campusId} size={36} title={row.handle} />
                      </span>
                      {row.thread === "start" || row.thread === "mid" ? (
                        <span className="absolute top-9 bottom-0 w-px bg-white/15" aria-hidden />
                      ) : null}
                      {row.thread === "end" || row.thread === "mid" ? (
                        <span className="absolute top-0 h-1 w-px bg-white/15" aria-hidden />
                      ) : null}
                    </div>
                    <div className="min-w-0 pb-2">
                      <button
                        type="button"
                        className="w-full text-left active:opacity-90"
                        onClick={() =>
                          row.current ? onOpenStory() : onOpenIdea(row.campusId, row.ideaId)
                        }
                      >
                        <span className="flex min-w-0 items-baseline gap-1.5">
                          <span className="truncate text-[15px] font-semibold leading-5 text-primary">
                            {row.handle}
                          </span>
                          <span className="shrink-0 text-[13px] leading-5 text-secondary">· {row.meta}</span>
                          {row.current ? (
                            <span className="ml-auto shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              이어서
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block break-keep text-[15px] leading-[1.4] text-primary">
                          <span className="font-semibold">{row.title}</span>
                          {row.thesis ? (
                            <>
                              <span className="whitespace-pre-wrap">{"\n"}</span>
                              <span className="font-normal text-primary/90">{clampText(row.thesis, 5)}</span>
                            </>
                          ) : null}
                        </span>
                      </button>
                      <div className="mt-2 flex items-center gap-1">
                        <button
                          type="button"
                          className={`flex h-9 items-center gap-1.5 rounded-full px-2 text-[13px] active:bg-white/10 ${
                            saved ? "text-primary" : "text-secondary"
                          }`}
                          aria-label={saved ? "저장됨" : "저장"}
                          aria-pressed={saved}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!row.cardId) return;
                            actions.toggleSaveCard(row.cardId);
                          }}
                        >
                          <AppIcon
                            name="bookmark"
                            size={18}
                            strokeWidth={saved ? 2.2 : 1.7}
                          />
                          {saved ? "저장됨" : "저장"}
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
            {!query.trim() ? (
              <button
                type="button"
                className={`w-full py-5 text-center text-[13px] active:text-primary ${
                  resetArmed ? "font-medium text-primary" : "text-secondary"
                }`}
                onClick={() => {
                  if (!resetArmed) {
                    setResetArmed(true);
                    window.setTimeout(() => setResetArmed(false), 4000);
                    return;
                  }
                  setResetArmed(false);
                  actions.dispatch({ kind: "reset-sample", raw: state.campus });
                }}
              >
                {resetArmed ? "다시 누르면 처음부터" : "이 스토리 처음부터"}
              </button>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}

export function SavedView({ onOpenCard }: { onOpenCard: (cardId: string) => void }) {
  const { state, library, actions } = useCampus();
  const [query, setQuery] = useState("");
  const cards = state.campus.cards as LooseCard[];
  const ideas = state.campus.ideas;
  const items = library.saved
    .map((cardId) => previewSaved(cardId, state.campus.title, cards, ideas, library))
    .filter((item): item is SavedItem => item !== null)
    .filter((item) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        item.story.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q)
      );
    });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-col gap-2 border-b border-white/[0.08] px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-3">
        <h1 className="flex h-6 items-center text-[17px] font-bold tracking-tight">저장</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="저장한 글 검색"
          aria-label="저장 검색"
          className="h-10 w-full rounded-full border border-white/15 bg-white/5 px-4 text-[15px] text-primary outline-none placeholder:text-secondary"
        />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {items.length === 0 ? (
          query.trim() ? (
            <EmptyCopy title="검색 결과가 없습니다" detail="다른 단어로 다시 찾아 보세요." />
          ) : (
            <EmptyCopy title="저장한 글이 없습니다" detail="스토리에서 북마크로 남겨 두면 여기에 모입니다." />
          )
        ) : (
          items.map((item) => {
            return (
              <div
                key={item.cardId}
                className="flex w-full items-stretch border-b border-white/[0.08]"
              >
                <button
                  type="button"
                  className="grid min-w-0 flex-1 grid-cols-[36px_minmax(0,1fr)] gap-x-3 px-4 py-3.5 text-left active:bg-white/[0.03]"
                  onClick={() => onOpenCard(item.cardId)}
                >
                  <span className="row-span-2 mt-0.5">
                    <StoryMark seed={item.story} size={36} title={item.story} />
                  </span>
                  <span className="truncate text-[15px] font-semibold leading-5 text-primary">
                    {shortName(item.story)}
                  </span>
                  <span className="col-start-2 mt-1 min-w-0 break-keep text-[15px] leading-[1.4] text-primary">
                    <span className="font-semibold">{item.topic}</span>
                    <span className="whitespace-pre-wrap">{"\n"}</span>
                    <span className="font-normal text-primary/90">{clampText(item.text, 5)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-12 shrink-0 items-center justify-center text-primary active:opacity-70"
                  aria-label="저장 해제"
                  onClick={() => actions.unsaveCard(item.cardId)}
                >
                  <AppIcon name="bookmark" size={20} strokeWidth={2.2} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function activePost(active: {
  campus: {
    id: string;
    title: string;
    format?: string;
    weeks: StoryWeek[];
    ideas: StoryPost["ideas"];
    cards: LooseCard[];
  };
}): StoryPost {
  return {
    id: active.campus.id,
    title: active.campus.title,
    format: active.campus.format ?? "course",
    weeks: active.campus.weeks,
    ideas: active.campus.ideas,
    cards: active.campus.cards,
  };
}

function campusFromDump(raw: string | undefined): StoryPost | null {
  if (!raw) return null;
  try {
    const dumped = JSON.parse(raw) as {
      campus?: {
        id?: string;
        title?: string;
        format?: string;
        weeks?: StoryWeek[];
        ideas?: { id: string; title: string }[];
        cards?: LooseCard[];
      };
    };
    const campus = dumped.campus;
    if (!campus?.id || !campus.title) return null;
    return {
      id: campus.id,
      title: campus.title,
      format: campus.format ?? "course",
      weeks: campus.weeks ?? [],
      ideas: campus.ideas ?? [],
      cards: campus.cards ?? [],
    };
  } catch {
    return null;
  }
}

function rowsForPost(post: StoryPost, activeIdeaId: string, activeCampusId: string): FeedRow[] {
  const rows: FeedRow[] = [];
  for (const week of post.weeks) {
    const weekRows: FeedRow[] = [];
    for (const ideaId of week.ideaIds) {
      const idea = post.ideas.find((item) => item.id === ideaId);
      const thesisCard =
        post.cards.find((card) => card.ideaId === ideaId && card.thesis) ??
        post.cards.find((card) => card.ideaId === ideaId);
      const meta =
        post.format === "volume" ? "카드뉴스" : post.format === "series" ? week.title : `${week.number}주`;
      weekRows.push({
        key: `${post.id}:${ideaId}`,
        campusId: post.id,
        handle: shortName(post.title),
        ideaId,
        cardId: thesisCard?.id ?? "",
        title: idea?.title ?? "카드뉴스",
        thesis: thesisCard?.thesis ?? "",
        meta,
        current: post.id === activeCampusId && ideaId === activeIdeaId,
        weekLabel: post.format === "course" ? `${week.number}주 · ${week.title}` : week.title,
        thread: "solo",
      });
    }
    const marked = weekRows.map((row, index) => ({
      ...row,
      thread:
        weekRows.length === 1
          ? ("solo" as const)
          : index === 0
            ? ("start" as const)
            : index === weekRows.length - 1
              ? ("end" as const)
              : ("mid" as const),
    }));
    rows.push(...marked);
  }
  return rows;
}

function buildTimeline(active: StoryPost, library: Library, activeIdeaId: string): FeedRow[] {
  const activeRows = rowsForPost(active, activeIdeaId, active.id);
  const continueRow = activeRows.find((row) => row.current) ?? null;
  const restActive = activeRows.filter((row) => !row.current);

  const other: FeedRow[] = [];
  for (const id of library.order) {
    if (id === active.id) continue;
    const post = campusFromDump(library.shelves[id]);
    if (!post) continue;
    other.push(...rowsForPost(post, "", active.id));
  }

  return [...(continueRow ? [{ ...continueRow, thread: "solo" as const }] : []), ...restActive, ...other];
}

function shortName(name: string) {
  const head = name.split(/[:：\-–—|]/)[0]?.trim() || name.trim();
  if (head.length <= 18) return head;
  return `${head.slice(0, 17)}…`;
}

function clampText(text: string, lines: number) {
  const max = lines * 42;
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

type SavedItem = { cardId: string; story: string; topic: string; text: string };

function cardLine(card: LooseCard) {
  return card.thesis || card.question || card.argument || card.analogy || "저장한 카드";
}

function previewSaved(
  cardId: string,
  topic: string,
  cards: LooseCard[],
  ideas: { id: string; title: string }[],
  library: { shelves: Record<string, string> },
) {
  const here = cards.find((card) => card.id === cardId);
  if (here) {
    const idea = ideas.find((item) => item.id === here.ideaId);
    return { cardId, story: topic, topic: idea?.title ?? topic, text: cardLine(here) };
  }
  for (const raw of Object.values(library.shelves)) {
    try {
      const dumped = JSON.parse(raw) as {
        campus?: { title?: string; ideas?: { id: string; title: string }[]; cards?: LooseCard[] };
      };
      const card = dumped.campus?.cards?.find((item) => item.id === cardId);
      if (!card) continue;
      const idea = dumped.campus?.ideas?.find((item) => item.id === card.ideaId);
      return {
        cardId,
        story: dumped.campus?.title ?? "저장한 카드",
        topic: idea?.title ?? dumped.campus?.title ?? "저장한 카드",
        text: cardLine(card),
      };
    } catch {
      continue;
    }
  }
  return { cardId, story: "저장한 카드", topic: "저장한 카드", text: "다시 열 수 있는 카드" };
}

function EmptyCopy({ title, detail, onClick }: { title: string; detail: string; onClick?: () => void }) {
  if (!onClick) {
    return (
      <div className="w-full px-8 py-16 text-center">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="mt-1 block text-[15px] leading-relaxed text-secondary">{detail}</span>
      </div>
    );
  }
  return (
    <div className="flex w-full flex-col items-center px-8 py-16 text-center">
      <span className="block text-[15px] font-semibold">{title}</span>
      <span className="mt-1 block text-[15px] leading-relaxed text-secondary">{detail}</span>
      <button
        type="button"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-black active:bg-white/90"
        onClick={onClick}
      >
        <AppIcon name="plus" size={phoneIconSize.sheet} />
        추가하기
      </button>
    </div>
  );
}
