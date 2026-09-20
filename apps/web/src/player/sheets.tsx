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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[80dvh] max-w-[430px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>따라가는 주제</SheetTitle>
          <SheetDescription>보고 있는 주제입니다.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4 pb-2">
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
                  <AvatarFallback>{name.trim().slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span>{name}</span>
              </Button>
            );
          })}
        </div>
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              onAdd();
            }}
          >
            주제 추가
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
      let raw: unknown = { invalid: true };
      try {
        raw = JSON.parse(value.raw) as unknown;
      } catch {
        raw = { invalid: true };
      }
      actions.dispatch({
        kind: "import-campus",
        raw,
        transitionId: state.transitionId,
      });
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>주제 넣기</SheetTitle>
          <SheetDescription>채팅이 만든 묶음을 붙여 넣습니다.</SheetDescription>
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

function titleOf(raw: string | undefined, fallback: string) {
  if (!raw) return fallback;
  try {
    const dumped = JSON.parse(raw) as { campus?: { title?: string } };
    return dumped.campus?.title || fallback;
  } catch {
    return fallback;
  }
}
