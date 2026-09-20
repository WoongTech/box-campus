"use client";

import { useEffect, useState } from "react";
import { CampusProvider } from "./campus-provider";
import { Stage } from "./stage";

export function Player() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) return <main className="min-h-dvh bg-background" />;
  return (
    <CampusProvider>
      <Stage />
    </CampusProvider>
  );
}
