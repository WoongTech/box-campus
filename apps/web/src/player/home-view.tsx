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
};

export function HomeView({
  onCompose,
  onOpenStory,
  onOpenIdea,
}: {
  onCompose: () => void;
  onOpenStory: () => void;
  onOpenIdea: (ideaId: string) => void;
}) {
  const { state, library, frame, actions } = useCampus();
  const shelved = Boolean(library.shelves[state.campus.id]);
  const ideas = state.campus.ideas;
  const cards = state.campus.cards as LooseCard[];
  const hero =
    frame.kind === "card" ? splitBlocks(frame.view.blocks).hero?.text ?? state.campus.title : state.campus.title;
  const currentIdeaId = state.session.kind === "feed" ? state.session.feed.ideaId : "";
  const currentLine = cards.find((card) => card.ideaId === currentIdeaId && card.thesis)?.thesis ?? "";
  const showResume = shelved && Boolean(hero) && hero !== currentLine;
  const letter = state.campus.title.trim().slice(0, 1) || "스";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-white/10 px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-2.5">
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
        {showResume ? (
          <button type="button" className="flex w-full gap-3 px-4 py-3 text-left active:bg-white/5" onClick={onOpenStory}>
            <Avatar letter={letter} />
            <span className="min-w-0 flex-1 pb-3">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold">{state.campus.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">이어서</span>
              </span>
              <span className="mt-1 block text-[15px] leading-snug">{hero}</span>
            </span>
          </button>
        ) : null}

        {shelved ? (
          state.campus.weeks.map((week) => (
          <section key={week.id}>
            <h2 className="px-4 pt-5 pb-1 text-xs font-medium text-muted-foreground">
              {week.number}주 · {week.title}
            </h2>
            {week.ideaIds.length === 0 ? (
              <button
                type="button"
                className="mx-4 my-2 w-[calc(100%-2rem)] rounded-2xl border border-dashed border-white/20 px-4 py-4 text-left"
                onClick={onCompose}
              >
                <span className="text-sm font-medium">아직 카드가 없습니다</span>
                <span className="mt-1 block text-xs text-muted-foreground">추가로 이 주를 채웁니다.</span>
              </button>
            ) : (
              week.ideaIds.map((ideaId, index) => {
                const idea = ideas.find((item) => item.id === ideaId);
                const line = cards.find((card) => card.ideaId === ideaId && card.thesis)?.thesis;
                const title = idea?.title ?? "카드";
                const current = ideaId === currentIdeaId;
                const last = index === week.ideaIds.length - 1;
                return (
                  <button
                    key={ideaId}
                    type="button"
                    className="flex w-full gap-3 px-4 py-2 text-left active:bg-white/5"
                    onClick={() => onOpenIdea(ideaId)}
                  >
                    <span className="flex flex-col items-center">
                      <Avatar letter={title.trim().slice(0, 1) || "카"} />
                      {last ? null : <span className="mt-1 w-px flex-1 bg-white/15" />}
                    </span>
                    <span className={`min-w-0 flex-1 ${last ? "pb-2" : "pb-4"}`}>
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-semibold">{title}</span>
                        {current ? <span className="shrink-0 text-xs text-muted-foreground">이어서</span> : null}
                      </span>
                      {line ? (
                        <span className="mt-1 line-clamp-4 block text-[15px] leading-relaxed text-foreground/90">{line}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })
            )}
          </section>
        ))
        ) : (
          <button type="button" className="w-full px-6 py-16 text-center" onClick={onCompose}>
            <span className="block text-sm font-medium">아직 스토리가 없습니다</span>
            <span className="mt-1 block text-xs text-muted-foreground">추가로 첫 주제를 만드세요.</span>
          </button>
        )}

        {shelved ? (
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
              className="flex w-full gap-3 px-4 py-3 text-left"
              onClick={() => onOpenCard(item.cardId)}
            >
              <Avatar letter={item.topic.trim().slice(0, 1) || "저"} />
              <span className="min-w-0 flex-1 border-b border-white/10 pb-3">
                <span className="block truncate text-sm font-semibold">{item.topic}</span>
                <span className="mt-1 line-clamp-3 block text-[15px] leading-relaxed">{item.text}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function Avatar({ letter }: { letter: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
      {letter}
    </span>
  );
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
