import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  BOX_CAMPUS_SAMPLE,
  createInitialState,
  dumpState,
  parseCampus,
  parseState,
  record,
  schedule,
  type Frame,
  type PlayerState,
} from "../src/index.ts";

const FIXED_NOW = 1_700_000_000_000;
const here = path.dirname(fileURLToPath(import.meta.url));

function cardFrame(frame: Frame) {
  assert.equal(frame.kind, "card");
  if (frame.kind !== "card") throw new Error("expected card");
  return frame;
}

test("player sources do not call a model host", () => {
  const root = path.resolve(here, "../../..");
  const files = collectSources([
    path.join(root, "packages/engine/src"),
    path.join(root, "apps/web/src"),
  ]);
  const hosts = ["api.openai.com", "api.x.ai", "generativelanguage.googleapis.com"];
  assert.ok(files.length > 0);
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    assert.equal(src.includes("fetch("), false, file);
    for (const host of hosts) assert.equal(src.includes(host), false, `${file} ${host}`);
  }
});

function collectSources(dirs: string[]) {
  const found: string[] = [];
  for (const dir of dirs) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) found.push(...collectSources([full]));
      else if (/\.(ts|tsx)$/.test(entry.name)) found.push(full);
    }
  }
  return found;
}

test("schedule is stable and stale advance is identity", () => {
  const state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  const frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  assert.equal(frame.view.roleLabel, "사서");
  const again = schedule(state, FIXED_NOW, { kind: "resume" });
  assert.deepEqual(again, frame);

  const advanced = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
  const stale = record(advanced, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
  assert.equal(stale, advanced);
});

test("tutor reveal is idempotent and blocks advance before reveal", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  let frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  while (frame.view.roleLabel !== "튜터") {
    assert.equal(frame.view.control.kind, "advance");
    state = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
    frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  }
  assert.equal(frame.view.control.kind, "choices");
  if (frame.view.control.kind !== "choices") return;
  const wrong = frame.view.control.options.find((option) => option.label.includes("두 배로"));
  assert.ok(wrong);
  const afterPick = record(
    state,
    { kind: "activate", transitionId: frame.transitionId, actionId: wrong.actionId },
    FIXED_NOW,
  );
  const revealed = cardFrame(schedule(afterPick, FIXED_NOW, { kind: "resume" }));
  assert.ok(revealed.view.blocks.some((block) => block.kind === "verdict"));
  const second = record(
    afterPick,
    { kind: "activate", transitionId: frame.transitionId, actionId: wrong.actionId },
    FIXED_NOW,
  );
  assert.equal(second, afterPick);
  if (revealed.view.control.kind === "choices") {
    const early = record(afterPick, { kind: "advance", transitionId: revealed.transitionId }, FIXED_NOW);
    assert.equal(early, afterPick);
  }
});

test("fifth advisor answer installs a draft and an author brief", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  state = record(state, { kind: "start-advisor" }, FIXED_NOW);
  state = record(
    state,
    { kind: "submit-text", transitionId: state.transitionId, actionId: "adv-0", value: "테스트 주제" },
    FIXED_NOW,
  );
  for (const actionId of ["adv-fl-0", "adv-bl-0", "adv-rh-0", "adv-ln-0"]) {
    const frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
    state = record(
      state,
      { kind: "activate", transitionId: frame.transitionId, actionId },
      FIXED_NOW,
    );
  }
  assert.ok(state.authorBrief?.includes("테스트 주제"));
  const frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  assert.ok(frame.view.blocks.some((block) => block.kind === "badge" && block.text === "초안"));
});

test("import replaces a valid campus and keeps the old one on garbage", () => {
  const sampleCampus = parseCampus(BOX_CAMPUS_SAMPLE);
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  state = record(
    state,
    { kind: "import-campus", raw: BOX_CAMPUS_SAMPLE, transitionId: "x" },
    FIXED_NOW,
  );
  assert.equal(state.campus.id, sampleCampus.id);

  const kept = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  const after = record(kept, { kind: "import-campus", raw: { nope: true }, transitionId: "x" }, FIXED_NOW);
  assert.equal(after.campus.id, kept.campus.id);
  assert.ok(after.notice);
});

test("a new date resets the day count and there is no streak flag", () => {
  const dayState = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  dayState.progress.dayPulse = { date: "1999-01-01", completed: 9 };
  const nextDay = FIXED_NOW + 48 * 60 * 60 * 1000;
  const scheduled = cardFrame(schedule(dayState, nextDay, { kind: "resume" }));
  assert.equal(scheduled.view.dayCount, 0);
  assert.equal("streakBroken" in dayState.progress, false);
  assert.equal("brokenStreak" in dayState.progress, false);
});

test("leaving the design questions returns to the same card", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  const before = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  state = record(state, { kind: "start-advisor" }, FIXED_NOW);
  state = record(
    state,
    { kind: "submit-text", transitionId: state.transitionId, actionId: "adv-0", value: "도시의 나무" },
    FIXED_NOW,
  );
  state = record(state, { kind: "cancel-advisor" }, FIXED_NOW);
  const after = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  assert.equal(after.view.roleLabel, before.view.roleLabel);
  assert.equal(state.campus.id, "sample-photo-exposure");
  assert.equal(state.session.kind, "feed");
});

test("a wrong check keeps the explanation primary on reveal", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  let frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  while (frame.view.control.kind !== "choices" || !frame.view.blocks.some((b) => b.text.includes("셔터"))) {
    state = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
    frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  }
  const wrong = frame.view.control.options.find((option) => option.label.includes("두 배로"));
  assert.ok(wrong);
  const questionLine = frame.view.blocks.find((block) => block.kind === "title")?.text ?? "";
  state = record(
    state,
    { kind: "activate", transitionId: frame.transitionId, actionId: wrong.actionId },
    FIXED_NOW,
  );
  frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  const title = frame.view.blocks.find((block) => block.kind === "title");
  assert.ok(title?.text.includes("반이"));
  assert.ok(
    frame.view.blocks.some(
      (block) => block.kind === "body" && block.text === questionLine,
    ),
  );
  assert.equal(
    frame.view.blocks.some((block) => block.kind === "body" && block.text.startsWith("질문:")),
    false,
  );
  assert.ok(
    frame.view.blocks.some(
      (block) => block.kind === "body" && block.text === wrong.label,
    ),
  );
});

test("advisor rhythm installs a daily goal that pauses the feed", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  state.progress.dailyGoal = 2;
  state.progress.dayPulse.completed = 1;
  let frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  state = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
  frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  assert.ok(frame.view.blocks.some((block) => block.kind === "title" && block.text === "오늘은 여기까지"));
  assert.equal(state.session.kind, "feed");
  if (state.session.kind === "feed") {
    assert.equal(state.session.feed.dayClose, true);
    assert.ok(state.session.feed.resumeFeed);
  }
});

test("a new day resumes after the daily pause", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  state.progress.dailyGoal = 1;
  let frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  state = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
  frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  assert.ok(frame.view.blocks.some((block) => block.text === "오늘은 여기까지"));
  const nextDay = FIXED_NOW + 48 * 60 * 60 * 1000;
  frame = cardFrame(schedule(state, nextDay, { kind: "resume" }));
  assert.equal(frame.view.blocks.some((block) => block.text === "오늘은 여기까지"), false);
  assert.equal(frame.view.dayCount, 0);
});

test("fifth advisor answer sets daily goal from rhythm choice", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  state = record(state, { kind: "start-advisor" }, FIXED_NOW);
  state = record(
    state,
    { kind: "submit-text", transitionId: state.transitionId, actionId: "adv-0", value: "테스트 주제" },
    FIXED_NOW,
  );
  for (const actionId of ["adv-fl-0", "adv-bl-0", "adv-rh-1", "adv-ln-0"]) {
    const frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
    state = record(
      state,
      { kind: "activate", transitionId: frame.transitionId, actionId },
      FIXED_NOW,
    );
  }
  assert.equal(state.progress.dailyGoal, 12);
});

test("editor after a check carries the last explanation forward", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  let frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  while (frame.view.control.kind !== "choices" || !frame.view.blocks.some((b) => b.text.includes("셔터"))) {
    state = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
    frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  }
  const correct = frame.view.control.options.find((option) => option.label.includes("반으로"));
  assert.ok(correct);
  state = record(
    state,
    { kind: "activate", transitionId: frame.transitionId, actionId: correct.actionId },
    FIXED_NOW,
  );
  frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  const bridgeHint = frame.view.blocks.find((block) => block.kind === "title")?.text ?? "";
  state = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
  frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  assert.ok(
    frame.view.blocks.some(
      (block) => block.kind === "body" && block.text === bridgeHint,
    ),
  );
  assert.equal(
    frame.view.blocks.some(
      (block) => block.kind === "body" && block.text.startsWith("방금 정리:"),
    ),
    false,
  );
  assert.ok(
    frame.view.blocks.some(
      (block) => block.kind === "title" && block.text.includes("배경을 흐리게"),
    ),
  );
});

test("dump and parse reload the first card without a notice", () => {
  const round: PlayerState = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  const reloaded = parseState(dumpState(round), BOX_CAMPUS_SAMPLE, FIXED_NOW);
  assert.equal(reloaded.recovered, false);
  assert.equal(reloaded.state.notice, null);
  const frame = cardFrame(schedule(reloaded.state, FIXED_NOW, { kind: "resume" }));
  assert.equal(frame.view.roleLabel, "사서");
});

test("tapping back returns to the previous card and does not count it again", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  let frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  assert.equal(state.session.kind, "feed");
  if (state.session.kind !== "feed") return;
  const firstId = state.session.feed.current.cardId;
  state = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
  frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  assert.equal(state.session.kind, "feed");
  if (state.session.kind !== "feed") return;
  assert.notEqual(state.session.feed.current.cardId, firstId);
  assert.equal(state.progress.dayPulse.completed, 1);
  state = record(state, { kind: "back", transitionId: frame.transitionId }, FIXED_NOW);
  assert.equal(state.session.kind, "feed");
  if (state.session.kind !== "feed") return;
  assert.equal(state.session.feed.current.cardId, firstId);
  assert.equal(state.progress.dayPulse.completed, 1);
  frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  state = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
  assert.equal(state.progress.dayPulse.completed, 1);
  assert.equal(state.session.kind, "feed");
  if (state.session.kind === "feed") {
    assert.notEqual(state.session.feed.current.cardId, firstId);
  }
});

function correctChoice(
  state: PlayerState,
  options: { actionId: string; label: string }[],
) {
  if (state.session.kind !== "feed") return options[0].actionId;
  const cardId = state.session.feed.current.cardId;
  const card = (
    state.campus.cards as Array<{
      id: string;
      choices?: { isCorrect?: boolean }[];
      patches?: { closesHole?: boolean }[];
    }>
  ).find((item) => item.id === cardId);
  const index = card?.choices
    ? card.choices.findIndex((choice) => choice.isCorrect)
    : card?.patches
      ? card.patches.findIndex((patch) => patch.closesHole)
      : 0;
  return options[index >= 0 ? index : 0]?.actionId ?? options[0].actionId;
}

test("one idea finishes before the next, then the feed can reopen it", () => {
  let state = createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
  state = {
    ...state,
    progress: { ...state.progress, dailyGoal: 40 },
  };
  const seen: string[] = [];
  for (let step = 0; step < 80; step++) {
    const frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
    if (frame.view.role === "hub") break;
    if (state.session.kind !== "feed") break;
    const cardId = state.session.feed.current.cardId;
    if (cardId && seen[seen.length - 1] !== cardId) seen.push(cardId);
    if (frame.view.control.kind === "choices") {
      state = record(
        state,
        {
          kind: "activate",
          transitionId: frame.transitionId,
          actionId: correctChoice(state, frame.view.control.options),
        },
        FIXED_NOW,
      );
    } else {
      state = record(state, { kind: "advance", transitionId: frame.transitionId }, FIXED_NOW);
    }
  }
  assert.deepEqual(seen.slice(0, 8), [
    "lib-a",
    "tutor-a",
    "editor-a",
    "room-a",
    "lib-b",
    "tutor-b",
    "editor-b",
    "room-b",
  ]);
  assert.equal(seen.includes("lib-e"), true);
  assert.equal(seen.at(-1), "room-f");
  const frame = cardFrame(schedule(state, FIXED_NOW, { kind: "resume" }));
  assert.equal(frame.view.role, "hub");
  assert.ok(frame.view.blocks.some((block) => block.text === "이 주제의 장을 다 봤습니다"));
  state = record(
    state,
    { kind: "open-idea", ideaId: "idea-c", transitionId: state.transitionId },
    FIXED_NOW,
  );
  assert.equal(state.session.kind, "feed");
  if (state.session.kind === "feed") {
    assert.equal(state.session.feed.current.cardId, "lib-c");
    assert.equal(state.session.feed.hub, false);
  }
});
