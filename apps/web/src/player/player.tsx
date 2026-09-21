"use client";

import { useEffect, useState } from "react";
import { CampusProvider } from "./campus-provider";
import { InteractionLockProvider } from "./interaction-lock";
import { Wordmark } from "./brand";
import { PhoneFrame } from "./phone-frame";
import { Stage } from "./stage";

export function Player() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return (
      <PhoneFrame role="main" className="flex items-center justify-center">
        <Wordmark />
      </PhoneFrame>
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
