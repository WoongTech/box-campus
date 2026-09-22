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
  const showDock = hasChoices || hasText || view.role === "hub";
  const slide = `${frame.transitionId}`;
  const hidden = failed.slide === slide ? failed.srcs : [];
  const images = split.images.filter((block) => !hidden.includes(block.src));
  const hasSlideImage = images.length > 0 && !showDock;
  const readingLength =
    (split.hero?.text.length ?? 0) + split.reading.reduce((sum, block) => sum + block.text.length, 0);
  const storyReading = !hasText && !hasChoices && !hasSlideImage;
  const centered = storyReading && readingLength < 90;
  const choiceCount = view.control.kind === "choices" ? view.control.options.length : 0;

  function hideImage(src: string) {
    setFailed((current) => {
      const srcs = current.slide === slide ? current.srcs : [];
      return srcs.includes(src) ? current : { slide, srcs: [...srcs, src] };
    });
  }

  const copy = (
    <>
      {view.role === "advisor"
        ? split.meta
            .filter((block) => block.kind === "eyebrow")
            .map((block, index) => (
              <p key={`step-${index}`} className="text-[12px] font-medium text-secondary">
                {block.text}
              </p>
            ))
        : contextEyebrows.map((block, index) => (
            <p key={`prompt-${index}`} className="text-[13px] font-medium text-secondary">
              {block.text}
            </p>
          ))}
      {split.verdict ? (
        <p
          className={
            split.verdict.tone === "retry"
              ? "text-[13px] font-semibold text-error"
              : "text-[13px] font-semibold text-secondary"
          }
        >
          {split.verdict.text}
        </p>
      ) : null}
      {split.hero ? (
        <Hero block={split.hero} centered={centered && !hasSlideImage} caption={hasSlideImage} />
      ) : (
        <h1 className="text-2xl leading-snug font-semibold tracking-tight text-balance">{state.campus.title}</h1>
      )}
      {split.reading.map((block, index) => (
        <ReadingLine key={`${block.kind}-${index}`} block={block} centered={centered && !hasSlideImage} />
      ))}
      {showMetaInStrip
        ? split.meta
            .filter((block) => block.kind !== "eyebrow")
            .map((block, index) => <MetaLine key={`${block.kind}-${index}`} block={block} centered={centered && !hasSlideImage} />)
        : null}
    </>
  );

  return (
    <section className="relative flex h-full min-h-0 flex-col bg-black">
      {typeof view.pentadIndex === "number" ? (
        <div
          className="pointer-events-none flex shrink-0 gap-1 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
          aria-hidden
        >
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <span
                className={`block h-full rounded-full bg-white transition-[width] duration-200 ${index <= view.pentadIndex! ? "w-full" : "w-0"}`}
              />
            </span>
          ))}
        </div>
      ) : (
        <div className="shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]" />
      )}

      <div
        className="relative z-20 flex shrink-0 items-center gap-2 px-3 pt-2"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
          {state.campus.title.trim().slice(0, 1) || "스"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight">{ideaTitle || state.campus.title}</p>
          {ideaTitle ? (
            <p className="truncate text-[11px] text-white/60">{shortCampus(state.campus.title)}</p>
          ) : null}
        </div>
        {meta.cardId ? (
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full"
            aria-label={meta.saved ? "저장됨" : "저장"}
            aria-pressed={meta.saved}
            onClick={actions.toggleSave}
          >
            <AppIcon
              name="bookmark"
              size={phoneIconSize.feed}
              strokeWidth={meta.saved ? 2.4 : 1.6}
              className={meta.saved ? "text-white" : "text-white/45"}
            />
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

      {hasSlideImage ? (
        <div key={`${frame.transitionId}-${nav}`} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-end justify-center overflow-hidden bg-black px-2 pb-2">
            {images.map((block) => (
              <img
                key={block.src}
                src={block.src}
                alt={block.alt}
                draggable={false}
                className="max-h-full max-w-full object-contain"
                onError={() => hideImage(block.src)}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  if (img.naturalWidth < 2 || img.naturalHeight < 2) hideImage(block.src);
                }}
              />
            ))}
          </div>
          <div className="max-h-[42%] shrink-0 space-y-2 overflow-y-auto overscroll-contain border-t border-white/10 bg-black px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]" data-story-scroll>
            {copy}
          </div>
        </div>
      ) : (
        <div
          key={`${frame.transitionId}-${nav}`}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 ${showDock ? "pb-3" : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"}`}
          data-story-scroll
        >
          <div
            className={
              hasText
                ? "flex min-h-full flex-col justify-end gap-3 py-4"
                : hasChoices
                  ? "flex min-h-full flex-col justify-end gap-3 py-5"
                  : `flex min-h-full flex-col gap-3 py-8 ${storyReading ? "justify-center" : "justify-start"} ${centered ? "text-center" : ""}`
            }
          >
            {copy}
          </div>
        </div>
      )}

      {showDock ? (
        <div
          className={`z-10 shrink-0 space-y-2 border-t border-white/10 bg-black px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] ${
            choiceCount > 3 ? "max-h-[46%] overflow-y-auto overscroll-contain" : ""
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          {view.control.kind === "choices" ? (
            <div className="flex flex-col gap-2">
              {view.control.options.map((option) => (
                <button
                  key={option.actionId}
                  type="button"
                  className="min-h-11 w-full rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-left text-[15px] leading-snug break-keep active:bg-white/20"
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
          {view.role === "hub" ? (
            <button type="button" className="min-h-11 w-full rounded-full bg-white text-sm font-semibold text-black active:bg-white/90" onClick={onClose}>
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
    ? "text-[15px] leading-relaxed"
    : block.text.length > 120
      ? "text-lg leading-relaxed"
      : block.text.length > 80
        ? "text-xl leading-relaxed"
        : block.text.length > 36
          ? "text-2xl leading-snug"
          : "text-3xl leading-snug";
  return (
    <h1 className={`${reading} break-keep font-semibold tracking-tight text-balance ${centered ? "mx-auto max-w-[22rem]" : ""}`}>
      {block.text}
    </h1>
  );
}

function ReadingLine({ block, centered }: { block: Extract<Block, { text: string }>; centered: boolean }) {
  return <p className={`break-keep text-[15px] leading-relaxed text-white/85 ${centered ? "mx-auto max-w-[22rem]" : ""}`}>{block.text}</p>;
}

function MetaLine({ block, centered }: { block: Extract<Block, { text: string }>; centered: boolean }) {
  const className = `break-keep text-[13px] text-white/55 ${centered ? "mx-auto max-w-[22rem]" : ""}`;
  if (block.kind === "badge") {
    return (
      <p className={centered ? "mx-auto" : ""}>
        <span className="inline-block rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-white/70">
          {block.text}
        </span>
      </p>
    );
  }
  if (block.kind === "source" && "href" in block && block.href) {
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

function shortCampus(name: string) {
  const head = name.split(/[:：\-–—|]/)[0]?.trim() || name.trim();
  if (head.length <= 22) return head;
  return `${head.slice(0, 21)}…`;
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
