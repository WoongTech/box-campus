"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { BookmarkIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BOX_CAMPUS_SAMPLE, type Block } from "@box-campus/engine";
import { useCampus } from "./campus-provider";
import { useFieldFocusLock } from "./interaction-lock";
import { splitBlocks } from "./split-blocks";

export function FeedView({ onClose }: { onClose: () => void }) {
  const { state, frame, actions, meta, nav } = useCampus();
  if (frame.kind !== "card") return null;
  const view = frame.view;
  const split = splitBlocks(view.blocks);
  const hasChoices = view.control.kind === "choices";
  const hasText = view.control.kind === "text";
  const canTapAdvance = view.control.kind === "advance";
  const eyebrows = split.meta.filter((block) => block.kind === "eyebrow");
  const promptEyebrows = eyebrows.slice(1);
  const showMetaInStrip =
    !hasChoices && split.meta.length > 0 && view.role !== "advisor";
  const feed = state.session.kind === "feed" ? state.session.feed : null;
  const ideaTitle = feed ? state.campus.ideas.find((idea) => idea.id === feed.ideaId)?.title : "";
  const subtitle = [ideaTitle, view.dayCount > 0 ? `오늘 ${view.dayCount}` : ""].filter(Boolean).join(" · ");
  const showDock =
    hasChoices ||
    hasText ||
    view.role === "advisor" ||
    view.role === "hub" ||
    (canTapAdvance && view.role === "day-close");
  const centered = !hasText;

  return (
    <section className="relative flex h-full min-h-0 flex-col">
      {typeof view.pentadIndex === "number" ? (
        <div
          className="pointer-events-none absolute inset-x-3 top-[max(0.65rem,env(safe-area-inset-top))] z-10 flex gap-1"
          aria-hidden
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Progress
              key={index}
              value={index <= view.pentadIndex! ? 100 : 0}
              className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25 [&>div]:bg-white"
            />
          ))}
        </div>
      ) : null}

      <div
        className="absolute inset-x-3 top-[max(1.7rem,env(safe-area-inset-top)+1.05rem)] z-20 flex items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
          {state.campus.title.trim().slice(0, 1) || "스"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{state.campus.title}</p>
          {subtitle ? <p className="truncate text-[11px] text-white/70">{subtitle}</p> : null}
        </div>
        {meta.cardId ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
            aria-label={meta.saved ? "저장됨" : "저장"}
            aria-pressed={meta.saved}
            onClick={actions.toggleSave}
          >
            <BookmarkIcon className={meta.saved ? "size-5 fill-current" : "size-5"} />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          aria-label={view.role === "advisor" ? "돌아가기" : "닫기"}
          onClick={() => {
            if (view.role === "advisor") {
              actions.dispatch({ kind: "cancel-advisor" });
              return;
            }
            onClose();
          }}
        >
          <XIcon className="size-5" />
        </Button>
      </div>

      <div
        key={frame.transitionId}
        className={[
          "flex min-h-0 flex-1 flex-col px-5 pt-[max(6.25rem,env(safe-area-inset-top)+5rem)]",
          hasChoices || hasText ? "pb-3" : "pb-8",
          "animate-in fade-in duration-300",
          nav === "back" ? "slide-in-from-left-8" : "slide-in-from-right-8",
        ].join(" ")}
      >
        <div
          className={
            hasText
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
            <Hero block={split.hero} centered={centered} />
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
            <ReadingLine key={`${block.kind}-${index}`} block={block} centered={centered} />
          ))}
          {showMetaInStrip
            ? split.meta.map((block, index) => (
                <MetaLine key={`${block.kind}-${index}`} block={block} centered={centered} />
              ))
            : null}
        </div>
      </div>

      {showDock ? (
      <div
        className="z-10 shrink-0 space-y-3 bg-background/90 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] backdrop-blur-sm supports-backdrop-filter:bg-background/75"
        onClick={(event) => event.stopPropagation()}
      >
        {view.control.kind === "choices" ? (
          <div className="flex flex-col gap-2">
            {view.control.options.map((option) => (
              <Button
                key={option.actionId}
                type="button"
                variant="secondary"
                className="h-auto min-h-12 w-full justify-center rounded-full px-4 py-3 text-center text-[15px] leading-snug whitespace-normal"
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
          <Button type="button" className="min-h-11 w-full" onClick={onClose}>
            홈
          </Button>
        ) : null}

        {canTapAdvance && view.role === "day-close" ? (
          <p className="text-center text-xs text-muted-foreground">오늘은 여기까지입니다. 내일 이어서 봅니다.</p>
        ) : null}
      </div>
      ) : null}
    </section>
  );
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
