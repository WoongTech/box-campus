"use client";

import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack, LayoutFooter } from "@astryxdesign/core/Layout";
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
    <LayoutFooter hasDivider role="navigation" label="이동">
      <HStack gap={0} justify="around">
        <IconButton
          label="홈"
          variant={tab === "home" ? "secondary" : "ghost"}
          icon={<AppIcon name="home" size={phoneIconSize.tab} />}
          onClick={onHome}
        />
        <IconButton
          label="추가"
          variant="ghost"
          icon={<AppIcon name="plus" size={phoneIconSize.tab} />}
          onClick={onCompose}
        />
        <IconButton
          label="저장"
          variant={tab === "saved" ? "secondary" : "ghost"}
          icon={<AppIcon name="bookmark" size={phoneIconSize.tab} />}
          onClick={onSaved}
        />
      </HStack>
    </LayoutFooter>
  );
}
