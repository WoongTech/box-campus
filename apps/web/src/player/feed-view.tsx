"use client";

import { useForm } from "@tanstack/react-form";
import { BookmarkIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BOX_CAMPUS_SAMPLE, type Block } from "@box-campus/engine";
import { useCampus } from "./campus-provider";
import { splitBlocks } from "./split-blocks";

export function FeedView({
  onOpenAccounts,
}: {
  onOpenAccounts: () => void;
}) {
  const { state, frame, actions, meta } = useCampus();
  if (frame.kind !== "card") return null;
  const view = frame.view;
  const split = splitBlocks(view.blocks);
  const initial = state.campus.title.trim().slice(0, 1);

  return (
    <section
      className="relative flex min-h-dvh flex-col"
      onClick={() => {
        if (view.control.kind === "advance") actions.advance();
      }}
    >
      {typeof view.pentadIndex === "number" ? (
        <div className="absolute inset-x-3 top-[max(0.7rem,env(safe-area-inset-top))] z-10 flex gap-1">
          {Array.from({ length: 4 }, (_, index) => (
            <Progress key={index} value={index <= view.pentadIndex! ? 100 : 0} />
          ))}
        </div>
      ) : null}

      <div
        key={frame.transitionId}
        className="flex flex-1 animate-in flex-col justify-end px-5 pt-16 pb-8 fade-in slide-in-from-bottom-4 duration-300"
      >
        {split.hero ? <Hero block={split.hero} /> : null}
        {split.verdict ? (
          <p className={split.verdict.tone === "retry" ? "mt-3 text-sm text-destructive" : "mt-3 text-sm text-foreground"}>
            {split.verdict.text}
          </p>
        ) : null}
      </div>

      <div
        className="z-10 space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              {state.campus.title}
              {view.dayCount > 0 ? (
                <Badge variant="secondary" className="ml-2 align-middle">
                  오늘 {view.dayCount}
                </Badge>
              ) : null}
            </p>
            {split.caption.map((block, index) => (
              <p
                key={`${block.kind}-${index}`}
                className={
                  block.kind === "source" || block.kind === "badge"
                    ? "mt-1 text-sm text-muted-foreground"
                    : "mt-1 text-sm leading-5"
                }
              >
                {block.text}
              </p>
            ))}
            {state.authorBrief ? (
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 text-muted-foreground"
                onClick={() => {
                  void navigator.clipboard?.writeText(state.authorBrief ?? "");
                }}
              >
                브리프 복사
              </Button>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="size-11 rounded-full p-0"
              aria-label="따라가는 주제"
              onClick={onOpenAccounts}
            >
              <Avatar size="lg">
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="size-11 rounded-full"
              aria-label={meta.saved ? "저장됨" : "저장"}
              onClick={actions.toggleSave}
            >
              <BookmarkIcon className={meta.saved ? "size-6 fill-current" : "size-6"} />
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
                className="h-auto min-h-11 w-full justify-start px-3 py-3 text-left whitespace-normal"
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
      </div>
    </section>
  );
}

function Hero({ block }: { block: Block }) {
  return (
    <h1 className="text-3xl leading-snug font-semibold tracking-tight text-balance">
      {block.text}
    </h1>
  );
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
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>
      <Button type="submit">{label}</Button>
    </form>
  );
}
