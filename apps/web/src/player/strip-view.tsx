"use client";

import { useCampus } from "./campus-provider";

export function StripView() {
  const { frame, actions } = useCampus();
  if (frame.kind !== "strip") return null;
  const format = frame.campus.format;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
        <p className="text-xs text-secondary">주 보기</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{frame.title}</h1>
        <div className="mt-4 flex flex-col gap-3">
          {frame.weeks.map((week) => {
            const empty = week.ideaIds.length === 0;
            const label = format === "course" ? `${week.number}주 · ${week.title}` : week.title;
            return (
              <article
                key={week.id}
                className={
                  empty
                    ? "rounded-2xl border border-dashed border-white/20 px-4 py-4"
                    : "rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                }
              >
                <h2 className="text-base font-semibold tracking-tight">{label}</h2>
                {week.promise ? <p className="mt-2 text-sm leading-relaxed text-secondary">{week.promise}</p> : null}
                <p className="mt-3 text-xs text-secondary">
                  {empty ? "아직 이 주에 장이 없습니다" : `장 ${week.ideaIds.length}개`}
                </p>
              </article>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 border-t border-white/10 px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="h-12 w-full rounded-full border border-white/15 bg-white/10 text-sm font-semibold"
          onClick={() => actions.dispatch({ kind: "close-strip", transitionId: frame.transitionId })}
        >
          이어보기
        </button>
      </div>
    </div>
  );
}
