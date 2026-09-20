"use client";

import { useState } from "react";
import { AppIcon, phoneIconSize } from "@/lib/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-[390px] gap-0 overflow-y-auto rounded-t-3xl pb-0">
        <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        <SheetHeader className="pb-2 text-left">
          <SheetTitle>추가</SheetTitle>
          <SheetDescription>새 스토리를 직접 적거나, 에이전트가 카드까지 넣게 합니다.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="ghost"
            className="min-h-14 w-full justify-start gap-3 px-2 text-base"
            onClick={() => {
              onOpenChange(false);
              onStartTopic();
            }}
          >
            <AppIcon name="pen" size={phoneIconSize.sheet} />
            새 스토리
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-14 w-full justify-start gap-3 px-2 text-base"
            onClick={() => {
              onOpenChange(false);
              onPaste();
            }}
          >
            <AppIcon name="paste" size={phoneIconSize.sheet} />
            묶음 붙이기
          </Button>
          <section className="mt-2 rounded-2xl border border-border/70 px-3 py-3">
            <h2 className="text-sm font-semibold">에이전트로 넣기</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              키를 채팅에 주면, 그 에이전트가 스토리와 카드를 이 계정에 바로 넣습니다.
            </p>
            {configured ? <RemoteAccount /> : (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                계정을 아직 붙이지 않았습니다. 그때까지는 묶음을 붙여 넣으세요.
              </p>
            )}
            {configured ? (
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
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
                  {token ? "키 다시 만들기" : "키 만들기"}
                </Button>
                {token ? (
                  <p className="break-all rounded-xl bg-muted px-3 py-2 font-mono text-xs leading-relaxed">{token}</p>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => copyText(`${window.location.origin}/api/agent/campus`, "주소를 복사했습니다")}
                >
                  주소 복사
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => copyText(agentInstructions(window.location.origin), "작성 지침을 복사했습니다")}
                >
                  작성 지침 복사
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </SheetContent>
    </Sheet>
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
