"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="mt-3">
      <p className="text-xs font-medium text-muted-foreground">다른 기기</p>
      {signedIn ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="truncate text-sm">{signedIn}</p>
          <Button type="button" variant="secondary" className="min-h-11 shrink-0" onClick={() => void signOutRemote()}>
            로그아웃
          </Button>
        </div>
      ) : (
        <form
          className="mt-3 flex flex-col gap-2"
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
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="이메일"
            value={email}
            className="min-h-11"
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" className="min-h-11" disabled={sending}>
            로그인 링크 보내기
          </Button>
        </form>
      )}
    </div>
  );
}
