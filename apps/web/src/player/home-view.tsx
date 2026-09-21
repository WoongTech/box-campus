"use client";

import { useState } from "react";
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
  const liveLine =
    frame.kind === "card" ? splitBlocks(frame.view.blocks).hero?.text ?? "" : "";
  const activeIdeaId = state.session.kind === "feed" ? state.session.feed.ideaId : "";

  return (
    <div className="flex h-full min-h-0 flex-col pb-[var(--tab-bar-height)]">
      <header className="flex shrink-0 items-center border-b border-white/10 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <h1 className="m-0 font-normal">
          <Wordmark />
        </h1>
      </header>
      <div className="shrink-0 border-b border-white/10 pt-3 pb-3">
        <StoryRail
          onCompose={onCompose}
          onSelect={(id) => {
            if (id !== state.campus.id) actions.openAccount(id);
            onOpenStory();
          }}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {posts.length === 0 ? (
          <EmptyCopy title="아직 스토리가 없습니다" detail="추가로 첫 주제를 만드세요." onClick={onCompose} />
        ) : (
          posts.map((post) => {
            const active = post.id === state.campus.id;
            const format = post.format;
            return (
              <section key={post.id}>
                <h2 className="px-4 pt-4 text-[17px] font-semibold tracking-tight">{post.title}</h2>
                {post.weeks.map((week) => {
                  const heading =
                    format === "volume" ? null : format === "series" ? week.title : `${week.number}주 · ${week.title}`;
                  const emptyHint =
                    format === "series" ? "추가로 이 편을 채웁니다." : format === "volume" ? "추가로 카드뉴스를 넣습니다." : "추가로 이 주를 채웁니다.";
                  return (
                    <div key={week.id}>
                      {heading ? (
                        <h3 className="px-4 pt-5 text-[12px] font-medium text-secondary">{heading}</h3>
                      ) : null}
                      {week.ideaIds.length === 0 ? (
                        <button
                          type="button"
                          className="mx-4 my-3 w-[calc(100%-2rem)] rounded-2xl border border-dashed border-white/20 px-4 py-4 text-left"
                          onClick={onCompose}
                        >
                          <span className="text-[15px] font-medium">아직 카드뉴스가 없습니다</span>
                          <span className="mt-1 block text-[13px] text-secondary">{emptyHint}</span>
                        </button>
                      ) : (
                        week.ideaIds.map((ideaId) => {
                          const idea = post.ideas.find((item) => item.id === ideaId);
                          const thesis = post.cards.find((card) => card.ideaId === ideaId && card.thesis)?.thesis;
                          const cover = post.cards.find((card) => card.ideaId === ideaId && card.image?.src)?.image;
                          const title = idea?.title ?? "카드뉴스";
                          const current = active && ideaId === activeIdeaId;
                          const line = current && liveLine ? liveLine : thesis;
                          return (
                            <button
                              key={ideaId}
                              type="button"
                              className="w-full border-b border-white/10 px-4 py-4 text-left active:bg-white/5"
                              onClick={() => (current ? onOpenStory() : onOpenIdea(post.id, ideaId))}
                            >
                              <span className="block min-w-0">
                                  <span className="flex items-baseline justify-between gap-3">
                                    <span className="min-w-0 truncate text-[15px] font-semibold">{title}</span>
                                    {current ? <span className="shrink-0 text-[12px] text-secondary">이어서</span> : null}
                                  </span>
                                  {line ? (
                                    <span className="mt-1 line-clamp-2 block text-[15px] leading-relaxed text-primary/80">
                                      {line}
                                    </span>
                                  ) : null}
                                  {cover ? <Cover src={cover.src} /> : null}
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
            className="w-full py-5 text-center text-[13px] text-secondary"
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
    .filter((item): item is SavedItem => item !== null);

  return (
    <div className="flex h-full min-h-0 flex-col pb-[var(--tab-bar-height)]">
      <header className="flex shrink-0 items-center border-b border-white/10 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <h1 className="flex h-6 items-center text-[15px] font-semibold tracking-tight">저장</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {items.length === 0 ? (
          <EmptyCopy title="저장한 카드가 없습니다" detail="스토리에서 표시해 두면 여기에 모입니다." />
        ) : (
          items.map((item) => (
            <button
              key={item.cardId}
              type="button"
              className="w-full border-b border-white/10 px-4 py-4 text-left active:bg-white/5"
              onClick={() => onOpenCard(item.cardId)}
            >
              {item.story !== item.topic ? (
                <span className="block truncate text-[12px] text-secondary">{item.story}</span>
              ) : null}
              <span className="mt-0.5 block truncate text-[15px] font-semibold">{item.topic}</span>
              <span className="mt-1 line-clamp-2 block text-[15px] leading-relaxed text-primary/80">{item.text}</span>
              {item.image ? <Cover src={item.image.src} /> : null}
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
  const activePost: StoryPost = {
    id: active.campus.id,
    title: active.campus.title,
    format: active.campus.format ?? "course",
    weeks: active.campus.weeks,
    ideas: active.campus.ideas,
    cards: active.campus.cards,
  };
  const listed = library.order.flatMap((id) => {
    if (id === active.campus.id) return [activePost];
    const raw = library.shelves[id];
    if (!raw) return [];
    const post = postFromDump(id, raw);
    return post ? [post] : [];
  });
  if (listed.some((post) => post.id === active.campus.id)) return listed;
  return [activePost, ...listed];
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

type SavedItem = { cardId: string; story: string; topic: string; text: string; image?: { src: string; alt: string } };

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
    return { cardId, story: topic, topic: idea?.title ?? topic, text: cardLine(here), image: here.image };
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
        image: card.image,
      };
    } catch {
      continue;
    }
  }
  return { cardId, story: "저장한 카드", topic: "저장한 카드", text: "다시 열 수 있는 카드" };
}

function Cover({ src }: { src: string }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className="mt-3 aspect-[3/2] w-full rounded-2xl object-cover"
      onError={() => setVisible(false)}
    />
  );
}

function EmptyCopy({ title, detail, onClick }: { title: string; detail: string; onClick?: () => void }) {
  const className = "w-full px-8 py-16 text-center";
  const body = (
    <>
      <span className="block text-[15px] font-medium">{title}</span>
      <span className="mt-1 block text-[13px] leading-relaxed text-secondary">{detail}</span>
    </>
  );
  if (!onClick) return <div className={className}>{body}</div>;
  return (
    <button type="button" className={className} onClick={onClick}>
      {body}
    </button>
  );
}
