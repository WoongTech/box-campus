"use client";

import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { useCampus } from "./campus-provider";

export function StripView() {
  const { frame, actions } = useCampus();
  if (frame.kind !== "strip") return null;
  const format = frame.campus.format;

  return (
    <Layout
      height="fill"
      className="h-full"
      header={
        <LayoutHeader>
          <VStack gap={1}>
            <Text type="supporting" color="secondary">
              주 보기
            </Text>
            <Heading level={1}>{frame.title}</Heading>
          </VStack>
        </LayoutHeader>
      }
      footer={
        <LayoutFooter hasDivider>
          <Button
            variant="secondary"
            width="100%"
            label="이어보기"
            onClick={() => actions.dispatch({ kind: "close-strip", transitionId: frame.transitionId })}
          />
        </LayoutFooter>
      }
      content={
        <LayoutContent>
          <List hasDividers>
            {frame.weeks.map((week) => {
              const empty = week.ideaIds.length === 0;
              const label = format === "course" ? `${week.number}주 · ${week.title}` : week.title;
              return (
                <ListItem
                  key={week.id}
                  label={label}
                  description={
                    week.promise ? <Text color="secondary">{week.promise}</Text> : undefined
                  }
                  endContent={
                    <Text type="supporting" color="secondary">
                      {empty ? "아직 이 주에 장이 없습니다" : `장 ${week.ideaIds.length}개`}
                    </Text>
                  }
                />
              );
            })}
          </List>
        </LayoutContent>
      }
    />
  );
}
