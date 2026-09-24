"use client";

import { useCampus } from "./campus-provider";
import { StoryMark } from "./story-mark";

export function StripView() {
  const { frame, actions } = useCampus();
  if (frame.kind !== "strip") return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-6">
        <div className="flex items-center gap-3 pt-2">
          <StoryMark seed={frame.campus.id} size={40} title={frame.title} />
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight">{frame.title}</h1>
        </div>
        <div className="mt-5 flex flex-col">
          {frame.weeks.map((week) => {
            const empty = week.ideaIds.length === 0;
            return (
              <article
                key={week.id}
                className="border-b border-white/[0.08] py-3.5 first:border-t"
              >
                <h2 className="text-[15px] font-semibold tracking-tight">{week.title}</h2>
                {week.promise ? (
                  <p className="mt-1 break-keep text-[15px] leading-[1.4] text-primary/85">{week.promise}</p>
                ) : null}
                <p className="mt-1.5 text-[13px] text-secondary">
                  {empty ? "아직 글이 없습니다" : `글 ${week.ideaIds.length}`}
                </p>
              </article>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 border-t border-white/10 px-4 pt-3 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          className="h-12 w-full rounded-full bg-white text-[15px] font-semibold text-black active:bg-white/90"
          onClick={() => actions.dispatch({ kind: "close-strip", transitionId: frame.transitionId })}
        >
          이어보기
        </button>
      </div>
    </div>
  );
}
