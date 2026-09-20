"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCampus } from "./campus-provider";

export function StripView() {
  const { frame, actions } = useCampus();
  if (frame.kind !== "strip") return null;

  return (
    <ScrollArea className="h-dvh">
      <div className="space-y-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
        <h1 className="text-xl font-semibold tracking-tight">{frame.title}</h1>
        {frame.weeks.map((week) => {
          const empty = week.ideaIds.length === 0;
          return (
            <Card key={week.id} className={empty ? "opacity-50" : undefined}>
              <CardHeader>
                <CardTitle>
                  {week.number}주 · {week.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{week.promise}</p>
                {empty ? <p className="mt-2">아직 장이 없다</p> : null}
              </CardContent>
            </Card>
          );
        })}
        <Button
          type="button"
          variant="ghost"
          onClick={() => actions.dispatch({ kind: "close-strip", transitionId: frame.transitionId })}
        >
          피드로
        </Button>
      </div>
    </ScrollArea>
  );
}
