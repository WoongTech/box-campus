"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { Layout, LayoutContent, LayoutHeader, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { AppIcon, phoneIconSize } from "@/lib/icons";
import { splitBlocks } from "./split-blocks";
import { StoryRail } from "./story-rail";
import { Wordmark } from "./brand";
import { useCampus } from "./campus-provider";

type LooseCard = {
  id: string;
  ideaId: string;
  thesis?: string;
  question?: string;
  argument?: string;
  analogy?: string;
  image?: { src: string; alt: string };
};

export function HomeView({
  onCompose,
  onOpenStory,
  onOpenIdea,
}: {
  onCompose: () => void;
  onOpenStory: () => void;
  onOpenIdea: (campusId: string, ideaId: string) => void;
}) {
  const { state, library, frame, actions } = useCampus();
  const posts = postsFromLibrary(library, state);
  const hero =
    frame.kind === "card" ? splitBlocks(frame.view.blocks).hero?.text ?? state.campus.title : state.campus.title;
  const activeIdeaId = state.session.kind === "feed" ? state.session.feed.ideaId : "";
  const activeLine = (state.campus.cards as LooseCard[]).find((card) => card.ideaId === activeIdeaId && card.thesis)?.thesis ?? "";
  const showResume = Boolean(library.shelves[state.campus.id]) && Boolean(hero) && hero !== activeLine;

  return (
    <Layout
      className="h-full min-h-0"
      header={
        <LayoutHeader>
          <VStack align="center">
            <Wordmark />
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent>
          <VStack gap={4}>
            <StoryRail
              onCompose={onCompose}
              onSelect={(id) => {
                if (id !== state.campus.id) actions.openAccount(id);
                onOpenStory();
              }}
            />
            {posts.length === 0 ? (
              <EmptyState
                title="아직 스토리가 없습니다"
                description="추가로 첫 주제를 만드세요."
                actions={<Button label="추가" onClick={onCompose} />}
              />
            ) : (
              posts.map((post) => {
                const active = post.id === state.campus.id;
                const format = post.format;
                return (
                  <VStack key={post.id} gap={2}>
                    <Heading level={2}>{post.title}</Heading>
                    {active && showResume ? (
                      <List>
                        <ListItem label={post.title} description={hero} endContent={<Text type="supporting" color="secondary">이어서</Text>} onClick={onOpenStory} />
                      </List>
                    ) : null}
                    {post.weeks.map((week) => {
                      const heading =
                        format === "volume" ? null : format === "series" ? week.title : `${week.number}주 · ${week.title}`;
                      const emptyHint =
                        format === "series" ? "추가로 이 편을 채웁니다." : format === "volume" ? "추가로 카드뉴스를 넣습니다." : "추가로 이 주를 채웁니다.";
                      return (
                        <VStack key={week.id} gap={1}>
                          {heading ? (
                            <Text type="supporting" color="secondary">
                              {heading}
                            </Text>
                          ) : null}
                          {week.promise?.trim() ? <Text color="secondary">{week.promise}</Text> : null}
                          {week.ideaIds.length === 0 ? (
                            <EmptyState
                              isCompact
                              title="아직 카드뉴스가 없습니다"
                              description={emptyHint}
                              actions={<Button variant="secondary" label="추가" onClick={onCompose} />}
                            />
                          ) : (
                            <List hasDividers>
                              {week.ideaIds.map((ideaId) => {
                                const idea = post.ideas.find((item) => item.id === ideaId);
                                const line = post.cards.find((card) => card.ideaId === ideaId && card.thesis)?.thesis;
                                const cover = post.cards.find((card) => card.ideaId === ideaId && card.image?.src)?.image;
                                const title = idea?.title ?? "카드뉴스";
                                const current = active && ideaId === activeIdeaId;
                                return (
                                  <ListItem
                                    key={ideaId}
                                    label={title}
                                    description={line}
                                    isSelected={current}
                                    startContent={
                                      cover ? (
                                        <Avatar name={title} alt={cover.alt} src={cover.src} shape="rounded" size="lg" tooltip={false} />
                                      ) : undefined
                                    }
                                    endContent={current ? <Text type="supporting" color="secondary">이어서</Text> : undefined}
                                    onClick={() => onOpenIdea(post.id, ideaId)}
                                  />
                                );
                              })}
                            </List>
                          )}
                        </VStack>
                      );
                    })}
                  </VStack>
                );
              })
            )}
            {posts.some((post) => post.id === state.campus.id) ? (
              <Button
                variant="ghost"
                width="100%"
                label="이 스토리 처음부터"
                onClick={() => actions.dispatch({ kind: "reset-sample", raw: state.campus })}
              />
            ) : null}
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export function SavedView({ onOpenCard }: { onOpenCard: (cardId: string) => void }) {
  const { state, library } = useCampus();
  const cards = state.campus.cards as LooseCard[];
  const ideas = state.campus.ideas;
  const items = library.saved
    .map((cardId) => previewSaved(cardId, state.campus.title, cards, ideas, library))
    .filter((item): item is { cardId: string; topic: string; text: string } => item !== null);

  return (
    <Layout
      className="h-full min-h-0"
      header={
        <LayoutHeader>
          <Heading level={1}>저장</Heading>
        </LayoutHeader>
      }
      content={
        <LayoutContent>
          <VStack>
            {items.length === 0 ? (
              <EmptyState
                icon={<AppIcon name="bookmark" size={phoneIconSize.empty} />}
                title="저장한 카드가 없습니다"
                description="스토리에서 표시해 두면 여기에 모입니다."
              />
            ) : (
              <List hasDividers>
                {items.map((item) => (
                  <ListItem key={item.cardId} label={item.topic} description={item.text} onClick={() => onOpenCard(item.cardId)} />
                ))}
              </List>
            )}
          </VStack>
        </LayoutContent>
      }
    />
  );
}

type StoryWeek = { id: string; number: number; title: string; promise?: string; ideaIds: string[] };

type StoryPost = {
  id: string;
  title: string;
  format: string;
  weeks: StoryWeek[];
  ideas: { id: string; title: string }[];
  cards: LooseCard[];
};

function postsFromLibrary(
  library: { order: string[]; shelves: Record<string, string> },
  active: { campus: { id: string; title: string; format?: string; weeks: StoryWeek[]; ideas: StoryPost["ideas"]; cards: LooseCard[] } },
): StoryPost[] {
  return library.order.flatMap((id) => {
    if (id === active.campus.id) {
      return [{
        id,
        title: active.campus.title,
        format: active.campus.format ?? "course",
        weeks: active.campus.weeks,
        ideas: active.campus.ideas,
        cards: active.campus.cards,
      }];
    }
    const raw = library.shelves[id];
    if (!raw) return [];
    const post = postFromDump(id, raw);
    return post ? [post] : [];
  });
}

function postFromDump(id: string, raw: string): StoryPost | null {
  try {
    const dumped = JSON.parse(raw) as { campus?: StoryPost };
    const campus = dumped.campus;
    if (!campus?.title || !Array.isArray(campus.weeks)) return null;
    return {
      id,
      title: campus.title,
      format: campus.format ?? "course",
      weeks: campus.weeks,
      ideas: campus.ideas ?? [],
      cards: campus.cards ?? [],
    };
  } catch {
    return null;
  }
}

function cardLine(card: LooseCard) {
  return card.thesis || card.question || card.argument || card.analogy || "저장한 카드";
}

function previewSaved(
  cardId: string,
  topic: string,
  cards: LooseCard[],
  ideas: { id: string; title: string }[],
  library: { shelves: Record<string, string> },
) {
  const here = cards.find((card) => card.id === cardId);
  if (here) {
    const idea = ideas.find((item) => item.id === here.ideaId);
    return { cardId, topic: idea?.title ?? topic, text: cardLine(here) };
  }
  for (const raw of Object.values(library.shelves)) {
    try {
      const dumped = JSON.parse(raw) as {
        campus?: { title?: string; ideas?: { id: string; title: string }[]; cards?: LooseCard[] };
      };
      const card = dumped.campus?.cards?.find((item) => item.id === cardId);
      if (!card) continue;
      const idea = dumped.campus?.ideas?.find((item) => item.id === card.ideaId);
      return { cardId, topic: idea?.title ?? dumped.campus?.title ?? "저장한 카드", text: cardLine(card) };
    } catch {
      continue;
    }
  }
  return { cardId, topic: "저장한 카드", text: "다시 열 수 있는 카드" };
}
