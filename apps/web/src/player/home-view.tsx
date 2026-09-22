"use client";

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

type FeedIdea = {
  ideaId: string;
  title: string;
  thesis: string;
  meta: string;
  current: boolean;
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
  const { state, actions } = useCampus();
  const activeIdeaId = state.session.kind === "feed" ? state.session.feed.ideaId : "";
  const post = activePost(state);
  const ideas = feedIdeas(post, activeIdeaId);
  const initial = post.title.trim().slice(0, 1) || "스";

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
        {ideas.length === 0 ? (
          <EmptyCopy title="아직 카드뉴스가 없습니다" detail="추가로 이 스토리를 채우세요." onClick={onCompose} />
        ) : (
          <section>
            <h2 className="sr-only">{post.title}</h2>
            {ideas.map((idea) => (
              <button
                key={idea.ideaId}
                type="button"
                className={`flex w-full gap-3 border-b border-white/10 px-4 py-3.5 text-left active:bg-white/5 ${idea.current ? "bg-white/[0.04]" : ""}`}
                onClick={() => (idea.current ? onOpenStory() : onOpenIdea(post.id, idea.ideaId))}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[13px] font-semibold">
                  {initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[13px]">
                      <span className="font-semibold">{shortName(post.title)}</span>
                      <span className="text-secondary"> · {idea.meta}</span>
                    </span>
                    {idea.current ? <span className="shrink-0 text-[12px] text-secondary">이어서</span> : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-secondary">{idea.title}</span>
                  {idea.thesis ? (
                    <span className="mt-1.5 line-clamp-3 block break-keep text-[15px] leading-relaxed text-primary">{idea.thesis}</span>
                  ) : null}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="w-full py-6 text-center text-[12px] text-secondary/80"
              onClick={() => actions.dispatch({ kind: "reset-sample", raw: state.campus })}
            >
              이 스토리 처음부터
            </button>
          </section>
        )}
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
  const initial = state.campus.title.trim().slice(0, 1) || "스";

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
              className="flex w-full gap-3 border-b border-white/10 px-4 py-3.5 text-left active:bg-white/5"
              onClick={() => onOpenCard(item.cardId)}
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[13px] font-semibold">
                {initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{shortName(item.story)}</span>
                <span className="mt-0.5 block truncate text-[12px] text-secondary">{item.topic}</span>
                <span className="mt-1.5 line-clamp-3 block break-keep text-[15px] leading-relaxed text-primary">{item.text}</span>
              </span>
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

function activePost(active: {
  campus: { id: string; title: string; format?: string; weeks: StoryWeek[]; ideas: StoryPost["ideas"]; cards: LooseCard[] };
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

function feedIdeas(post: StoryPost, activeIdeaId: string): FeedIdea[] {
  const rows: FeedIdea[] = [];
  for (const week of post.weeks) {
    for (const ideaId of week.ideaIds) {
      const idea = post.ideas.find((item) => item.id === ideaId);
      const thesis = post.cards.find((card) => card.ideaId === ideaId && card.thesis)?.thesis ?? "";
      const meta =
        post.format === "volume" ? "카드뉴스" : post.format === "series" ? week.title : `${week.number}주`;
      rows.push({
        ideaId,
        title: idea?.title ?? "카드뉴스",
        thesis,
        meta,
        current: ideaId === activeIdeaId,
      });
    }
  }
  const current = rows.find((row) => row.current);
  if (!current) return rows;
  return [current, ...rows.filter((row) => row.ideaId !== current.ideaId)];
}

function shortName(name: string) {
  const head = name.split(/[:：\-–—|]/)[0]?.trim() || name.trim();
  if (head.length <= 14) return head;
  return `${head.slice(0, 13)}…`;
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
