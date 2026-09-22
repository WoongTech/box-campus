"use client";

import { useCampus } from "./campus-provider";

export function StripView() {
  const { frame, actions } = useCampus();
  if (frame.kind !== "strip") return null;
  const format = frame.campus.format;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6"
        style={{ paddingTop: "calc(0.5rem + var(--sat))" }}
      >
        <h1 className="text-[17px] font-semibold tracking-tight">{frame.title}</h1>
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
                    : "rounded-2xl border border-white/10 px-4 py-4"
                }
              >
                <h2 className="text-[15px] font-semibold tracking-tight">{label}</h2>
                {week.promise ? <p className="mt-2 text-[15px] leading-relaxed text-primary/80">{week.promise}</p> : null}
                <p className="mt-3 text-[12px] text-secondary">
                  {empty ? "아직 카드뉴스가 없습니다" : `카드뉴스 ${week.ideaIds.length}개`}
                </p>
              </article>
            );
          })}
        </div>
      </div>
      <div
        className="shrink-0 border-t border-white/10 px-4 pt-3"
        style={{ paddingBottom: "calc(0.75rem + var(--sab))" }}
      >
        <button
          type="button"
          className="h-12 w-full rounded-full bg-white text-[15px] font-semibold text-black"
          onClick={() => actions.dispatch({ kind: "close-strip", transitionId: frame.transitionId })}
        >
          이어보기
        </button>
      </div>
    </div>
  );
}
