"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
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
      const beforeCampusId = state.campus.id;
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[390px] gap-0 rounded-t-2xl pb-0">
        <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        <SheetHeader className="pb-2 text-left">
          <SheetTitle>묶음 붙이기</SheetTitle>
          <SheetDescription>
            에이전트가 바로 넣지 못할 때는, 받은 JSON을 여기에 붙입니다.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2 px-4 pb-2 text-sm text-muted-foreground">
          <p>1. 추가에서 키와 작성 지침을 넘깁니다.</p>
          <p>2. 에이전트가 스토리를 넣지 못하면 JSON을 받습니다.</p>
          <p>3. 그 JSON을 아래에 붙입니다.</p>
        </div>
        <form
          className="space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="raw">
            {(field) => (
              <Textarea
                value={field.state.value}
                spellCheck={false}
                placeholder="묶음을 붙여 넣으세요"
                className="min-h-36 font-mono text-xs"
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  field.handleBlur();
                }}
                onChange={(event) => {
                  setPasteError(null);
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </form.Field>
          {pasteError ? (
            <p className="text-sm text-destructive" role="alert">
              {pasteError}
            </p>
          ) : null}
          {state.authorBrief ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full"
              onClick={() => copyText(state.authorBrief, "브리프를 복사했습니다")}
            >
              브리프 복사
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full"
            onClick={() => copyText(agentInstructions(window.location.origin), "작성 지침을 복사했습니다")}
          >
            작성 지침 복사
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full"
            onClick={() => copyText(JSON.stringify(state.campus, null, 2), "지금 주제를 복사했습니다")}
          >
            지금 주제 복사
          </Button>
          <Button type="submit" className="min-h-11 w-full">
            붙이기
          </Button>
        </form>
      </SheetContent>
    </Sheet>
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
