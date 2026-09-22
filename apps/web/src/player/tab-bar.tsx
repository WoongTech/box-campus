"use client";

import { AppIcon } from "@/lib/icons";

const TAB_ICON = 26;

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
    <nav className="z-30 shrink-0 border-t border-white/10 bg-black pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-12 grid-cols-3">
        <TabButton label="홈" current={tab === "home"} onClick={onHome} name="home" />
        <TabButton label="추가" onClick={onCompose} name="plus" />
        <TabButton label="저장" current={tab === "saved"} onClick={onSaved} name="bookmark" />
      </div>
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
      className={`flex items-center justify-center ${current ? "text-white" : "text-white/35"}`}
      onClick={onClick}
    >
      <AppIcon name={name} size={TAB_ICON} strokeWidth={current ? 2.1 : 1.7} />
    </button>
  );
}
