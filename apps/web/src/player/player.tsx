"use client";

import { useEffect, useState } from "react";
import { CampusProvider } from "./campus-provider";
import { InteractionLockProvider } from "./interaction-lock";
import { Stage } from "./stage";

export function Player() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col items-center justify-center gap-3 bg-background px-6">
        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">불러오는 중</p>
      </main>
    );
  }
  return (
    <CampusProvider>
      <InteractionLockProvider>
        <Stage />
      </InteractionLockProvider>
    </CampusProvider>
  );
}
