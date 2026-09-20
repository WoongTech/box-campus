"use client";

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
      <SheetContent side="bottom" className="mx-auto max-h-[80dvh] max-w-[430px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>따라가는 주제</SheetTitle>
          <SheetDescription>사진이 없어도 주제만 있으면 됩니다.</SheetDescription>
        </SheetHeader>
        <div className="flex max-h-[40dvh] flex-col gap-1 overflow-y-auto px-4 pb-2">
          {library.order.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">아직 따라가는 주제가 없습니다.</p>
          ) : null}
          {library.order.map((id) => {
            const name = titleOf(library.shelves[id], id);
            const current = id === state.campus.id;
            return (
              <Button
                key={id}
                type="button"
                variant={current ? "secondary" : "ghost"}
                className="h-auto justify-start gap-3 px-2 py-2"
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
        {savedCount > 0 ? (
          <p className="px-4 text-sm text-muted-foreground">저장한 장 {savedCount}</p>
        ) : null}
        <div className="flex flex-col gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="w-full"
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
            className="w-full"
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
  const form = useForm({
    defaultValues: { raw: "" },
    onSubmit: ({ value }) => {
      const raw = parsePastedCampus(value.raw);
      actions.dispatch({
        kind: "import-campus",
        raw,
        transitionId: state.transitionId,
      });
      if (isRejectedPaste(raw)) return;
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>주제 넣기</SheetTitle>
          <SheetDescription>JSON이거나, 채팅이 만든 묶음 그대로여도 됩니다. 그림은 없어도 됩니다.</SheetDescription>
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
                className="min-h-32 font-mono text-xs"
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            )}
          </form.Field>
          <Button type="submit" className="w-full">
            붙이기
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
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
