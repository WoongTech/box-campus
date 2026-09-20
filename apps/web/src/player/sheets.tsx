"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { parsePastedCampus } from "./parse-paste";
import { useCampus } from "./campus-provider";
import { useFieldFocusLock } from "./interaction-lock";

export function AccountSheet({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
}) {
  const { state, library, actions } = useCampus();
  if (!open) return null;

  const ideas = state.campus.ideas;
  const cards = state.campus.cards as LooseCard[];
  const savedCards = library.saved
    .map((cardId) => previewSaved(cardId, state.campus.title, cards, ideas, library))
    .filter((item): item is SavedPreview => item !== null);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">주제</h1>
          <p className="text-xs text-muted-foreground">표를 누르면 스토리로 들어갑니다.</p>
        </div>
        <Button type="button" variant="ghost" className="min-h-11" onClick={() => onOpenChange(false)}>
          이어서 보기
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <p className="pb-2 text-xs font-medium text-muted-foreground">따라가는 주제</p>
        {library.order.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            아직 없습니다. 아래에서 주제를 적거나 묶음을 붙이세요.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {library.order.map((id) => {
              const name = titleOf(library.shelves[id], id);
              const current = id === state.campus.id;
              const count = ideaCount(library.shelves[id]);
              return (
                <button
                  key={id}
                  type="button"
                  className={`flex aspect-[4/5] flex-col justify-between rounded-2xl border p-3 text-left ${
                    current ? "border-foreground bg-foreground text-background" : "border-border bg-card/30"
                  }`}
                  onClick={() => {
                    onOpenChange(false);
                    if (!current) actions.openAccount(id);
                  }}
                >
                  <span className="text-3xl font-semibold">{name.trim().slice(0, 1) || "주"}</span>
                  <span>
                    <span className="line-clamp-2 text-sm font-semibold">{name}</span>
                    <span className={`mt-1 block text-xs ${current ? "text-background/70" : "text-muted-foreground"}`}>
                      {current ? "이어서 보기" : count > 0 ? `${count}가지` : "초안"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <p className="pt-6 pb-2 text-xs font-medium text-muted-foreground">이 주제의 장</p>
        <div className="space-y-4">
          {state.campus.weeks.map((week) => (
            <section key={week.id}>
              <h2 className="text-sm font-semibold">
                {week.number}주 · {week.title}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{week.promise}</p>
              {week.ideaIds.length === 0 ? (
                <button
                  type="button"
                  className="mt-2 w-full rounded-2xl border border-dashed px-3 py-4 text-left"
                  onClick={onAdd}
                >
                  <span className="text-sm font-medium">아직 장이 없습니다</span>
                  <span className="mt-1 block text-xs text-muted-foreground">묶음을 붙여 이 주를 채웁니다.</span>
                </button>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {week.ideaIds.map((ideaId) => {
                    const idea = ideas.find((item) => item.id === ideaId);
                    const line = cards.find((card) => card.ideaId === ideaId && card.thesis)?.thesis;
                    return (
                      <button
                        key={ideaId}
                        type="button"
                        className="flex min-h-28 flex-col justify-between rounded-2xl border border-border bg-card/30 p-3 text-left"
                        onClick={() => {
                          actions.openIdea(ideaId);
                          onOpenChange(false);
                        }}
                      >
                        <span className="text-sm font-semibold">{idea?.title ?? "장"}</span>
                        {line ? <span className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{line}</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>

        <p className="pt-6 pb-2 text-xs font-medium text-muted-foreground">
          {savedCards.length > 0 ? `저장한 장 ${savedCards.length}` : "저장한 장"}
        </p>
        {savedCards.length === 0 ? (
          <p className="text-sm text-muted-foreground">장을 저장하면 여기에 모입니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {savedCards.map((item) => (
              <button
                key={item.cardId}
                type="button"
                className="rounded-2xl border border-border bg-card/30 p-3 text-left"
                onClick={() => {
                  actions.openSaved(item.cardId);
                  onOpenChange(false);
                }}
              >
                <span className="text-xs text-muted-foreground">{item.topic}</span>
                <span className="mt-1 line-clamp-3 block text-sm leading-snug">{item.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-border/40 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          className="min-h-11 w-full"
          disabled={state.session.kind !== "feed"}
          onClick={() => {
            onOpenChange(false);
            actions.dispatch({ kind: "start-advisor" });
          }}
        >
          새 주제 적기
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 w-full" onClick={onAdd}>
          묶음 붙이기
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full text-muted-foreground"
          onClick={() => {
            onOpenChange(false);
            actions.dispatch({ kind: "reset-sample", raw: state.campus });
          }}
        >
          이 주제 처음부터
        </Button>
      </div>
    </div>
  );
}

export function ImportSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, actions } = useCampus();
  const [focused, setFocused] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  useFieldFocusLock(focused && open);

  useEffect(() => {
    if (!open) setPasteError(null);
  }, [open]);

  const form = useForm({
    defaultValues: { raw: "" },
    onSubmit: ({ value }) => {
      const raw = parsePastedCampus(value.raw);
      if (isEmptyPaste(value.raw)) {
        setPasteError("붙여 넣을 내용이 없습니다.");
        return;
      }
      const beforeCampusId = state.campus.id;
      actions.dispatch({
        kind: "import-campus",
        raw,
        transitionId: state.transitionId,
      });
      if (isRejectedPaste(raw)) {
        setPasteError("묶음을 읽지 못했습니다. 형식을 확인해 주세요.");
        return;
      }
      setPasteError(null);
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[390px] gap-0 rounded-t-2xl pb-0">
        <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        <SheetHeader className="pb-2 text-left">
          <SheetTitle>묶음 붙이기</SheetTitle>
          <SheetDescription>
            주제를 적으면 브리프가 생깁니다. 그 브리프를 채팅에 붙여 묶음을 받고, 받은 글을 여기에 붙입니다. 그림은 없어도 됩니다.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2 px-4 pb-2 text-sm text-muted-foreground">
          <p>1. 새 주제를 적습니다.</p>
          <p>2. 브리프를 복사해 묶음을 받습니다.</p>
          <p>3. 받은 묶음을 아래에 붙입니다.</p>
        </div>
        <form
          className="space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="raw">
            {(field) => (
              <Textarea
                value={field.state.value}
                spellCheck={false}
                placeholder="묶음을 붙여 넣으세요"
                className="min-h-36 font-mono text-xs"
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  field.handleBlur();
                }}
                onChange={(event) => {
                  setPasteError(null);
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </form.Field>
          {pasteError ? (
            <p className="text-sm text-destructive" role="alert">
              {pasteError}
            </p>
          ) : null}
          {state.authorBrief ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full"
              onClick={() => {
                const brief = state.authorBrief;
                if (!brief || !navigator.clipboard?.writeText) {
                  toast("이 브라우저에서는 복사할 수 없습니다");
                  return;
                }
                void navigator.clipboard.writeText(brief).then(
                  () => toast("브리프를 복사했습니다"),
                  () => toast("이 브라우저에서는 복사할 수 없습니다"),
                );
              }}
            >
              브리프 복사
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">아직 브리프가 없습니다. 주제 갤러리에서 새 주제를 먼저 적으세요.</p>
          )}
          <Button type="submit" className="min-h-11 w-full">
            붙이기
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function isEmptyPaste(text: string) {
  return text.trim().length === 0;
}

function isRejectedPaste(raw: unknown) {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) && "invalid" in raw && !("id" in raw);
}

function titleOf(raw: string | undefined, fallback: string) {
  if (!raw) return fallback;
  try {
    const dumped = JSON.parse(raw) as { campus?: { title?: string } };
    return dumped.campus?.title || fallback;
  } catch {
    return fallback;
  }
}

type LooseCard = {
  id: string;
  ideaId: string;
  thesis?: string;
  question?: string;
  argument?: string;
  analogy?: string;
};

type SavedPreview = { cardId: string; topic: string; text: string };

function ideaCount(raw: string | undefined) {
  if (!raw) return 0;
  try {
    const dumped = JSON.parse(raw) as { campus?: { ideas?: unknown[] } };
    return dumped.campus?.ideas?.length ?? 0;
  } catch {
    return 0;
  }
}

function cardLine(card: LooseCard) {
  return card.thesis || card.question || card.argument || card.analogy || "저장한 장";
}

function previewSaved(
  cardId: string,
  topic: string,
  cards: LooseCard[],
  ideas: { id: string; title: string }[],
  library: { shelves: Record<string, string> },
): SavedPreview | null {
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
      return { cardId, topic: idea?.title ?? dumped.campus?.title ?? "저장한 장", text: cardLine(card) };
    } catch {
      continue;
    }
  }
  return { cardId, topic: "저장한 장", text: "다시 열 수 있는 장" };
}
