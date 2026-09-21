"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/Layout";
import { AppIcon, phoneIconSize } from "@/lib/icons";
import { agentInstructions } from "./agent-brief";
import { RemoteAccount } from "./remote-account";
import { issueAgentKey, remoteConfigured } from "./remote-sync";

export function ComposeSheet({
  open,
  onOpenChange,
  onPaste,
  onStartTopic,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaste: () => void;
  onStartTopic: () => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [making, setMaking] = useState(false);
  const configured = remoteConfigured();

  return (
    <BottomSheet isOpen={open} onOpenChange={onOpenChange} label="추가" height="tall">
      <VStack gap={3}>
        <Heading level={2}>추가</Heading>
        <Text color="secondary">새 스토리를 직접 적거나, 에이전트가 카드까지 넣게 합니다.</Text>
        <Button
          variant="ghost"
          width="100%"
          label="새 스토리"
          icon={<AppIcon name="pen" size={phoneIconSize.sheet} />}
          onClick={() => {
            onOpenChange(false);
            onStartTopic();
          }}
        />
        <Button
          variant="ghost"
          width="100%"
          label="묶음 붙이기"
          icon={<AppIcon name="paste" size={phoneIconSize.sheet} />}
          onClick={() => {
            onOpenChange(false);
            onPaste();
          }}
        />
        <VStack gap={2}>
          <Heading level={3}>에이전트로 넣기</Heading>
          <Text type="supporting" color="secondary">
            키를 채팅에 주면, 그 에이전트가 스토리와 카드를 이 계정에 바로 넣습니다.
          </Text>
          {configured ? (
            <RemoteAccount />
          ) : (
            <Text type="supporting" color="secondary">
              계정을 아직 붙이지 않았습니다. 그때까지는 묶음을 붙여 넣으세요.
            </Text>
          )}
          {configured ? (
            <VStack gap={2}>
              <Button
                variant="secondary"
                width="100%"
                label={token ? "키 다시 만들기" : "키 만들기"}
                isLoading={making}
                onClick={() => {
                  setMaking(true);
                  void issueAgentKey().then((result) => {
                    setMaking(false);
                    if ("error" in result) {
                      toast(result.error);
                      return;
                    }
                    setToken(result.token);
                    void copyText(result.token, "키를 복사했습니다");
                  });
                }}
              />
              {token ? <Text type="supporting">{token}</Text> : null}
              <Button
                variant="secondary"
                width="100%"
                label="주소 복사"
                onClick={() => copyText(`${window.location.origin}/api/agent/campus`, "주소를 복사했습니다")}
              />
              <Button
                variant="ghost"
                width="100%"
                label="작성 지침 복사"
                onClick={() => copyText(agentInstructions(window.location.origin), "작성 지침을 복사했습니다")}
              />
            </VStack>
          ) : null}
        </VStack>
      </VStack>
    </BottomSheet>
  );
}

function copyText(text: string, success: string) {
  if (!navigator.clipboard?.writeText) {
    toast("이 브라우저에서는 복사할 수 없습니다");
    return;
  }
  void navigator.clipboard.writeText(text).then(
    () => toast(success),
    () => toast("이 브라우저에서는 복사할 수 없습니다"),
  );
}
