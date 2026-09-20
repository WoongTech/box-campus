"use client";

import { useEffect, useRef, useState } from "react";
import { useCampus } from "./campus-provider";
import { useInteractionLock } from "./interaction-lock";
import { AccountSheet, ImportSheet } from "./sheets";
import { FeedView } from "./feed-view";
import { StripView } from "./strip-view";

const WHEEL_LOCK_MS = 450;

function isTextFieldFocused() {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || active.getAttribute("contenteditable") === "true";
}

export function Stage() {
  const { frame, actions } = useCampus();
  const { locked: fieldLocked } = useInteractionLock();
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const startY = useRef(0);
  const wheelLock = useRef(false);

  const interactionBlocked = accountsOpen || importOpen || fieldLocked;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (interactionBlocked || isTextFieldFocused()) return;
      if (event.key === "ArrowDown") actions.advance();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, interactionBlocked]);

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-[390px] bg-background"
      onTouchStart={(event) => {
        if (interactionBlocked || isTextFieldFocused()) return;
        startY.current = event.changedTouches[0]?.clientY ?? 0;
      }}
      onTouchEnd={(event) => {
        if (interactionBlocked || isTextFieldFocused()) return;
        const endY = event.changedTouches[0]?.clientY ?? 0;
        if (startY.current - endY > 48) actions.advance();
      }}
      onWheel={(event) => {
        if (
          interactionBlocked ||
          isTextFieldFocused() ||
          wheelLock.current ||
          event.deltaY < 48
        ) {
          return;
        }
        wheelLock.current = true;
        actions.advance();
        window.setTimeout(() => {
          wheelLock.current = false;
        }, WHEEL_LOCK_MS);
      }}
    >
      {frame.kind === "strip" ? <StripView /> : <FeedView onOpenAccounts={() => setAccountsOpen(true)} />}
      <AccountSheet
        open={accountsOpen}
        onOpenChange={setAccountsOpen}
        onAdd={() => setImportOpen(true)}
      />
      <ImportSheet open={importOpen} onOpenChange={setImportOpen} />
    </main>
  );
}
