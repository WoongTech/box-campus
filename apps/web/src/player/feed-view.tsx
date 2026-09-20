"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { BookmarkIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BOX_CAMPUS_SAMPLE, type Block } from "@box-campus/engine";
import { useCampus } from "./campus-provider";
import { useFieldFocusLock } from "./interaction-lock";
import { splitBlocks } from "./split-blocks";

export function FeedView({
  onOpenAccounts,
}: {
  onOpenAccounts: () => void;
}) {
  const { state, frame, actions, meta, nav } = useCampus();
  if (frame.kind !== "card") return null;
  const view = frame.view;
  const split = splitBlocks(view.blocks);
  const initial = state.campus.title.trim().slice(0, 1);
  const hasChoices = view.control.kind === "choices";
  const hasText = view.control.kind === "text";
  const canTapAdvance = view.control.kind === "advance";
  const eyebrows = split.meta.filter((block) => block.kind === "eyebrow");
  const dockEyebrow = eyebrows[0]?.text;
  const promptEyebrows = eyebrows.slice(1);
  const showMetaInStrip =
    !hasChoices && split.meta.length > 0 && view.role !== "advisor";

  return (
    <section className="relative flex min-h-dvh flex-col">
      {typeof view.pentadIndex === "number" ? (
        <div
          className="pointer-events-none absolute inset-x-3 top-[max(0.65rem,env(safe-area-inset-top))] z-10 flex gap-1"
          aria-hidden
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Progress
              key={index}
              value={index <= view.pentadIndex! ? 100 : 0}
              className="h-0.5 flex-1 bg-muted/40 [&>div]:bg-foreground"
            />
          ))}
        </div>
      ) : null}

      <div
        className="absolute inset-x-3 top-[max(1.35rem,env(safe-area-inset-top)+0.7rem)] z-20 flex items-center justify-between gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="flex min-w-0 items-center gap-2"
          onClick={onOpenAccounts}
        >
          <Avatar>
            <AvatarFallback className="text-xs">{initial || "주"}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-semibold">{state.campus.title}</span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          aria-label={view.role === "advisor" ? "돌아가기" : "나가기"}
          onClick={() => {
            if (view.role === "advisor") {
              actions.dispatch({ kind: "cancel-advisor" });
              return;
            }
            onOpenAccounts();
          }}
        >
          <XIcon className="size-5" />
        </Button>
      </div>

      <div
        key={frame.transitionId}
        className={[
          "flex min-h-0 flex-1 flex-col px-5 pt-[max(5.5rem,env(safe-area-inset-top)+4.25rem)]",
          hasChoices || hasText ? "pb-3" : "pb-2",
          "animate-in fade-in duration-300",
          nav === "back" ? "slide-in-from-left-8" : "slide-in-from-right-8",
        ].join(" ")}
      >
        <div
          className={
            hasChoices || hasText
              ? "flex min-h-0 flex-1 flex-col justify-end gap-3"
              : "flex min-h-0 flex-1 flex-col justify-center gap-4 text-center"
          }
        >
          {view.role === "advisor"
            ? split.meta
                .filter((block) => block.kind === "eyebrow")
                .map((block, index) => (
                  <p key={`step-${index}`} className="text-xs font-medium text-muted-foreground">
                    {block.text}
                  </p>
                ))
            : null}
          {hasChoices
            ? promptEyebrows.map((block, index) => (
                <p
                  key={`prompt-${index}`}
                  className="text-sm font-medium text-foreground"
                >
                  {block.text}
                </p>
              ))
            : null}
          {split.hero ? (
            <Hero block={split.hero} centered={!hasChoices && !hasText} />
          ) : (
            <h1 className="text-2xl leading-snug font-semibold tracking-tight text-balance">
              {state.campus.title}
            </h1>
          )}
          {split.verdict ? (
            <p
              className={
                split.verdict.tone === "retry"
                  ? "text-sm font-medium text-destructive"
                  : "text-sm font-medium text-foreground"
              }
            >
              {split.verdict.text}
            </p>
          ) : null}
          {split.reading.map((block, index) => (
            <ReadingLine key={`${block.kind}-${index}`} block={block} centered={!hasChoices && !hasText} />
          ))}
          {view.role === "hub" ? <TopicRail /> : null}
          {showMetaInStrip
            ? split.meta.map((block, index) => (
                <MetaLine key={`${block.kind}-${index}`} block={block} centered={!hasChoices && !hasText} />
              ))
            : null}
        </div>
      </div>

      <div
        className="z-10 shrink-0 space-y-3 border-t border-border/40 bg-background/90 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] backdrop-blur-sm supports-backdrop-filter:bg-background/75"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-sm font-semibold tracking-tight">
              {state.campus.title}
              {view.dayCount > 0 ? (
                <Badge variant="secondary" className="ml-2 align-middle text-[11px]">
                  오늘 {view.dayCount}
                </Badge>
              ) : null}
            </p>
            {hasChoices && dockEyebrow ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {dockEyebrow}
              </p>
            ) : null}
            {state.authorBrief ? (
              <Button
                type="button"
                variant="link"
                className="mt-1 h-auto px-0 text-xs text-muted-foreground"
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
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="size-11 rounded-full p-0"
              aria-label="따라가는 주제"
              onClick={onOpenAccounts}
            >
              <Avatar size="lg">
                <AvatarFallback className="text-sm">{initial || "주"}</AvatarFallback>
              </Avatar>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="size-11 rounded-full"
              aria-label={meta.saved ? "저장됨" : "저장"}
              aria-pressed={meta.saved}
              disabled={!meta.cardId}
              onClick={actions.toggleSave}
            >
              <BookmarkIcon
                className={
                  meta.saved ? "size-6 fill-current text-foreground" : "size-6 text-foreground/80"
                }
              />
            </Button>
          </div>
        </div>

        {view.control.kind === "choices" ? (
          <div className="flex flex-col gap-2">
            {view.control.options.map((option) => (
              <Button
                key={option.actionId}
                type="button"
                variant="secondary"
                className="h-auto min-h-12 w-full justify-start px-3 py-3 text-left text-[15px] leading-snug whitespace-normal"
                onClick={() =>
                  actions.dispatch({
                    kind: "activate",
                    transitionId: frame.transitionId,
                    actionId: option.actionId,
                    raw: option.actionId.includes("hub-2") ? BOX_CAMPUS_SAMPLE : undefined,
                  })
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : null}

        {view.control.kind === "text" ? (
          <TextStep
            key={frame.transitionId}
            actionId={view.control.actionId}
            label={view.control.label}
            placeholder={view.control.placeholder}
            maxLength={view.control.maxLength}
            transitionId={frame.transitionId}
          />
        ) : null}

        {view.role === "advisor" ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full text-muted-foreground"
            onClick={() => actions.dispatch({ kind: "cancel-advisor" })}
          >
            돌아가기
          </Button>
        ) : null}

        {view.role === "hub" ? (
          <Button type="button" className="min-h-11 w-full" onClick={onOpenAccounts}>
            주제 갤러리
          </Button>
        ) : null}

        {canTapAdvance && view.role === "day-close" ? (
          <p className="text-center text-xs text-muted-foreground">오늘은 여기까지입니다. 내일 이어서 봅니다.</p>
        ) : null}

        {canTapAdvance && view.role !== "day-close" && view.role !== "hub" ? (
          <p className="text-center text-xs text-muted-foreground">왼쪽은 이전, 오른쪽은 다음</p>
        ) : null}
      </div>
    </section>
  );
}

function TopicRail() {
  const { state, library, actions } = useCampus();
  if (library.order.length === 0) return null;
  return (
    <div className="mx-auto flex w-full max-w-[22rem] gap-2 overflow-x-auto pt-2">
      {library.order.map((id) => {
        const name = titleFromShelf(library.shelves[id], id);
        const current = id === state.campus.id;
        return (
          <button
            key={id}
            type="button"
            className={`flex h-28 w-24 shrink-0 flex-col justify-between rounded-2xl border px-3 py-3 text-left ${
              current ? "border-foreground bg-foreground text-background" : "border-border bg-card/40"
            }`}
            onClick={(event) => {
              event.stopPropagation();
              if (!current) actions.openAccount(id);
            }}
          >
            <span className="text-2xl font-semibold">{name.trim().slice(0, 1) || "주"}</span>
            <span className="line-clamp-2 text-xs font-medium">{name}</span>
          </button>
        );
      })}
    </div>
  );
}

function titleFromShelf(raw: string | undefined, fallback: string) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { campus?: { title?: string } };
    return parsed.campus?.title || fallback;
  } catch {
    return fallback;
  }
}

function Hero({ block, centered }: { block: Block; centered: boolean }) {
  const reading =
    block.text.length > 120
      ? "text-lg leading-relaxed"
      : block.text.length > 80
        ? "text-xl leading-relaxed"
        : block.text.length > 36
          ? "text-2xl leading-snug"
          : "text-3xl leading-snug";
  return (
    <h1
      className={`${reading} font-semibold tracking-tight text-balance ${centered ? "mx-auto max-w-[22rem]" : ""}`}
    >
      {block.text}
    </h1>
  );
}

function ReadingLine({ block, centered }: { block: Block; centered: boolean }) {
  return (
    <p
      className={`text-base leading-relaxed text-foreground/90 ${centered ? "mx-auto max-w-[22rem]" : ""}`}
    >
      {block.text}
    </p>
  );
}

function MetaLine({ block, centered }: { block: Block; centered: boolean }) {
  const className =
    block.kind === "source" || block.kind === "badge"
      ? `text-sm text-muted-foreground ${centered ? "mx-auto max-w-[22rem]" : ""}`
      : `text-xs uppercase tracking-wide text-muted-foreground ${centered ? "mx-auto max-w-[22rem]" : ""}`;
  return <p className={className}>{block.text}</p>;
}

function TextStep({
  actionId,
  label,
  placeholder,
  maxLength,
  transitionId,
}: {
  actionId: string;
  label: string;
  placeholder: string;
  maxLength: number;
  transitionId: string;
}) {
  const { actions } = useCampus();
  const [focused, setFocused] = useState(false);
  useFieldFocusLock(focused);
  const form = useForm({
    defaultValues: { value: "" },
    onSubmit: ({ value }) => {
      actions.dispatch({
        kind: "submit-text",
        transitionId,
        actionId,
        value: value.value,
      });
    },
  });

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="value">
        {(field) => (
          <Input
            value={field.state.value}
            maxLength={maxLength}
            placeholder={placeholder}
            enterKeyHint="done"
            className="min-h-11"
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              field.handleBlur();
            }}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>
      <Button type="submit" className="min-h-11">
        {label}
      </Button>
    </form>
  );
}
