"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { AppIcon, phoneIconSize } from "@/lib/icons";
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
    <HStack gap={3} align="start" className="w-full min-w-0 overflow-x-auto">
      {ordered.map((id) => {
        const name = titleOf(library.shelves[id], id);
        const current = id === state.campus.id;
        return (
          <VStack key={id} gap={1} align="center">
            <Avatar
              name={name}
              size="lg"
              tooltip={name}
              aria-current={current ? "true" : undefined}
              onClick={() => {
                if (onSelect) onSelect(id);
                else if (!current) actions.openAccount(id);
              }}
            />
            <Text type="supporting" weight={current ? "semibold" : "normal"}>
              {name}
            </Text>
          </VStack>
        );
      })}
      {onCompose ? (
        <VStack gap={1} align="center">
          <IconButton label="추가" variant="ghost" icon={<AppIcon name="plus" size={phoneIconSize.rail} />} onClick={onCompose} />
          <Text type="supporting" color="secondary">
            추가
          </Text>
        </VStack>
      ) : null}
    </HStack>
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
