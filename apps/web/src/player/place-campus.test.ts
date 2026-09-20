import assert from "node:assert/strict";
import test from "node:test";
import {
  BOX_CAMPUS_SAMPLE,
  createInitialState,
  dumpState,
  parseState,
  record,
  schedule,
} from "@box-campus/engine";
import { absorbFeed, emptyShelf, placeCampus } from "./place-campus";

const now = 1_700_000_000_000;

test("a new story is stored without replacing the open one", () => {
  const first = createInitialState(BOX_CAMPUS_SAMPLE, now);
  const placed = placeCampus({
    sessionText: null,
    library: emptyShelf(),
    raw: BOX_CAMPUS_SAMPLE,
    now,
  });
  assert.equal(placed.id, first.campus.id);
  const second = structuredClone(BOX_CAMPUS_SAMPLE) as { id: string; title: string };
  second.id = "other-story";
  second.title = "다른 스토리";
  const again = placeCampus({
    sessionText: placed.sessionText,
    library: placed.library,
    raw: second,
    now,
  });
  const active = parseState(again.sessionText, BOX_CAMPUS_SAMPLE, now);
  assert.equal(active.state.campus.id, first.campus.id);
  assert.equal(again.library.order.includes("other-story"), true);
});

test("updating the open story keeps the current card", () => {
  const start = createInitialState(BOX_CAMPUS_SAMPLE, now);
  const frame = schedule(start, now, { kind: "resume" });
  assert.equal(frame.kind, "card");
  if (frame.kind !== "card") return;
  const advanced = record(start, { kind: "advance", transitionId: frame.transitionId }, now);
  const cardId = advanced.session.kind === "feed" ? advanced.session.feed.current.cardId : "";
  const edited = structuredClone(BOX_CAMPUS_SAMPLE) as { title: string };
  edited.title = "고친 제목";
  const placed = placeCampus({
    sessionText: dumpState(advanced),
    library: {
      order: [start.campus.id],
      shelves: { [start.campus.id]: dumpState(advanced) },
      saved: [],
    },
    raw: edited,
    now,
  });
  const active = parseState(placed.sessionText, BOX_CAMPUS_SAMPLE, now);
  assert.equal(active.state.campus.title, "고친 제목");
  assert.equal(active.state.session.kind === "feed" ? active.state.session.feed.current.cardId : "", cardId);
});

test("stories from any shelf show up together and local saves stay", () => {
  const first = placeCampus({
    sessionText: null,
    library: emptyShelf(),
    raw: BOX_CAMPUS_SAMPLE,
    now,
  });
  const other = structuredClone(BOX_CAMPUS_SAMPLE) as { id: string; title: string };
  other.id = "other-story";
  other.title = "다른 스토리";
  const second = placeCampus({
    sessionText: null,
    library: emptyShelf(),
    raw: other,
    now,
  });
  const merged = absorbFeed({ ...first.library, saved: ["kept-card"] }, second.library, now);
  assert.deepEqual(merged.order, [first.id, "other-story"]);
  assert.deepEqual(merged.saved, ["kept-card"]);
  const again = absorbFeed(merged, second.library, now);
  assert.equal(again.shelves["other-story"], merged.shelves["other-story"]);
});
