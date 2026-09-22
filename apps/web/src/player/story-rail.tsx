"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/lib/icons";
import { useCampus } from "./campus-provider";
import { markStorySeen, readSeenStories } from "./learner-prefs";
import { StoryMark } from "./story-mark";

export function StoryRail({
  onCompose,
  onSelect,
}: {
  onCompose?: () => void;
  onSelect?: (id: string) => void;
}) {
  const { state, library, actions } = useCampus();
  const [seen, setSeen] = useState<string[]>([]);
  const ordered = [...library.order];
  if (!ordered.includes(state.campus.id)) ordered.unshift(state.campus.id);
  ordered.sort((left, right) => {
    if (left === state.campus.id) return -1;
    if (right === state.campus.id) return 1;
    return 0;
  });

  useEffect(() => {
    setSeen(readSeenStories());
  }, [library.order, state.campus.id]);

  return (
    <div className="flex items-start gap-3.5 overflow-x-auto px-4 pb-1 pe-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ordered.map((id) => {
        const name = id === state.campus.id ? state.campus.title : titleOf(library.shelves[id], "스토리");
        const current = id === state.campus.id;
        const opened = seen.includes(id);
        return (
          <button
            key={id}
            type="button"
            className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5"
            aria-current={current ? "true" : undefined}
            aria-label={name}
            onClick={() => {
              markStorySeen(id);
              setSeen(readSeenStories());
              if (onSelect) onSelect(id);
              else if (!current) actions.openAccount(id);
            }}
          >
            <span
              className={`rounded-full p-[2px] ${
                opened
                  ? "bg-white/25"
                  : "bg-[conic-gradient(from_210deg,#f9ce34,#ee2a7b,#6228d7,#f9ce34)]"
              }`}
            >
              <span className="rounded-full bg-black p-[2px]">
                <StoryMark seed={id} size={56} title={name} />
              </span>
            </span>
            <span
              className={`w-full truncate text-center text-[11px] leading-tight ${
                current ? "font-semibold text-primary" : "text-secondary"
              }`}
            >
              {railLabel(name)}
            </span>
          </button>
        );
      })}
      {onCompose ? (
        <button type="button" className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5" aria-label="추가" onClick={onCompose}>
          <span className="p-[2px]">
            <span className="flex size-[3.75rem] items-center justify-center rounded-full border border-white/25 text-primary">
              <AppIcon name="plus" size={24} />
            </span>
          </span>
          <span className="text-[11px] leading-tight text-secondary">추가</span>
        </button>
      ) : null}
    </div>
  );
}

function railLabel(name: string) {
  const head = name.split(/[:：\-–—|]/)[0]?.trim() || name.trim();
  if (head.length <= 10) return head;
  return `${head.slice(0, 9)}…`;
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
