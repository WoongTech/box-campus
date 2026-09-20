"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useCampus } from "./campus-provider";
import { useFieldFocusLock } from "./interaction-lock";

export function AccountSheet({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
}) {
  const { state, library, actions } = useCampus();
  const savedCount = library.saved.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[82dvh] max-w-[390px] gap-0 rounded-t-2xl pb-0"
      >
        <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        <SheetHeader className="pb-2 text-left">
          <SheetTitle>따라가는 주제</SheetTitle>
          <SheetDescription>사진이 없어도 주제만 있으면 됩니다.</SheetDescription>
        </SheetHeader>
        <div className="flex max-h-[36dvh] min-h-[8rem] flex-col gap-1 overflow-y-auto px-4 pb-3">
          {library.order.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center">
              <p className="text-sm font-medium">아직 따라가는 주제가 없습니다</p>
              <p className="mt-1 text-xs text-muted-foreground">새 주제를 만들거나 묶음을 붙여 보세요.</p>
            </div>
          ) : null}
          {library.order.map((id) => {
            const name = titleOf(library.shelves[id], id);
            const current = id === state.campus.id;
            return (
              <Button
                key={id}
                type="button"
                variant={current ? "secondary" : "ghost"}
                className="h-auto min-h-11 justify-start gap-3 px-2 py-2.5"
                onClick={() => {
                  onOpenChange(false);
                  if (!current) actions.openAccount(id);
                }}
              >
                <Avatar>
                  <AvatarFallback>{name.trim().slice(0, 1) || "주"}</AvatarFallback>
                </Avatar>
                <span className="truncate">{name}</span>
              </Button>
            );
          })}
        </div>
        <p className="px-4 pb-2 text-sm text-muted-foreground">
          {savedCount > 0 ? `저장한 장 ${savedCount}` : "저장한 장 없음"}
        </p>
        <div className="flex flex-col gap-2 border-t border-border/40 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="min-h-11 w-full"
            onClick={() => {
              onOpenChange(false);
              if (state.session.kind !== "feed") return;
              actions.dispatch({ kind: "start-advisor" });
            }}
          >
            새 주제
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full"
            onClick={() => {
              onOpenChange(false);
              onAdd();
            }}
          >
            묶음 붙이기
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ImportSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      form.reset();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[390px] gap-0 rounded-t-2xl pb-0">
        <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        <SheetHeader className="pb-2 text-left">
          <SheetTitle>주제 넣기</SheetTitle>
          <SheetDescription>
            JSON이거나, 채팅이 만든 묶음 그대로여도 됩니다. 그림은 없어도 됩니다.
          </SheetDescription>
        </SheetHeader>
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

function titleOf(raw: string | undefined, fallback: string) {
  if (!raw) return fallback;
  try {
    const dumped = JSON.parse(raw) as { campus?: { title?: string } };
    return dumped.campus?.title || fallback;
  } catch {
    return fallback;
  }
}
