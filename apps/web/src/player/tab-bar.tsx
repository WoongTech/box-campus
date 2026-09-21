"use client";

import { AppIcon } from "@/lib/icons";

const TAB_ICON = 22;

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
    <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black">
      <div className="grid h-[52px] grid-cols-3">
        <TabButton label="홈" current={tab === "home"} onClick={onHome} name="home" />
        <TabButton label="추가" onClick={onCompose} name="plus" />
        <TabButton label="저장" current={tab === "saved"} onClick={onSaved} name="bookmark" />
      </div>
      <div aria-hidden className="h-[max(0.5rem,env(safe-area-inset-bottom))]" />
    </nav>
  );
}

function TabButton({
  label,
  current = false,
  onClick,
  name,
}: {
  label: string;
  current?: boolean;
  onClick: () => void;
  name: "home" | "plus" | "bookmark";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={`flex items-center justify-center ${current ? "text-white" : "text-white/40"}`}
      onClick={onClick}
    >
      <AppIcon name={name} size={TAB_ICON} strokeWidth={current ? 2 : 1.6} />
    </button>
  );
}
