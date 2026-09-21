"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { VStack } from "@astryxdesign/core/Layout";
import { parsePastedCampus } from "./parse-paste";
import { agentInstructions } from "./agent-brief";
import { useCampus } from "./campus-provider";
import { useFieldFocusLock } from "./interaction-lock";

export function ImportSheet({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}) {
  const { state, actions } = useCampus();
  const [focused, setFocused] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  useFieldFocusLock(focused && open);

  useEffect(() => {
    if (!open) setPasteError(null);
  }, [open]);

  const form = useForm({
    defaultValues: { raw: "" },
    onSubmit: ({ value }) => {
      const raw = parsePastedCampus(value.raw);
      if (isEmptyPaste(value.raw)) {
        setPasteError("붙여 넣을 내용이 없습니다.");
        return;
      }
      actions.dispatch({
        kind: "import-campus",
        raw,
        transitionId: state.transitionId,
      });
      if (isRejectedPaste(raw)) {
        setPasteError("묶음을 읽지 못했습니다. 형식을 확인해 주세요.");
        return;
      }
      setPasteError(null);
      onOpenChange(false);
      onImported?.();
      form.reset();
    },
  });

  return (
    <BottomSheet isOpen={open} onOpenChange={onOpenChange} label="묶음 붙이기" height="tall" purpose="form">
      <VStack gap={3}>
        <Heading level={2}>묶음 붙이기</Heading>
        <Text color="secondary">에이전트가 바로 넣지 못할 때는, 받은 JSON을 여기에 붙입니다.</Text>
        <Text type="supporting" color="secondary">
          1. 추가에서 키와 작성 지침을 넘깁니다.
        </Text>
        <Text type="supporting" color="secondary">
          2. 에이전트가 스토리를 넣지 못하면 JSON을 받습니다.
        </Text>
        <Text type="supporting" color="secondary">
          3. 그 JSON을 아래에 붙입니다.
        </Text>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <VStack gap={2}>
            <form.Field name="raw">
              {(field) => (
                <TextArea
                  label="묶음"
                  isLabelHidden
                  value={field.state.value}
                  placeholder="묶음을 붙여 넣으세요"
                  rows={8}
                  status={pasteError ? { type: "error", message: pasteError } : undefined}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    field.handleBlur();
                  }}
                  onChange={(value) => {
                    setPasteError(null);
                    field.handleChange(value);
                  }}
                />
              )}
            </form.Field>
            {state.authorBrief ? (
              <Button
                variant="secondary"
                width="100%"
                label="브리프 복사"
                onClick={() => copyText(state.authorBrief, "브리프를 복사했습니다")}
              />
            ) : null}
            <Button
              variant="secondary"
              width="100%"
              label="작성 지침 복사"
              onClick={() => copyText(agentInstructions(window.location.origin), "작성 지침을 복사했습니다")}
            />
            <Button
              variant="secondary"
              width="100%"
              label="지금 주제 복사"
              onClick={() => copyText(JSON.stringify(state.campus, null, 2), "지금 주제를 복사했습니다")}
            />
            <Button type="submit" variant="primary" width="100%" label="붙이기" />
          </VStack>
        </form>
      </VStack>
    </BottomSheet>
  );
}

function isEmptyPaste(text: string) {
  return text.trim().length === 0;
}

function isRejectedPaste(raw: unknown) {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) && "invalid" in raw && !("id" in raw);
}

function copyText(text: string | null | undefined, success: string) {
  if (!text || !navigator.clipboard?.writeText) {
    toast("이 브라우저에서는 복사할 수 없습니다");
    return;
  }
  void navigator.clipboard.writeText(text).then(
    () => toast(success),
    () => toast("이 브라우저에서는 복사할 수 없습니다"),
  );
}
