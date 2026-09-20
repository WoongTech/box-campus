"use client";

import { Button } from "@/components/ui/button";
import { useCampus } from "./campus-provider";

export function StripView() {
  const { frame, actions } = useCampus();
  if (frame.kind !== "strip") return null;

  return (
    <div className="flex h-dvh flex-col">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
          <div>
            <p className="text-xs text-muted-foreground">주 보기</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{frame.title}</h1>
          </div>
          {frame.weeks.map((week) => {
            const empty = week.ideaIds.length === 0;
            return (
              <article
                key={week.id}
                className={
                  empty
                    ? "rounded-xl border border-dashed border-border/70 px-4 py-4"
                    : "rounded-xl border border-border/60 bg-card/40 px-4 py-4"
                }
              >
                <h2 className="text-base font-semibold tracking-tight">
                  {week.number}주 · {week.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{week.promise}</p>
                {empty ? (
                  <p className="mt-3 text-xs text-muted-foreground/80">아직 이 주에 장이 없습니다</p>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">장 {week.ideaIds.length}개</p>
                )}
              </article>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 border-t border-border/40 px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full"
          onClick={() => actions.dispatch({ kind: "close-strip", transitionId: frame.transitionId })}
        >
          피드로
        </Button>
      </div>
    </div>
  );
}
