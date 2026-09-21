"use client";

import { AppIcon, phoneIconSize } from "@/lib/icons";

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
    <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-body/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="flex h-12 items-center justify-around">
        <button
          type="button"
          aria-label="홈"
          aria-current={tab === "home" ? "page" : undefined}
          className={`flex size-12 items-center justify-center ${tab === "home" ? "text-primary" : "text-secondary"}`}
          onClick={onHome}
        >
          <AppIcon name="home" size={phoneIconSize.tab} />
        </button>
        <button
          type="button"
          aria-label="추가"
          className="flex size-12 items-center justify-center text-primary"
          onClick={onCompose}
        >
          <AppIcon name="plus" size={phoneIconSize.tab} />
        </button>
        <button
          type="button"
          aria-label="저장"
          aria-current={tab === "saved" ? "page" : undefined}
          className={`flex size-12 items-center justify-center ${tab === "saved" ? "text-primary" : "text-secondary"}`}
          onClick={onSaved}
        >
          <AppIcon name="bookmark" size={phoneIconSize.tab} />
        </button>
      </div>
    </nav>
  );
}
