"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { AspectRatio } from "@astryxdesign/core/AspectRatio";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Button } from "@astryxdesign/core/Button";
import { Heading, type HeadingType } from "@astryxdesign/core/Heading";
import { IconButton } from "@astryxdesign/core/IconButton";
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  StackItem,
  VStack,
} from "@astryxdesign/core/Layout";
import { Link } from "@astryxdesign/core/Link";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import type { Block } from "@box-campus/engine";
import { AppIcon, phoneIconSize } from "@/lib/icons";
import { useCampus } from "./campus-provider";
import { useFieldFocusLock } from "./interaction-lock";
import { splitBlocks } from "./split-blocks";

export function FeedView({ onClose }: { onClose: () => void }) {
  const { state, frame, actions, meta } = useCampus();
  if (frame.kind !== "card") return null;
  const view = frame.view;
  const split = splitBlocks(view.blocks);
  const hasChoices = view.control.kind === "choices";
  const hasText = view.control.kind === "text";
  const feed = state.session.kind === "feed" ? state.session.feed : null;
  const ideaTitle = feed ? state.campus.ideas.find((idea) => idea.id === feed.ideaId)?.title ?? "" : "";
  const contextEyebrows = split.meta.filter(
    (block) => block.kind === "eyebrow" && block.text !== ideaTitle,
  );
  const showMetaInStrip =
    !hasChoices && split.meta.length > 0 && view.role !== "advisor";
  const subtitle = ideaTitle;
  const showDock =
    hasChoices ||
    hasText ||
    view.role === "advisor" ||
    view.role === "hub";
  const hasSlideImage = split.images.length > 0;
  const centered = !hasText && !hasSlideImage;

  return (
    <Layout
      height="fill"
      className="h-full"
      header={
        <LayoutHeader>
          <VStack gap={2}>
            {typeof view.pentadIndex === "number" ? (
              <HStack gap={1} aria-hidden>
                {Array.from({ length: 4 }, (_, index) => (
                  <StackItem key={index} size="fill">
                    <ProgressBar
                      label={`${index + 1}번째 슬라이드`}
                      isLabelHidden
                      value={index <= view.pentadIndex! ? 100 : 0}
                      variant="neutral"
                    />
                  </StackItem>
                ))}
              </HStack>
            ) : null}
            <HStack gap={2} align="center">
              <Avatar name={state.campus.title} size="md" tooltip={false} />
              <StackItem size="fill">
                <Text display="block" weight="semibold" maxLines={1}>
                  {state.campus.title}
                </Text>
                {subtitle ? (
                  <Text display="block" type="supporting" color="secondary" maxLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </StackItem>
              {meta.cardId ? (
                <IconButton
                  label={meta.saved ? "저장됨" : "저장"}
                  variant="ghost"
                  icon={<AppIcon name="bookmark" size={phoneIconSize.feed} />}
                  onClick={actions.toggleSave}
                />
              ) : null}
              <IconButton
                label={view.role === "advisor" ? "돌아가기" : "닫기"}
                variant="ghost"
                icon={<AppIcon name="close" size={phoneIconSize.feed} />}
                onClick={() => {
                  if (view.role === "advisor") {
                    actions.dispatch({ kind: "cancel-advisor" });
                    return;
                  }
                  onClose();
                }}
              />
            </HStack>
          </VStack>
        </LayoutHeader>
      }
      footer={
        showDock ? (
          <LayoutFooter hasDivider>
            <VStack gap={2}>
              {view.control.kind === "choices" ? (
                <VStack gap={2}>
                  {view.control.options.map((option) => (
                    <Button
                      key={option.actionId}
                      variant="secondary"
                      width="100%"
                      label={option.label}
                      onClick={() =>
                        actions.dispatch({
                          kind: "activate",
                          transitionId: frame.transitionId,
                          actionId: option.actionId,
                        })
                      }
                    />
                  ))}
                </VStack>
              ) : null}
              {view.control.kind === "text" ? (
                <TextStep
                  key={frame.transitionId}
                  actionId={view.control.actionId}
                  label={view.control.label}
                  placeholder={view.control.placeholder}
                  maxLength={view.control.maxLength}
                  transitionId={frame.transitionId}
                />
              ) : null}
              {view.role === "advisor" ? (
                <Button
                  variant="ghost"
                  width="100%"
                  label="돌아가기"
                  onClick={() => actions.dispatch({ kind: "cancel-advisor" })}
                />
              ) : null}
              {view.role === "hub" ? (
                <Button variant="primary" width="100%" label="홈" onClick={onClose} />
              ) : null}
            </VStack>
          </LayoutFooter>
        ) : null
      }
      content={
        <LayoutContent key={frame.transitionId}>
          <VStack
            height="100%"
            gap={4}
            justify={hasSlideImage ? "between" : centered ? "center" : "end"}
            align={centered ? "center" : "stretch"}
          >
            {hasSlideImage ? (
              <VStack gap={3}>
                {split.images.map((block) => (
                  <AspectRatio
                    key={block.src}
                    ratio={4 / 3}
                    fit="cover"
                    className="w-full overflow-hidden rounded-lg"
                  >
                    <img src={block.src} alt={block.alt} />
                  </AspectRatio>
                ))}
              </VStack>
            ) : null}
            <VStack gap={2} align={centered ? "center" : "stretch"} maxWidth={centered ? "60ch" : undefined}>
              {view.role === "advisor"
                ? split.meta
                    .filter((block) => block.kind === "eyebrow")
                    .map((block, index) => (
                      <Text key={`step-${index}`} type="supporting" weight="medium" color="secondary" display="block">
                        {block.text}
                      </Text>
                    ))
                : contextEyebrows.map((block, index) => (
                    <Text key={`prompt-${index}`} weight="medium" display="block" justify={centered ? "center" : "start"}>
                      {block.text}
                    </Text>
                  ))}
              {split.hero ? (
                <Hero block={split.hero} centered={centered} caption={hasSlideImage} />
              ) : (
                <Heading level={1} textWrap="balance" justify={centered ? "center" : "start"}>
                  {state.campus.title}
                </Heading>
              )}
              {split.verdict ? (
                <Text
                  display="block"
                  weight="medium"
                  justify={centered ? "center" : "start"}
                  className={split.verdict.tone === "retry" ? "text-error" : undefined}
                >
                  {split.verdict.text}
                </Text>
              ) : null}
              {split.reading.map((block, index) => (
                <ReadingLine key={`${block.kind}-${index}`} block={block} centered={centered} />
              ))}
              {showMetaInStrip
                ? split.meta
                    .filter((block) => block.kind !== "eyebrow")
                    .map((block, index) => (
                      <MetaLine key={`${block.kind}-${index}`} block={block} centered={centered} />
                    ))
                : null}
            </VStack>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

function heroType(text: string, caption: boolean): HeadingType | undefined {
  if (caption || text.length > 80) return undefined;
  if (text.length > 36) return "display-3";
  return "display-2";
}

function Hero({
  block,
  centered,
  caption = false,
}: {
  block: Extract<Block, { text: string }>;
  centered: boolean;
  caption?: boolean;
}) {
  return (
    <Heading
      level={caption ? 2 : 1}
      type={heroType(block.text, caption)}
      textWrap="balance"
      justify={centered ? "center" : "start"}
    >
      {block.text}
    </Heading>
  );
}

function ReadingLine({ block, centered }: { block: Extract<Block, { text: string }>; centered: boolean }) {
  return (
    <Text display="block" justify={centered ? "center" : "start"}>
      {block.text}
    </Text>
  );
}

function MetaLine({ block, centered }: { block: Extract<Block, { text: string }>; centered: boolean }) {
  if (block.kind === "source" && block.href) {
    return (
      <Link
        href={block.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        {block.text}
      </Link>
    );
  }
  return (
    <Text type="supporting" color="secondary" display="block" justify={centered ? "center" : "start"}>
      {block.text}
    </Text>
  );
}

function TextStep({
  actionId,
  label,
  placeholder,
  maxLength,
  transitionId,
}: {
  actionId: string;
  label: string;
  placeholder: string;
  maxLength: number;
  transitionId: string;
}) {
  const { actions } = useCampus();
  const [focused, setFocused] = useState(false);
  useFieldFocusLock(focused);
  const form = useForm({
    defaultValues: { value: "" },
    onSubmit: ({ value }) => {
      actions.dispatch({
        kind: "submit-text",
        transitionId,
        actionId,
        value: value.value,
      });
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <VStack gap={2}>
        <form.Field name="value">
          {(field) => (
            <TextInput
              label={label}
              isLabelHidden
              value={field.state.value}
              placeholder={placeholder}
              width="100%"
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                field.handleBlur();
              }}
              onChange={(value) => field.handleChange(value.slice(0, maxLength))}
            />
          )}
        </form.Field>
        <Button type="submit" width="100%" label={label} />
      </VStack>
    </form>
  );
}
