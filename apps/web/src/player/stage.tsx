"use client";

import { useEffect, useRef, useState } from "react";
import { useCampus } from "./campus-provider";
import { useInteractionLock } from "./interaction-lock";
import { AccountSheet, ImportSheet } from "./sheets";
import { FeedView } from "./feed-view";
import { StripView } from "./strip-view";

const WHEEL_LOCK_MS = 450;
const LEFT_ZONE = 0.33;

function isTextFieldFocused() {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || active.getAttribute("contenteditable") === "true";
}

export function Stage() {
  const { frame, actions, state } = useCampus();
  const { locked: fieldLocked } = useInteractionLock();
  const [accountsOpen, setAccountsOpen] = useState(
    () => typeof window !== "undefined" && !window.localStorage.getItem("box-campus-v1"),
  );
  const [importOpen, setImportOpen] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const wheelLock = useRef(false);
  const skipClick = useRef(false);

  const cardRole = frame.kind === "card" ? frame.view.role : "";
  const interactionBlocked = accountsOpen || importOpen || fieldLocked;

  function exitStory() {
    if (accountsOpen) {
      setAccountsOpen(false);
      return;
    }
    if (importOpen) {
      setImportOpen(false);
      return;
    }
    if (cardRole === "advisor") {
      actions.dispatch({ kind: "cancel-advisor" });
      return;
    }
    if (frame.kind === "strip") {
      actions.dispatch({ kind: "close-strip", transitionId: frame.transitionId });
      return;
    }
    setAccountsOpen(true);
  }

  function goNext() {
    if (frame.kind !== "card") return;
    if (cardRole === "hub") {
      setAccountsOpen(true);
      return;
    }
    if (cardRole === "day-close") return;
    actions.advance();
  }

  function goBack() {
    if (frame.kind !== "card") return;
    if (cardRole === "advisor") {
      actions.dispatch({ kind: "cancel-advisor" });
      return;
    }
    const trail =
      state.session.kind === "feed" ? (state.session.feed.trail?.length ?? 0) : 0;
    if (trail === 0) return;
    actions.back();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (fieldLocked || isTextFieldFocused()) return;
      if (event.key === "Escape") {
        exitStory();
        return;
      }
      if (interactionBlocked) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") goBack();
      if (event.key === "ArrowRight" || event.key === "ArrowDown") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interactionBlocked, fieldLocked, cardRole, actions, accountsOpen, importOpen, frame, state]);

  return (
    <main
      className="relative mx-auto min-h-dvh w-full max-w-[390px] bg-background"
      onClick={(event) => {
        if (interactionBlocked || isTextFieldFocused()) return;
        if (skipClick.current) {
          skipClick.current = false;
          return;
        }
        const bounds = event.currentTarget.getBoundingClientRect();
        const fromLeft = (event.clientX - bounds.left) / bounds.width;
        if (fromLeft < LEFT_ZONE) goBack();
        else goNext();
      }}
      onTouchStart={(event) => {
        if (interactionBlocked || isTextFieldFocused()) return;
        startY.current = event.changedTouches[0]?.clientY ?? 0;
        startX.current = event.changedTouches[0]?.clientX ?? 0;
      }}
      onTouchEnd={(event) => {
        if (interactionBlocked || isTextFieldFocused()) return;
        const endY = event.changedTouches[0]?.clientY ?? 0;
        const endX = event.changedTouches[0]?.clientX ?? 0;
        const deltaY = startY.current - endY;
        const deltaX = endX - startX.current;
        if (Math.abs(deltaX) < 48 && Math.abs(deltaY) < 48) return;
        skipClick.current = true;
        if (deltaY < -48 && Math.abs(deltaY) > Math.abs(deltaX)) {
          exitStory();
          return;
        }
        if (deltaX > 48 && Math.abs(deltaX) > Math.abs(deltaY)) goBack();
        else if (deltaY > 48) goNext();
      }}
      onWheel={(event) => {
        if (interactionBlocked || isTextFieldFocused() || wheelLock.current) return;
        if (Math.abs(event.deltaY) < 48) return;
        wheelLock.current = true;
        if (event.deltaY < 0) goBack();
        else goNext();
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
