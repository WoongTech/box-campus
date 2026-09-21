"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
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
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight">묶음 붙이기</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-secondary">에이전트가 바로 넣지 못할 때는, 받은 JSON을 여기에 붙입니다.</p>
        </div>
        <form.Field name="raw">
          {(field) => (
            <textarea
              value={field.state.value}
              placeholder="묶음을 붙여 넣으세요"
              aria-label="묶음"
              rows={8}
              className="w-full resize-none rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] leading-relaxed text-primary outline-none placeholder:text-secondary"
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
        {pasteError ? <p className="text-[13px] text-error">{pasteError}</p> : null}
        <button type="submit" className="h-12 w-full rounded-full bg-white text-[15px] font-semibold text-black">
          붙이기
        </button>
        <div className="flex flex-col items-start">
          {state.authorBrief ? (
            <button type="button" className="py-1.5 text-[13px] text-secondary" onClick={() => copyText(state.authorBrief, "브리프를 복사했습니다")}>
              브리프 복사
            </button>
          ) : null}
          <button
            type="button"
            className="py-1.5 text-[13px] text-secondary"
            onClick={() => copyText(agentInstructions(window.location.origin), "작성 지침을 복사했습니다")}
          >
            작성 지침 복사
          </button>
          <button
            type="button"
            className="py-1.5 text-[13px] text-secondary"
            onClick={() => copyText(JSON.stringify(state.campus, null, 2), "지금 주제를 복사했습니다")}
          >
            지금 주제 복사
          </button>
        </div>
      </form>
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
