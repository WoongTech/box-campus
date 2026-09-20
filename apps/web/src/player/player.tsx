"use client";

import { useEffect, useState } from "react";
import { CampusProvider } from "./campus-provider";
import { InteractionLockProvider } from "./interaction-lock";
import { Wordmark } from "./brand";
import { Stage } from "./stage";

export function Player() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col items-center justify-center gap-4 bg-background px-6">
        <Wordmark />
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
