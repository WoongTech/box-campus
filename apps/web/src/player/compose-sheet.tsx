"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
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
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight">추가</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-secondary">
            새 스토리를 만들거나, 받아 둔 묶음을 붙입니다.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="flex min-h-12 w-full items-center gap-3 rounded-full bg-white px-4 text-left text-[15px] font-semibold text-black active:bg-white/90"
            onClick={() => {
              onOpenChange(false);
              onStartTopic();
            }}
          >
            <AppIcon name="pen" size={phoneIconSize.sheet} />
            새 스토리
          </button>
          <button
            type="button"
            className="flex min-h-12 w-full items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 text-left text-[15px] font-medium active:bg-white/15"
            onClick={() => {
              onOpenChange(false);
              onPaste();
            }}
          >
            <AppIcon name="paste" size={phoneIconSize.sheet} />
            묶음 붙이기
          </button>
        </div>
        <details className="group border-t border-white/10 pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left [-webkit-details-marker]:hidden">
            <span>
              <span className="block text-[13px] font-medium">에이전트로 넣기</span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-secondary">
                채팅 에이전트가 이 계정에 스토리와 카드를 넣습니다.
              </span>
            </span>
            <span className="shrink-0 text-[12px] text-secondary group-open:hidden">펼치기</span>
            <span className="hidden shrink-0 text-[12px] text-secondary group-open:inline">접기</span>
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {configured ? (
              <RemoteAccount />
            ) : (
              <p className="text-[13px] leading-relaxed text-secondary">
                계정을 아직 붙이지 않았습니다. 그때까지는 묶음을 붙여 넣으세요.
              </p>
            )}
            {configured ? (
              <>
                <button
                  type="button"
                  className="h-12 w-full rounded-full border border-white/15 text-[15px] font-medium disabled:opacity-50"
                  disabled={making}
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
                >
                  {making ? "만드는 중" : token ? "키 다시 만들기" : "키 만들기"}
                </button>
                {token ? (
                  <p className="break-all rounded-2xl bg-white/5 px-3 py-2 text-[12px] leading-relaxed text-secondary">
                    {token}
                  </p>
                ) : null}
                <div className="flex flex-col items-start">
                  <button
                    type="button"
                    className="py-1.5 text-[13px] text-secondary"
                    onClick={() => copyText(`${window.location.origin}/api/agent/campus`, "주소를 복사했습니다")}
                  >
                    주소 복사
                  </button>
                  <button
                    type="button"
                    className="py-1.5 text-[13px] text-secondary"
                    onClick={() => copyText(agentInstructions(window.location.origin), "작성 지침을 복사했습니다")}
                  >
                    작성 지침 복사
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </details>
      </div>
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
