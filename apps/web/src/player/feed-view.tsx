"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { AppIcon, phoneIconSize } from "@/lib/icons";
import type { Block } from "@box-campus/engine";
import { useCampus } from "./campus-provider";
import { useFieldFocusLock } from "./interaction-lock";
import { splitBlocks } from "./split-blocks";

export function FeedView({ onClose }: { onClose: () => void }) {
  const { state, frame, actions, meta, nav } = useCampus();
  const [failed, setFailed] = useState<{ slide: string; srcs: string[] }>({ slide: "", srcs: [] });
  if (frame.kind !== "card") return null;
  const view = frame.view;
  const split = splitBlocks(view.blocks);
  const hasChoices = view.control.kind === "choices";
  const hasText = view.control.kind === "text";
  const feed = state.session.kind === "feed" ? state.session.feed : null;
  const ideaTitle = feed ? state.campus.ideas.find((idea) => idea.id === feed.ideaId)?.title ?? "" : "";
  const contextEyebrows = split.meta.filter(
    (block) => block.kind === "eyebrow" && block.text !== ideaTitle,
  );
  const showMetaInStrip = !hasChoices && split.meta.length > 0 && view.role !== "advisor";
  const subtitle = ideaTitle;
  const showDock = hasChoices || hasText || view.role === "advisor" || view.role === "hub";
  const slide = `${frame.transitionId}`;
  const hidden = failed.slide === slide ? failed.srcs : [];
  const images = split.images.filter((block) => !hidden.includes(block.src));
  const hasSlideImage = images.length > 0;
  const readingLength =
    (split.hero?.text.length ?? 0) + split.reading.reduce((sum, block) => sum + block.text.length, 0);
  const centered = !hasText && !hasSlideImage && readingLength < 80;

  function hideImage(src: string) {
    setFailed((current) => {
      const srcs = current.slide === slide ? current.srcs : [];
      return srcs.includes(src) ? current : { slide, srcs: [...srcs, src] };
    });
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col">
      {typeof view.pentadIndex === "number" ? (
        <div
          className="pointer-events-none flex shrink-0 gap-1 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
          aria-hidden
        >
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
              <span
                className={`block h-full rounded-full bg-white ${index <= view.pentadIndex! ? "w-full" : "w-0"}`}
              />
            </span>
          ))}
        </div>
      ) : (
        <div className="shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]" />
      )}

      <div
        className="flex shrink-0 items-center gap-2 px-3 pt-2"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
          {state.campus.title.trim().slice(0, 1) || "스"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{state.campus.title}</p>
          {subtitle ? <p className="truncate text-[12px] text-secondary">{subtitle}</p> : null}
        </div>
        {meta.cardId ? (
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full"
            aria-label={meta.saved ? "저장됨" : "저장"}
            aria-pressed={meta.saved}
            onClick={actions.toggleSave}
          >
            <AppIcon name="bookmark" size={phoneIconSize.feed} className={meta.saved ? "text-primary" : "text-white/70"} />
          </button>
        ) : null}
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-full"
          aria-label={view.role === "advisor" ? "돌아가기" : "닫기"}
          onClick={() => {
            if (view.role === "advisor") {
              actions.dispatch({ kind: "cancel-advisor" });
              return;
            }
            onClose();
          }}
        >
          <AppIcon name="close" size={phoneIconSize.feed} />
        </button>
      </div>

      <div
        key={`${frame.transitionId}-${nav}`}
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 ${showDock ? "" : "pb-[env(safe-area-inset-bottom)]"}`}
      >
        <div
          className={
            hasSlideImage
              ? `flex min-h-full flex-col gap-3 py-4 ${showDock ? "" : "justify-center"}`
              : hasText
                ? "flex min-h-full flex-col justify-end gap-3 py-4"
                : `flex min-h-full flex-col justify-center gap-4 py-6 ${centered ? "text-center" : ""}`
          }
        >
          {hasSlideImage
            ? images.map((block) => (
                <div
                  key={block.src}
                  className={`-mx-6 overflow-hidden bg-white/5 ${showDock ? "aspect-video" : "aspect-[4/5]"}`}
                >
                  <img
                    src={block.src}
                    alt={block.alt}
                    draggable={false}
                    className="size-full object-cover"
                    onError={() => hideImage(block.src)}
                  />
                </div>
              ))
            : null}
          <div className={hasSlideImage ? "space-y-2 text-left" : hasText ? "space-y-2" : "space-y-4"}>
            {view.role === "advisor"
              ? split.meta
                  .filter((block) => block.kind === "eyebrow")
                  .map((block, index) => (
                    <p key={`step-${index}`} className="text-xs font-medium text-secondary">
                      {block.text}
                    </p>
                  ))
              : contextEyebrows.map((block, index) => (
                  <p key={`prompt-${index}`} className="text-sm font-medium">
                    {block.text}
                  </p>
                ))}
            {split.hero ? (
              <Hero block={split.hero} centered={centered} caption={hasSlideImage} />
            ) : (
              <h1 className="text-2xl leading-snug font-semibold tracking-tight text-balance">{state.campus.title}</h1>
            )}
            {split.verdict ? (
              <p className={split.verdict.tone === "retry" ? "text-sm font-medium text-error" : "text-sm font-medium"}>
                {split.verdict.text}
              </p>
            ) : null}
            {split.reading.map((block, index) => (
              <ReadingLine key={`${block.kind}-${index}`} block={block} centered={centered} />
            ))}
            {showMetaInStrip
              ? split.meta
                  .filter((block) => block.kind !== "eyebrow")
                  .map((block, index) => <MetaLine key={`${block.kind}-${index}`} block={block} centered={centered} />)
              : null}
          </div>
        </div>
      </div>

      {showDock ? (
        <div
          className="z-10 shrink-0 space-y-3 bg-body/90 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
          onClick={(event) => event.stopPropagation()}
        >
          {view.control.kind === "choices" ? (
            <div className="flex flex-col gap-2">
              {view.control.options.map((option) => (
                <button
                  key={option.actionId}
                  type="button"
                  className="min-h-12 w-full rounded-full border border-white/15 bg-white/10 px-4 py-3 text-left text-[15px] leading-snug"
                  onClick={() =>
                    actions.dispatch({
                      kind: "activate",
                      transitionId: frame.transitionId,
                      actionId: option.actionId,
                    })
                  }
                >
                  {option.label}
                </button>
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
            <button
              type="button"
              className="min-h-11 w-full text-sm text-secondary"
              onClick={() => actions.dispatch({ kind: "cancel-advisor" })}
            >
              돌아가기
            </button>
          ) : null}
          {view.role === "hub" ? (
            <button type="button" className="min-h-11 w-full rounded-full bg-white text-sm font-semibold text-black" onClick={onClose}>
              홈
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Hero({
  block,
  centered,
  caption = false,
}: {
  block: Extract<Block, { text: string }>;
  centered: boolean;
  caption?: boolean;
}) {
  const reading = caption
    ? "text-base leading-relaxed"
    : block.text.length > 120
      ? "text-lg leading-relaxed"
      : block.text.length > 80
        ? "text-xl leading-relaxed"
        : block.text.length > 36
          ? "text-2xl leading-snug"
          : "text-3xl leading-snug";
  return (
    <h1 className={`${reading} font-semibold tracking-tight text-balance ${centered ? "mx-auto max-w-[22rem]" : ""}`}>
      {block.text}
    </h1>
  );
}

function ReadingLine({ block, centered }: { block: Extract<Block, { text: string }>; centered: boolean }) {
  return <p className={`text-base leading-relaxed text-primary/90 ${centered ? "mx-auto max-w-[22rem]" : ""}`}>{block.text}</p>;
}

function MetaLine({ block, centered }: { block: Extract<Block, { text: string }>; centered: boolean }) {
  const className = `text-sm text-secondary ${centered ? "mx-auto max-w-[22rem]" : ""}`;
  if (block.kind === "source" && block.href) {
    return (
      <a
        href={block.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} underline underline-offset-2`}
        onClick={(event) => event.stopPropagation()}
      >
        {block.text}
      </a>
    );
  }
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
          <input
            value={field.state.value}
            placeholder={placeholder}
            aria-label={label}
            className="h-12 w-full rounded-full border border-white/15 bg-white/10 px-4 text-[15px] text-primary outline-none placeholder:text-secondary"
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              field.handleBlur();
            }}
            onChange={(event) => field.handleChange(event.target.value.slice(0, maxLength))}
          />
        )}
      </form.Field>
      <button type="submit" className="h-12 w-full rounded-full bg-white text-sm font-semibold text-black">
        {label}
      </button>
    </form>
  );
}
