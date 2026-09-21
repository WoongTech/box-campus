"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/Layout";
import { remoteConfigured, sendSignInLink, signOutRemote, subscribeAuth } from "./remote-sync";

export function RemoteAccount() {
  const [email, setEmail] = useState("");
  const [signedIn, setSignedIn] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const configured = remoteConfigured();

  useEffect(() => {
    if (!configured) return;
    return subscribeAuth((user) => {
      setSignedIn(user ? user.email ?? "로그인됨" : null);
    });
  }, [configured]);

  if (!configured) return null;

  return (
    <VStack gap={2}>
      <Text type="supporting" color="secondary">
        다른 기기
      </Text>
      {signedIn ? (
        <VStack gap={2}>
          <Text>{signedIn}</Text>
          <Button variant="secondary" label="로그아웃" onClick={() => void signOutRemote()} />
        </VStack>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const address = email.trim();
            if (!address.includes("@")) {
              toast("이메일 형식을 확인해 주세요");
              return;
            }
            setSending(true);
            void sendSignInLink(address).then(({ error }) => {
              setSending(false);
              if (error) {
                toast("로그인 링크를 보내지 못했습니다");
                return;
              }
              toast("로그인 링크를 보냈습니다. 메일의 링크로 돌아오세요.");
            });
          }}
        >
          <VStack gap={2}>
            <TextInput
              type="email"
              label="이메일"
              isLabelHidden
              placeholder="이메일"
              autoComplete="email"
              value={email}
              width="100%"
              onChange={setEmail}
            />
            <Button type="submit" width="100%" label="로그인 링크 보내기" isLoading={sending} />
          </VStack>
        </form>
      )}
    </VStack>
  );
}
