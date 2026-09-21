"use client";

import { useEffect, useState } from "react";
import { CampusProvider } from "./campus-provider";
import { InteractionLockProvider } from "./interaction-lock";
import { Center } from "@astryxdesign/core/Center";
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
      <PhoneFrame role="main">
        <Center height="100%">
          <Wordmark />
        </Center>
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
