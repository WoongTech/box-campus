"use client";

import { AppIcon, phoneIconSize } from "@/lib/icons";
import { splitBlocks } from "./split-blocks";
import { StoryRail } from "./story-rail";
import { Wordmark } from "./brand";
import { useCampus } from "./campus-provider";

type LooseCard = {
  id: string;
  ideaId: string;
  thesis?: string;
  question?: string;
  argument?: string;
  analogy?: string;
  image?: { src: string; alt: string };
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
  const { state, library, frame, actions } = useCampus();
  const posts = postsFromLibrary(library, state);
  const hero =
    frame.kind === "card" ? splitBlocks(frame.view.blocks).hero?.text ?? state.campus.title : state.campus.title;
  const activeIdeaId = state.session.kind === "feed" ? state.session.feed.ideaId : "";
  const activeLine = (state.campus.cards as LooseCard[]).find((card) => card.ideaId === activeIdeaId && card.thesis)?.thesis ?? "";
  const showResume = Boolean(library.shelves[state.campus.id]) && Boolean(hero) && hero !== activeLine;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex justify-center border-b border-white/10 px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-2.5">
        <h1 className="m-0 font-normal">
          <Wordmark />
        </h1>
      </header>
      <div className="px-4 pt-4 pb-2">
        <StoryRail
          onCompose={onCompose}
          onSelect={(id) => {
            if (id !== state.campus.id) actions.openAccount(id);
            onOpenStory();
          }}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        {posts.length === 0 ? (
          <button type="button" className="w-full px-6 py-16 text-center" onClick={onCompose}>
            <span className="block text-sm font-medium">아직 스토리가 없습니다</span>
            <span className="mt-1 block text-xs text-muted-foreground">추가로 첫 주제를 만드세요.</span>
          </button>
        ) : (
          posts.map((post) => {
            const active = post.id === state.campus.id;
            const format = post.format;
            return (
              <section key={post.id}>
                <h2 className="px-4 pt-5 pb-1 text-sm font-semibold">{post.title}</h2>
                {active && showResume ? (
                  <button type="button" className="w-full px-4 py-3 text-left active:bg-white/5" onClick={onOpenStory}>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-semibold">{post.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">이어서</span>
                    </span>
                    <span className="mt-1 block text-[15px] leading-snug">{hero}</span>
                  </button>
                ) : null}
                {post.weeks.map((week) => {
                  const heading =
                    format === "volume" ? null : format === "series" ? week.title : `${week.number}주 · ${week.title}`;
                  const emptyHint = format === "series" ? "추가로 이 편을 채웁니다." : "추가로 이 주를 채웁니다.";
                  return (
                    <div key={week.id}>
                      {heading ? (
                        <h3 className="px-4 pt-5 pb-1 text-xs font-medium text-muted-foreground">{heading}</h3>
                      ) : null}
                      {week.promise?.trim() ? (
                        <p className={`px-4 pb-1 text-sm text-muted-foreground ${heading ? "" : "pt-5"}`}>{week.promise}</p>
                      ) : null}
                      {week.ideaIds.length === 0 ? (
                        <button
                          type="button"
                          className="mx-4 my-2 w-[calc(100%-2rem)] rounded-2xl border border-dashed border-white/20 px-4 py-4 text-left"
                          onClick={onCompose}
                        >
                          <span className="text-sm font-medium">아직 카드뉴스가 없습니다</span>
                          <span className="mt-1 block text-xs text-muted-foreground">{emptyHint}</span>
                        </button>
                      ) : (
                        week.ideaIds.map((ideaId, index) => {
                          const idea = post.ideas.find((item) => item.id === ideaId);
                          const line = post.cards.find((card) => card.ideaId === ideaId && card.thesis)?.thesis;
                          const cover = post.cards.find((card) => card.ideaId === ideaId && card.image?.src)?.image;
                          const title = idea?.title ?? "카드뉴스";
                          const current = active && ideaId === activeIdeaId;
                          const last = index === week.ideaIds.length - 1;
                          return (
                            <button
                              key={ideaId}
                              type="button"
                              className={`w-full px-4 py-3 text-left active:bg-white/5 ${last ? "" : "border-b border-white/10"}`}
                              onClick={() => onOpenIdea(post.id, ideaId)}
                            >
                              <span className="flex items-start gap-3">
                                {cover ? (
                                  <img
                                    src={cover.src}
                                    alt={cover.alt}
                                    className="size-12 shrink-0 rounded-lg object-cover"
                                  />
                                ) : null}
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-baseline justify-between gap-3">
                                    <span className="truncate text-sm font-semibold">{title}</span>
                                    {current ? (
                                      <span className="shrink-0 text-xs text-muted-foreground">이어서</span>
                                    ) : null}
                                  </span>
                                  {line ? (
                                    <span className="mt-1 line-clamp-4 block text-[15px] leading-relaxed text-foreground/90">
                                      {line}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })
        )}

        {posts.some((post) => post.id === state.campus.id) ? (
          <button
            type="button"
            className="mb-6 w-full py-4 text-center text-xs text-muted-foreground"
            onClick={() => actions.dispatch({ kind: "reset-sample", raw: state.campus })}
          >
            이 스토리 처음부터
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SavedView({ onOpenCard }: { onOpenCard: (cardId: string) => void }) {
  const { state, library } = useCampus();
  const cards = state.campus.cards as LooseCard[];
  const ideas = state.campus.ideas;
  const items = library.saved
    .map((cardId) => previewSaved(cardId, state.campus.title, cards, ideas, library))
    .filter((item): item is { cardId: string; topic: string; text: string } => item !== null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <h1 className="text-[1.35rem] font-semibold tracking-tight">저장</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center px-8 py-20 text-center">
            <AppIcon name="bookmark" size={phoneIconSize.empty} className="text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">저장한 카드가 없습니다</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">스토리에서 표시해 두면 여기에 모입니다.</p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.cardId}
              type="button"
              className="w-full border-b border-white/10 px-4 py-3 text-left active:bg-white/5"
              onClick={() => onOpenCard(item.cardId)}
            >
              <span className="block truncate text-sm font-semibold">{item.topic}</span>
              <span className="mt-1 line-clamp-3 block text-[15px] leading-relaxed">{item.text}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

type StoryWeek = { id: string; number: number; title: string; promise?: string; ideaIds: string[] };

type StoryPost = {
  id: string;
  title: string;
  format: string;
  weeks: StoryWeek[];
  ideas: { id: string; title: string }[];
  cards: LooseCard[];
};

function postsFromLibrary(
  library: { order: string[]; shelves: Record<string, string> },
  active: { campus: { id: string; title: string; format?: string; weeks: StoryWeek[]; ideas: StoryPost["ideas"]; cards: LooseCard[] } },
): StoryPost[] {
  return library.order.flatMap((id) => {
    if (id === active.campus.id) {
      return [{
        id,
        title: active.campus.title,
        format: active.campus.format ?? "course",
        weeks: active.campus.weeks,
        ideas: active.campus.ideas,
        cards: active.campus.cards,
      }];
    }
    const raw = library.shelves[id];
    if (!raw) return [];
    const post = postFromDump(id, raw);
    return post ? [post] : [];
  });
}

function postFromDump(id: string, raw: string): StoryPost | null {
  try {
    const dumped = JSON.parse(raw) as { campus?: StoryPost };
    const campus = dumped.campus;
    if (!campus?.title || !Array.isArray(campus.weeks)) return null;
    return {
      id,
      title: campus.title,
      format: campus.format ?? "course",
      weeks: campus.weeks,
      ideas: campus.ideas ?? [],
      cards: campus.cards ?? [],
    };
  } catch {
    return null;
  }
}

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
    return { cardId, topic: idea?.title ?? topic, text: cardLine(here) };
  }
  for (const raw of Object.values(library.shelves)) {
    try {
      const dumped = JSON.parse(raw) as {
        campus?: { title?: string; ideas?: { id: string; title: string }[]; cards?: LooseCard[] };
      };
      const card = dumped.campus?.cards?.find((item) => item.id === cardId);
      if (!card) continue;
      const idea = dumped.campus?.ideas?.find((item) => item.id === card.ideaId);
      return { cardId, topic: idea?.title ?? dumped.campus?.title ?? "저장한 카드", text: cardLine(card) };
    } catch {
      continue;
    }
  }
  return { cardId, topic: "저장한 카드", text: "다시 열 수 있는 카드" };
}
