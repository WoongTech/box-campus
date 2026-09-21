"use client";

import { AppIcon } from "@/lib/icons";
import { useCampus } from "./campus-provider";

export function StoryRail({
  onCompose,
  onSelect,
}: {
  onCompose?: () => void;
  onSelect?: (id: string) => void;
}) {
  const { state, library, actions } = useCampus();
  const ordered = [...library.order].sort((left, right) => {
    if (left === state.campus.id) return -1;
    if (right === state.campus.id) return 1;
    return 0;
  });

  return (
    <div className="flex items-start gap-3 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ordered.map((id) => {
        const name = titleOf(library.shelves[id], id);
        const current = id === state.campus.id;
        return (
          <button
            key={id}
            type="button"
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            aria-current={current ? "true" : undefined}
            onClick={() => {
              if (onSelect) onSelect(id);
              else if (!current) actions.openAccount(id);
            }}
          >
            <span
              className={`rounded-full p-[2px] ${
                current
                  ? "bg-[conic-gradient(from_210deg,#f9ce34,#ee2a7b,#6228d7,#f9ce34)]"
                  : "bg-white/25"
              }`}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-body text-base font-semibold">
                {name.trim().slice(0, 1) || "스"}
              </span>
            </span>
            <span className={`line-clamp-1 w-full text-center text-[11px] leading-tight ${current ? "font-semibold" : "text-secondary"}`}>
              {name}
            </span>
          </button>
        );
      })}
      {onCompose ? (
        <button type="button" className="flex w-16 shrink-0 flex-col items-center gap-1.5" aria-label="추가" onClick={onCompose}>
          <span className="p-[2px]">
            <span className="flex size-14 items-center justify-center rounded-full border border-white/25 text-primary">
              <AppIcon name="plus" size={22} />
            </span>
          </span>
          <span className="text-[11px] leading-tight text-secondary">추가</span>
        </button>
      ) : null}
    </div>
  );
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
