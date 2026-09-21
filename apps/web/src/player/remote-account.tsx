"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
    <div className="flex flex-col gap-2">
      <p className="text-[12px] text-secondary">다른 기기</p>
      {signedIn ? (
        <div className="flex flex-col gap-2">
          <p className="truncate text-[15px]">{signedIn}</p>
          <button
            type="button"
            className="h-12 w-full rounded-full border border-white/15 text-[15px] font-medium"
            onClick={() => void signOutRemote()}
          >
            로그아웃
          </button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-2"
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
          <input
            type="email"
            aria-label="이메일"
            placeholder="이메일"
            autoComplete="email"
            value={email}
            className="h-12 w-full rounded-full border border-white/15 bg-white/10 px-4 text-[15px] text-primary outline-none placeholder:text-secondary"
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            type="submit"
            className="h-12 w-full rounded-full border border-white/15 text-[15px] font-medium disabled:opacity-50"
            disabled={sending}
          >
            {sending ? "보내는 중" : "로그인 링크 보내기"}
          </button>
        </form>
      )}
    </div>
  );
}
