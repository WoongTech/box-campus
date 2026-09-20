"use strict";

var fs = require("fs");
var vm = require("vm");
var path = require("path");

var root = __dirname;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

function assertEqual(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    console.error("FAIL:", msg, a, b);
    process.exit(1);
  }
}

var engineSrc = fs.readFileSync(path.join(root, "engine.js"), "utf8");
var sampleSrc = fs.readFileSync(path.join(root, "sample-campus.js"), "utf8");
var appSrc = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert(engineSrc.indexOf("fetch(") === -1, "engine.js must not contain fetch(");
assert(appSrc.indexOf("fetch(") === -1, "app.js must not contain fetch(");
var hosts = [
  "api.openai.com",
  "api.x.ai",
  "generativelanguage.googleapis.com",
];
for (var h = 0; h < hosts.length; h++) {
  assert(engineSrc.indexOf(hosts[h]) === -1, "engine.js host string");
  assert(appSrc.indexOf(hosts[h]) === -1, "app.js host string");
}

var context = { console: console };
vm.createContext(context);
vm.runInContext(sampleSrc, context, { filename: "sample-campus.js" });
vm.runInContext(engineSrc, context, { filename: "engine.js" });
var BoxCampus = context.BoxCampus;
var BOX_CAMPUS_SAMPLE = context.BOX_CAMPUS_SAMPLE;

var FIXED_NOW = 1_700_000_000_000;

var state = BoxCampus.createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
var frame = BoxCampus.schedule(state, FIXED_NOW, { kind: "resume" });
assert(frame.kind === "card", "frame is card");
assert(frame.view.roleLabel === "사서", "fresh sample frame is librarian");

var frame2 = BoxCampus.schedule(state, FIXED_NOW, { kind: "resume" });
assertEqual(frame, frame2, "schedule is stable");

var advanced = BoxCampus.record(
  state,
  { kind: "advance", transitionId: frame.transitionId },
  FIXED_NOW
);
var stale = BoxCampus.record(
  advanced,
  { kind: "advance", transitionId: frame.transitionId },
  FIXED_NOW
);
assert(stale === advanced, "stale advance returns same state reference");

while (frame.view.roleLabel !== "튜터") {
  frame = BoxCampus.schedule(advanced, FIXED_NOW, { kind: "resume" });
  if (frame.view.control.kind === "advance") {
    advanced = BoxCampus.record(
      advanced,
      { kind: "advance", transitionId: frame.transitionId },
      FIXED_NOW
    );
  } else break;
}

frame = BoxCampus.schedule(advanced, FIXED_NOW, { kind: "resume" });
assert(frame.view.roleLabel === "튜터", "reached tutor");
var wrongIdx = 0;
for (var i = 0; i < frame.view.control.options.length; i++) {
  if (frame.view.control.options[i].label.indexOf("두 배로") >= 0) wrongIdx = i;
}
var afterPick = BoxCampus.record(
  advanced,
  {
    kind: "activate",
    transitionId: frame.transitionId,
    actionId: frame.view.control.options[wrongIdx].actionId,
  },
  FIXED_NOW
);
var revealed = BoxCampus.schedule(afterPick, FIXED_NOW, { kind: "resume" });
assert(
  revealed.view.blocks.some(function (b) {
    return b.kind === "verdict";
  }),
  "tutor reveal changes the view"
);
var again = BoxCampus.record(
  afterPick,
  {
    kind: "activate",
    transitionId: frame.transitionId,
    actionId: frame.view.control.options[wrongIdx].actionId,
  },
  FIXED_NOW
);
assert(again === afterPick, "second identical tutor activate is idempotent");

var beforeWrongAdvance = afterPick;
var tryEarly = BoxCampus.record(
  beforeWrongAdvance,
  { kind: "advance", transitionId: revealed.transitionId },
  FIXED_NOW
);
var tutorFrame = BoxCampus.schedule(beforeWrongAdvance, FIXED_NOW, { kind: "resume" });
if (tutorFrame.view.control.kind === "choices") {
  assert(tryEarly === beforeWrongAdvance, "wrong tutor cannot advance before reveal");
}

state = BoxCampus.createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
state = BoxCampus.record(state, { kind: "start-advisor" }, FIXED_NOW);
state = BoxCampus.record(
  state,
  {
    kind: "submit-text",
    transitionId: state.transitionId,
    actionId: "adv-0",
    value: "테스트 주제",
  },
  FIXED_NOW
);
var steps = [
  "adv-fl-0",
  "adv-bl-0",
  "adv-rh-0",
  "adv-ln-0",
];
for (var s = 0; s < steps.length; s++) {
  frame = BoxCampus.schedule(state, FIXED_NOW, { kind: "resume" });
  state = BoxCampus.record(
    state,
    {
      kind: "activate",
      transitionId: frame.transitionId,
      actionId: steps[s],
    },
    FIXED_NOW
  );
}
assert(state.authorBrief && state.authorBrief.indexOf("테스트 주제") >= 0, "authorBrief exists");
frame = BoxCampus.schedule(state, FIXED_NOW, { kind: "resume" });
assert(
  frame.view.blocks.some(function (b) {
    return b.kind === "badge" && b.text === "초안";
  }),
  "draft-badged cards after advisor"
);

var sampleCampus = BoxCampus.parseCampus(BOX_CAMPUS_SAMPLE);
state = BoxCampus.createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
state = BoxCampus.record(
  state,
  { kind: "import-campus", raw: BOX_CAMPUS_SAMPLE, transitionId: "x" },
  FIXED_NOW
);
assert(state.campus.id === sampleCampus.id, "import sample replaces campus");

var kept = BoxCampus.createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
var beforeImport = kept;
kept = BoxCampus.record(
  kept,
  { kind: "import-campus", raw: { nope: true }, transitionId: "x" },
  FIXED_NOW
);
assert(kept.campus.id === beforeImport.campus.id, "garbage import keeps campus");
assert(kept.notice, "garbage import sets notice");

var dayState = BoxCampus.createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
dayState.progress.dayPulse = { date: "1999-01-01", completed: 9 };
var nextDay = FIXED_NOW + 48 * 60 * 60 * 1000;
var scheduled = BoxCampus.schedule(dayState, nextDay, { kind: "resume" });
assert(
  scheduled.view.dayCount === 0,
  "new date key resets daily count"
);
assert(
  !("streakBroken" in dayState.progress) && !("brokenStreak" in dayState.progress),
  "no broken streak flag"
);

var round = BoxCampus.createInitialState(BOX_CAMPUS_SAMPLE, FIXED_NOW);
var reloaded = BoxCampus.parseState(BoxCampus.dumpState(round), BOX_CAMPUS_SAMPLE, FIXED_NOW);
assert(reloaded.recovered === false, "dumped state reloads");
assert(!reloaded.state.notice, "reload has no notice");
assert(
  BoxCampus.schedule(reloaded.state, FIXED_NOW, { kind: "resume" }).view.roleLabel === "사서",
  "reloaded feed is still the first card"
);

console.log("verify-engine.js: all assertions passed");
process.exit(0);
