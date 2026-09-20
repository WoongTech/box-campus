"use client";

import { BookmarkIcon, HomeIcon, PlusIcon } from "lucide-react";

export function TabBar({
  tab,
  onHome,
  onSaved,
  onCompose,
}: {
  tab: "home" | "saved";
  onHome: () => void;
  onSaved: () => void;
  onCompose: () => void;
}) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="flex h-12 items-center justify-around">
        <button
          type="button"
          aria-label="홈"
          aria-current={tab === "home" ? "page" : undefined}
          className="flex size-12 items-center justify-center"
          onClick={onHome}
        >
          <HomeIcon className={tab === "home" ? "size-6 fill-current" : "size-6"} />
        </button>
        <button
          type="button"
          aria-label="추가"
          className="flex size-12 items-center justify-center"
          onClick={onCompose}
        >
          <PlusIcon className="size-6" strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="저장"
          aria-current={tab === "saved" ? "page" : undefined}
          className="flex size-12 items-center justify-center"
          onClick={onSaved}
        >
          <BookmarkIcon className={tab === "saved" ? "size-6 fill-current" : "size-6"} />
        </button>
      </div>
    </nav>
  );
}
