// Proven schedule/record core. Behavior is covered by test/verify.ts.
// @ts-nocheck
var ONE_MORE_LOOP = {
  id: "one-more",
  koreanName: "한 장 더",
  slots: [
    { role: "librarian", payoff: "clarity" },
    { role: "tutor", payoff: "commit-and-reveal" },
    { role: "editor", payoff: "repair" },
    { role: "roommate", payoff: "surprise" },
  ],
  rules: [
    { kind: "retry-wrong-tutor", afterCompletedCards: 2 },
    { kind: "place-due-tutor-in-next-role-slot" },
    { kind: "avoid-consecutive-idea", lookback: 1 },
  ],
};

var ROLE_LABELS = {
  advisor: "조언자",
  librarian: "사서",
  tutor: "튜터",
  editor: "에디터",
  roommate: "룸메이트",
  hub: "안내",
};

var ALTER_LETTER = {
  advisor: "A",
  librarian: "L",
  tutor: "T",
  editor: "E",
  roommate: "R",
};

var SLOT_ROLES = ["librarian", "tutor", "editor", "roommate"];

function assert(cond, msg) {
  if (!cond) throw msg;
}

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function optionalImage(card) {
  if (card.image == null) return null;
  if (!isObject(card.image)) throw "캠퍼스 묶음: 사진 형식이 잘못되었습니다.";
  var src = nonEmptyString(card.image.src, "사진 주소");
  if (src.indexOf("https://") !== 0) throw "캠퍼스 묶음: 사진은 https 주소여야 합니다.";
  return {
    src: src,
    alt: nonEmptyString(card.image.alt, "사진 설명"),
  };
}

function nonEmptyString(v, field) {
  if (typeof v !== "string" || v.trim() === "") {
    throw "캠퍼스 묶음: " + field + "이 비어 있습니다.";
  }
  return v.trim();
}

function parseCampus(raw) {
  if (!isObject(raw)) throw "캠퍼스 묶음 형식이 올바르지 않습니다.";

  var id = nonEmptyString(raw.id, "id");
  var title = nonEmptyString(raw.title, "title");
  var origin = raw.origin === "advisor-template" ? "advisor-template" : "authored-sample";
  var format = raw.format == null ? "course" : raw.format;
  if (format !== "course" && format !== "volume" && format !== "series") {
    throw "캠퍼스 묶음: 형식은 course, volume, series 중 하나여야 합니다.";
  }
  if (!Array.isArray(raw.weeks) || raw.weeks.length === 0) {
    throw "캠퍼스 묶음: 묶음 부분이 없습니다.";
  }
  if (format === "course" && raw.weeks.length !== 6) {
    throw "캠퍼스 묶음: 주차는 정확히 6개여야 합니다.";
  }
  if (format === "volume" && raw.weeks.length !== 1) {
    throw "캠퍼스 묶음: 단행본은 부분이 하나여야 합니다.";
  }

  var weeks = [];
  var weekCount = raw.weeks.length;
  for (var wi = 0; wi < weekCount; wi++) {
    var w = raw.weeks[wi];
    if (!isObject(w)) throw "캠퍼스 묶음: 부분 " + (wi + 1) + " 형식이 잘못되었습니다.";
    var num = w.number;
    if (num !== wi + 1) {
      throw format === "course"
        ? "캠퍼스 묶음: 주차 번호가 1부터 6까지 순서여야 합니다."
        : "캠퍼스 묶음: 부분 번호가 1부터 순서여야 합니다.";
    }
    var weekId = nonEmptyString(w.id, "부분 id");
    var ideaIds = Array.isArray(w.ideaIds) ? w.ideaIds.slice() : [];
    if (wi === 0 && ideaIds.length === 0) {
      throw format === "course"
        ? "캠퍼스 묶음: 1주차에는 최소 한 개의 아이디어가 필요합니다."
        : "캠퍼스 묶음: 첫 부분에는 최소 한 개의 아이디어가 필요합니다.";
    }
    weeks.push({
      id: weekId,
      number: num,
      title: nonEmptyString(w.title, "주차 제목"),
      promise: nonEmptyString(w.promise, "주차 약속"),
      ideaIds: ideaIds,
    });
  }

  if (!Array.isArray(raw.ideas) || raw.ideas.length === 0) {
    throw "캠퍼스 묶음: 아이디어가 없습니다.";
  }

  var ideas = [];
  var ideaIdSet = {};
  for (var ii = 0; ii < raw.ideas.length; ii++) {
    var idea = raw.ideas[ii];
    if (!isObject(idea)) throw "캠퍼스 묶음: 아이디어 형식이 잘못되었습니다.";
    var iid = nonEmptyString(idea.id, "아이디어 id");
    if (ideaIdSet[iid]) throw "캠퍼스 묶음: 아이디어 id가 겹칩니다.";
    ideaIdSet[iid] = true;
    ideas.push({
      id: iid,
      title: nonEmptyString(idea.title, "아이디어 제목"),
      weekId: nonEmptyString(idea.weekId, "아이디어 주차"),
    });
  }

  var weekIds = {};
  for (var wk = 0; wk < weeks.length; wk++) weekIds[weeks[wk].id] = true;

  for (var wi2 = 0; wi2 < weeks.length; wi2++) {
    for (var ij = 0; ij < weeks[wi2].ideaIds.length; ij++) {
      if (!ideaIdSet[weeks[wi2].ideaIds[ij]]) {
        throw "캠퍼스 묶음: 주차가 없는 아이디어 참조입니다.";
      }
    }
  }

  for (var idk in ideaIdSet) {
    var foundWeek = false;
    for (var wi3 = 0; wi3 < ideas.length; wi3++) {
      if (ideas[wi3].id === idk) {
        if (!weekIds[ideas[wi3].weekId]) {
          throw "캠퍼스 묶음: 아이디어의 주차가 없습니다.";
        }
        foundWeek = true;
      }
    }
    if (!foundWeek) throw "캠퍼스 묶음: 아이디어 정의가 없습니다.";
  }

  if (!Array.isArray(raw.cards) || raw.cards.length === 0) {
    throw "캠퍼스 묶음: 학습 카드가 없습니다.";
  }

  var cards = [];
  var cardIdSet = {};
  for (var ci = 0; ci < raw.cards.length; ci++) {
    var c = raw.cards[ci];
    if (!isObject(c) || typeof c.role !== "string") {
      throw "캠퍼스 묶음: 카드 형식이 잘못되었습니다.";
    }
    var cid = nonEmptyString(c.id, "카드 id");
    if (cardIdSet[cid]) throw "캠퍼스 묶음: 카드 id가 겹칩니다.";
    cardIdSet[cid] = true;
    var ideaId = nonEmptyString(c.ideaId, "카드 아이디어");
    if (!ideaIdSet[ideaId]) throw "캠퍼스 묶음: 카드의 아이디어가 없습니다.";

    var prov =
      c.provenance === "generated-draft" ? "generated-draft" : "authored";
    if (origin === "authored-sample" && prov === "generated-draft") {
      throw "캠퍼스 묶음: 샘플에는 초안 카드를 넣을 수 없습니다.";
    }

    if (c.role === "librarian") {
      var thesis = nonEmptyString(c.thesis, "사서 본문");
      var source = c.source;
      var sourceLine;
      if (isObject(source)) {
        sourceLine = {
          kind: "authored",
          label: nonEmptyString(source.label, "출처"),
          href: source.href == null ? null : String(source.href),
        };
      } else if (prov === "generated-draft") {
        sourceLine = {
          kind: "template-provenance",
          label: "학습 설계 템플릿 · 내 답변에서 생성",
        };
      } else {
        throw "캠퍼스 묶음: 사서 카드에 출처가 필요합니다.";
      }
      if (prov === "generated-draft") {
        sourceLine = {
          kind: "template-provenance",
          label: "학습 설계 템플릿 · 내 답변에서 생성",
        };
      }
      cards.push({
        role: "librarian",
        id: cid,
        ideaId: ideaId,
        thesis: thesis,
        source: sourceLine,
        provenance: prov,
      });
    } else if (c.role === "tutor") {
      var choices = c.choices;
      if (!Array.isArray(choices) || choices.length < 2) {
        throw "캠퍼스 묶음: 튜터 선택지가 부족합니다.";
      }
      var correctIndex = c.correctIndex;
      if (typeof correctIndex !== "number") {
        correctIndex = -1;
        for (var ti = 0; ti < choices.length; ti++) {
          if (isObject(choices[ti]) && choices[ti].isCorrect) correctIndex = ti;
        }
      }
      if (typeof correctIndex !== "number" || correctIndex < 0 || correctIndex >= choices.length) {
        throw "캠퍼스 묶음: 튜터 정답 인덱스가 잘못되었습니다.";
      }
      var normChoices = choices.map(function (ch, idx) {
        var label = typeof ch === "string" ? ch : ch.label;
        return {
          label: nonEmptyString(label, "튜터 선택지"),
          isCorrect: idx === correctIndex,
        };
      });
      var correctCount = normChoices.filter(function (x) {
        return x.isCorrect;
      }).length;
      if (correctCount !== 1) throw "캠퍼스 묶음: 튜터 정답은 하나여야 합니다.";
      cards.push({
        role: "tutor",
        id: cid,
        ideaId: ideaId,
        question: nonEmptyString(c.question, "튜터 질문"),
        choices: normChoices,
        reveal: nonEmptyString(c.reveal, "튜터 해설"),
        provenance: prov,
      });
    } else if (c.role === "editor") {
      var patches = c.patches;
      if (!Array.isArray(patches) || patches.length < 2) {
        throw "캠퍼스 묶음: 에디터 패치가 부족합니다.";
      }
      var patchCorrect = c.correctIndex;
      if (typeof patchCorrect !== "number") {
        patchCorrect = -1;
        for (var pi = 0; pi < patches.length; pi++) {
          if (isObject(patches[pi]) && patches[pi].closesHole) patchCorrect = pi;
        }
      }
      if (typeof patchCorrect !== "number" || patchCorrect < 0 || patchCorrect >= patches.length) {
        throw "캠퍼스 묶음: 에디터 정답 인덱스가 잘못되었습니다.";
      }
      var normPatches = patches.map(function (p, idx) {
        if (typeof p === "string") {
          return {
            label: nonEmptyString(p, "패치"),
            closesHole: idx === patchCorrect,
            explanation: idx === patchCorrect
              ? nonEmptyString(c.reveal || "", "에디터 해설")
              : "",
          };
        }
        return {
          label: nonEmptyString(p.label, "패치"),
          closesHole: !!p.closesHole,
          explanation: p.explanation || "",
        };
      });
      var closing = normPatches.filter(function (p) {
        return p.closesHole;
      });
      if (closing.length !== 1) throw "캠퍼스 묶음: 에디터는 닫는 패치가 하나여야 합니다.";
      if (!closing[0].explanation && c.reveal) {
        closing[0].explanation = nonEmptyString(c.reveal, "에디터 해설");
        normPatches[patchCorrect] = closing[0];
      }
      cards.push({
        role: "editor",
        id: cid,
        ideaId: ideaId,
        argument: nonEmptyString(c.thesis || c.argument, "에디터 주장"),
        holeLabel: nonEmptyString(c.holeLabel, "에디터 구멍"),
        patches: normPatches,
        provenance: prov,
      });
    } else if (c.role === "roommate") {
      cards.push({
        role: "roommate",
        id: cid,
        ideaId: ideaId,
        foreignField: nonEmptyString(c.foreignField || c.field, "룸메이트 분야"),
        analogy: nonEmptyString(c.analogy, "룸메이트 비유"),
        analogyLimit: nonEmptyString(c.analogyLimit, "룸메이트 한계"),
        provenance: prov,
      });
    } else {
      throw "캠퍼스 묶음: 알 수 없는 카드 역할입니다.";
    }
    var image = optionalImage(c);
    if (image) cards[cards.length - 1].image = image;
  }

  var listedWeekByIdea = {};
  for (var listWeek = 0; listWeek < weeks.length; listWeek++) {
    var listedWeek = weeks[listWeek];
    for (var listed = 0; listed < listedWeek.ideaIds.length; listed++) {
      var listedIdeaId = listedWeek.ideaIds[listed];
      if (listedWeekByIdea[listedIdeaId]) {
        throw "캠퍼스 묶음: 아이디어가 여러 주차에 있습니다.";
      }
      listedWeekByIdea[listedIdeaId] = listedWeek.id;
    }
  }

  for (var ideaRow = 0; ideaRow < ideas.length; ideaRow++) {
    var ideaForCards = ideas[ideaRow];
    if (listedWeekByIdea[ideaForCards.id] !== ideaForCards.weekId) {
      throw "캠퍼스 묶음: 아이디어가 주차 목록에 없습니다.";
    }
    for (var roleRow = 0; roleRow < SLOT_ROLES.length; roleRow++) {
      var roleNeeded = SLOT_ROLES[roleRow];
      var roleCount = 0;
      for (var cardRow = 0; cardRow < cards.length; cardRow++) {
        if (
          cards[cardRow].ideaId === ideaForCards.id &&
          cards[cardRow].role === roleNeeded
        ) {
          roleCount += 1;
        }
      }
      if (roleCount !== 1) {
        throw (
          "캠퍼스 묶음: 아이디어 " +
          ideaForCards.id +
          "에 " +
          roleNeeded +
          " 카드가 하나여야 합니다."
        );
      }
    }
  }

  var loop = isObject(raw.loop) ? raw.loop : ONE_MORE_LOOP;

  return {
    id: id,
    title: title,
    origin: origin,
    format: format,
    weeks: weeks,
    ideas: ideas,
    cards: cards,
    loop: loop,
  };
}

function dateKeyFromMs(now) {
  var d = new Date(now);
  var y = d.getFullYear();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  var ms = m < 10 ? "0" + m : String(m);
  var ds = day < 10 ? "0" + day : String(day);
  return y + "-" + ms + "-" + ds;
}

function nextTransitionId(state) {
  var n = parseInt(String(state.transitionId).replace(/\D/g, "") || "0", 10) + 1;
  return "t-" + n;
}

function cardsForIdea(campus, ideaId) {
  var byRole = {};
  for (var i = 0; i < campus.cards.length; i++) {
    var card = campus.cards[i];
    if (card.ideaId === ideaId) byRole[card.role] = card;
  }
  return byRole;
}

function orderedIdeaIds(campus) {
  var ids = [];
  for (var w = 0; w < campus.weeks.length; w++) {
    var week = campus.weeks[w];
    for (var j = 0; j < week.ideaIds.length; j++) {
      ids.push(week.ideaIds[j]);
    }
  }
  if (ids.length === 0) {
    for (var k = 0; k < campus.ideas.length; k++) ids.push(campus.ideas[k].id);
  }
  return ids;
}

function findCard(campus, cardId) {
  for (var i = 0; i < campus.cards.length; i++) {
    if (campus.cards[i].id === cardId) return campus.cards[i];
  }
  return null;
}

function beginEncounter(card) {
  if (card.role === "tutor") {
    return { role: "tutor", phase: "asking", cardId: card.id };
  }
  if (card.role === "editor") {
    return { role: "editor", phase: "hole", cardId: card.id };
  }
  if (card.role === "librarian") {
    return { role: "librarian", phase: "open", cardId: card.id };
  }
  if (card.role === "roommate") {
    return { role: "roommate", phase: "open", cardId: card.id };
  }
  return { role: "hub", phase: "open" };
}

function initialFeedBookmark(campus) {
  var ideaIds = orderedIdeaIds(campus);
  var firstIdea = ideaIds[0];
  var bundle = cardsForIdea(campus, firstIdea);
  var lib = bundle.librarian;
  return {
    current: beginEncounter(lib),
    slotIndex: 0,
    ideaId: firstIdea,
    completedCardIds: [],
    recentIdeaIds: [],
    hub: false,
  };
}

var DEFAULT_DAILY_GOAL = 5;

function freshProgress(now) {
  return {
    tutorMemory: {},
    dayPulse: { date: dateKeyFromMs(now), completed: 0 },
    wrongTutor: null,
    dailyGoal: DEFAULT_DAILY_GOAL,
  };
}

function createInitialState(rawCampus, now) {
  var campus = parseCampus(rawCampus);
  return {
    schema: 1,
    campus: campus,
    session: { kind: "feed", feed: initialFeedBookmark(campus) },
    progress: freshProgress(now),
    transitionId: "t-0",
    notice: null,
    authorBrief: null,
  };
}

function touchDayPulse(progress, now) {
  var key = dateKeyFromMs(now);
  if (progress.dayPulse.date !== key) {
    return {
      tutorMemory: progress.tutorMemory,
      dayPulse: { date: key, completed: 0 },
      wrongTutor: progress.wrongTutor,
      dailyGoal: typeof progress.dailyGoal === "number" ? progress.dailyGoal : DEFAULT_DAILY_GOAL,
    };
  }
  if (typeof progress.dailyGoal !== "number") {
    return Object.assign({}, progress, { dailyGoal: DEFAULT_DAILY_GOAL });
  }
  return progress;
}

function dueTutorCard(campus, progress, now) {
  var best = null;
  var mem = progress.tutorMemory;
  for (var cardId in mem) {
    if (!mem.hasOwnProperty(cardId)) continue;
    var row = mem[cardId];
    if (row.dueAt <= now) {
      var card = findCard(campus, cardId);
      if (card && card.role === "tutor") {
        if (!best || row.dueAt < best.dueAt) best = { card: card, dueAt: row.dueAt };
      }
    }
  }
  return best ? best.card : null;
}

function pickNextLearning(campus, feed, progress, now) {
  if (feed.hub) return null;

  var upcomingRole =
    feed.slotIndex < 3 ? SLOT_ROLES[feed.slotIndex + 1] : "librarian";

  var wrong = progress.wrongTutor;
  if (wrong && wrong.cardsSinceWrong >= 2 && upcomingRole === "tutor") {
    var retryCard = findCard(campus, wrong.cardId);
    if (retryCard) {
      return {
        card: retryCard,
        slotIndex: 1,
        ideaId: retryCard.ideaId,
        clearWrong: true,
      };
    }
  }

  var nextSlot = feed.slotIndex;
  var ideaId = feed.ideaId;

  if (upcomingRole === "tutor") {
    var due = dueTutorCard(campus, progress, now);
    if (due) {
      return { card: due, slotIndex: 1, ideaId: due.ideaId, clearWrong: false };
    }
  }

  if (nextSlot < 3) {
    var role = SLOT_ROLES[nextSlot + 1];
    var bundle = cardsForIdea(campus, ideaId);
    var card = bundle[role];
    if (!card) return { hub: true };
    return {
      card: card,
      slotIndex: nextSlot + 1,
      ideaId: ideaId,
      clearWrong: false,
    };
  }

  var order = orderedIdeaIds(campus);
  var idx = order.indexOf(ideaId);
  for (var i = idx + 1; i < order.length; i++) {
    var nextIdea = order[i];
    var libBundle = cardsForIdea(campus, nextIdea);
    if (libBundle.librarian) {
      return {
        card: libBundle.librarian,
        slotIndex: 0,
        ideaId: nextIdea,
        clearWrong: false,
      };
    }
  }
  return { hub: true };
}

function applyTutorSm2(prev, grade, now, transitionId) {
  if (!prev) {
    prev = { intervalDays: 0, ease: 2.5, repetitions: 0, dueAt: now };
  }
  if (grade === "again") {
    return {
      dueAt: now + 10 * 60 * 1000,
      intervalDays: 0,
      ease: Math.max(1.3, prev.ease - 0.2),
      repetitions: 0,
      lastTransitionId: transitionId,
    };
  }
  var reps = prev.repetitions + 1;
  var interval;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 3;
  else interval = Math.round(prev.intervalDays * prev.ease);
  if (interval < 1) interval = 1;
  var ease = prev.ease + 0.1;
  return {
    dueAt: now + interval * 24 * 60 * 60 * 1000,
    intervalDays: interval,
    ease: ease,
    repetitions: reps,
    lastTransitionId: transitionId,
  };
}

function canAdvance(encounter) {
  if (encounter.role === "hub" || encounter.role === "day-close") return true;
  if (encounter.role === "librarian" || encounter.role === "roommate") return true;
  if (encounter.role === "tutor") return encounter.phase === "revealed";
  if (encounter.role === "editor") return encounter.phase === "patched";
  return false;
}

function projectDayCloseView(state) {
  var goal = state.progress.dailyGoal || DEFAULT_DAILY_GOAL;
  var done = state.progress.dayPulse.completed;
  return {
    role: "day-close",
    letter: "",
    roleLabel: ROLE_LABELS.hub,
    weekLabel: null,
    pentadIndex: null,
    blocks: [
      { kind: "title", text: "오늘은 여기까지" },
      {
        kind: "body",
        text:
          "하루 " +
          goal +
          "장 중 " +
          done +
          "장을 봤습니다. 내일 같은 주제로 이어집니다.",
      },
    ],
    control: { kind: "advance", label: "확인" },
    dayCount: done,
    authorBrief: state.authorBrief,
  };
}

function actionId(prefix, idx) {
  return prefix + "-" + idx;
}

function projectCardView(state, encounter) {
  var campus = state.campus;
  if (encounter.role === "hub") {
    return {
      role: "hub",
      letter: "",
      roleLabel: ROLE_LABELS.hub,
      weekLabel: null,
      pentadIndex: null,
      blocks: [
        { kind: "title", text: "이 주제의 장을 다 봤습니다" },
        {
          kind: "body",
          text: "다른 주제로 이어가거나, 저장한 장을 다시 열 수 있습니다. 새 장은 주제를 적거나 묶음을 붙여 넣습니다.",
        },
      ],
      control: { kind: "advance", label: "주제 갤러리" },
      dayCount: state.progress.dayPulse.completed,
      authorBrief: state.authorBrief,
    };
  }

  var card = findCard(campus, encounter.cardId);
  if (!card) {
    return {
      role: "librarian",
      letter: "L",
      roleLabel: ROLE_LABELS.librarian,
      weekLabel: null,
      pentadIndex: 0,
      blocks: [{ kind: "body", text: "카드를 찾을 수 없습니다." }],
      control: { kind: "advance", label: "다음" },
      dayCount: state.progress.dayPulse.completed,
      authorBrief: state.authorBrief,
    };
  }

  var idea = null;
  for (var i = 0; i < campus.ideas.length; i++) {
    if (campus.ideas[i].id === card.ideaId) idea = campus.ideas[i];
  }
  var weekLabel = idea ? idea.title : null;
  var slotIndex =
    state.session.kind === "feed" ? state.session.feed.slotIndex : 0;
  var blocks = [];
  if (card.provenance === "generated-draft") {
    blocks.push({ kind: "badge", text: "초안" });
  }
  blocks.push({ kind: "eyebrow", text: idea ? idea.title : "" });
  if (card.image) {
    blocks.push({ kind: "image", src: card.image.src, alt: card.image.alt });
  }

  var control;

  if (card.role === "librarian") {
    blocks.push({ kind: "body", text: card.thesis });
    if (card.source.kind === "template-provenance") {
      blocks.push({ kind: "source", text: card.source.label, href: null });
    } else {
      blocks.push({
        kind: "source",
        text: card.source.label,
        href: card.source.href,
      });
    }
    control = { kind: "advance", label: "다음" };
  } else if (card.role === "tutor") {
    if (
      state.session.kind === "feed" &&
      state.session.feed.tutorSecondLook === card.id &&
      encounter.phase === "asking"
    ) {
      blocks.push({
        kind: "eyebrow",
        text: "아까 놓친 질문입니다. 한 번 더 봅니다.",
      });
    }
    if (encounter.phase === "asking") {
      blocks.push({ kind: "title", text: card.question });
      control = {
        kind: "choices",
        options: card.choices.map(function (ch, idx) {
          return { actionId: actionId("tutor", idx), label: ch.label };
        }),
      };
    } else {
      var verdict =
        encounter.verdict === "correct" ? "맞았습니다" : "다시 볼 카드로 남깁니다";
      blocks.push({
        kind: "verdict",
        tone: encounter.verdict === "correct" ? "good" : "retry",
        text: verdict,
      });
      blocks.push({ kind: "title", text: card.reveal });
      var picked = card.choices[encounter.selectedIndex];
      if (encounter.verdict !== "correct" && picked) {
        blocks.push({ kind: "body", text: picked.label });
      }
      blocks.push({ kind: "body", text: card.question });
      control = { kind: "advance", label: "다음" };
    }
  } else if (card.role === "editor") {
    if (
      state.session.kind === "feed" &&
      state.session.feed.bridgeHint &&
      encounter.phase === "hole"
    ) {
      blocks.push({
        kind: "body",
        text: state.session.feed.bridgeHint,
      });
    }
    blocks.push({ kind: "title", text: card.argument });
    blocks.push({ kind: "body", text: card.holeLabel });
    if (encounter.phase === "hole") {
      control = {
        kind: "choices",
        options: card.patches.map(function (p, idx) {
          return { actionId: actionId("editor", idx), label: p.label };
        }),
      };
    } else {
      var patch = card.patches[encounter.selectedIndex];
      blocks.push({
        kind: "verdict",
        tone: encounter.verdict === "closed" ? "good" : "retry",
        text: encounter.verdict === "closed" ? "맞았습니다" : "다시 볼게요",
      });
      if (patch && patch.explanation) {
        blocks.push({ kind: "body", text: patch.explanation });
      }
      control = { kind: "advance", label: "다음" };
    }
  } else if (card.role === "roommate") {
    blocks.push({ kind: "eyebrow", text: card.foreignField });
    blocks.push({ kind: "title", text: card.analogy });
    blocks.push({ kind: "body", text: card.analogyLimit });
    control = { kind: "advance", label: "다음" };
  }

  return {
    role: card.role,
    letter: ALTER_LETTER[card.role],
    roleLabel: ROLE_LABELS[card.role],
    weekLabel: weekLabel,
    pentadIndex: slotIndex,
    blocks: blocks,
    control: control,
    dayCount: state.progress.dayPulse.completed,
    authorBrief: state.authorBrief,
  };
}

function projectAdvisorView(state) {
  var session = state.session;
  var stage = session.stage;
  var stepByStage = { topic: 1, "finish-line": 2, baseline: 3, lens: 4 };
  var blocks = [{ kind: "eyebrow", text: (stepByStage[stage] || 1) + " / 4" }];
  var control;
  if (stage === "topic") {
    blocks.push({ kind: "title", text: "무엇을 배우고 싶나요?" });
    blocks.push({ kind: "body", text: "한 줄이면 됩니다. 이 답이 새 주제의 이름이 됩니다." });
    control = {
      kind: "text",
      actionId: actionId("adv", 0),
      label: "주제 정하기",
      placeholder: "예: 도시의 나무",
      maxLength: 80,
    };
  } else if (stage === "finish-line") {
    blocks.push({ kind: "title", text: "끝에 무엇을 만들고 싶나요?" });
    blocks.push({ kind: "body", text: "설명, 제작, 문제 풀이 중 이 주제의 끝입니다." });
    control = {
      kind: "choices",
      options: [
        { actionId: actionId("adv-fl", 0), label: "설명하기" },
        { actionId: actionId("adv-fl", 1), label: "만들기" },
        { actionId: actionId("adv-fl", 2), label: "풀기" },
      ],
    };
  } else if (stage === "baseline") {
    blocks.push({ kind: "title", text: "지금 어디쯤인가요?" });
    blocks.push({ kind: "body", text: "처음이면 용어부터, 해 본 적이 있으면 구멍부터 잡습니다." });
    control = {
      kind: "choices",
      options: [
        { actionId: actionId("adv-bl", 0), label: "처음" },
        { actionId: actionId("adv-bl", 1), label: "용어는 봤다" },
        { actionId: actionId("adv-bl", 2), label: "해 본 적 있다" },
      ],
    };
  } else if (stage === "lens" || stage === "rhythm") {
    blocks.push({ kind: "title", text: "어떤 분야로 비유할까요?" });
    blocks.push({ kind: "body", text: "네 번째 장은 이 분야의 말로 같은 내용을 다시 봅니다." });
    control = {
      kind: "choices",
      options: [
        { actionId: actionId("adv-ln", 0), label: "요리" },
        { actionId: actionId("adv-ln", 1), label: "스포츠" },
        { actionId: actionId("adv-ln", 2), label: "음악" },
        { actionId: actionId("adv-ln", 3), label: "게임" },
      ],
    };
  }

  return {
    role: "advisor",
    letter: "A",
    roleLabel: ROLE_LABELS.advisor,
    weekLabel: null,
    pentadIndex: null,
    blocks: blocks,
    control: control,
    dayCount: state.progress.dayPulse.completed,
    authorBrief: state.authorBrief,
  };
}

function schedule(state, now, intent) {
  var progress = touchDayPulse(state.progress, now);
  var working = progress === state.progress
    ? state
    : Object.assign({}, state, { progress: progress });

  if (working.session.kind === "strip") {
    return {
      kind: "strip",
      transitionId: working.transitionId,
      title: working.campus.title,
      selectedWeek: working.session.selectedWeek,
      weeks: working.campus.weeks,
      campus: working.campus,
    };
  }

  if (working.session.kind === "advisor") {
    return {
      kind: "card",
      transitionId: working.transitionId,
      view: projectAdvisorView(working),
    };
  }

  var feed = working.session.feed;
  if (feed.dayClose && feed.resumeFeed) {
    working = Object.assign({}, working, {
      session: { kind: "feed", feed: feed.resumeFeed },
    });
    feed = working.session.feed;
  }
  if (feed.hub || feed.current.role === "hub") {
    return {
      kind: "card",
      transitionId: working.transitionId,
      view: projectCardView(working, { role: "hub", phase: "open" }),
    };
  }

  return {
    kind: "card",
    transitionId: working.transitionId,
    view: projectCardView(working, feed.current),
  };
}

function finishLineLabel(v) {
  if (v === "explain") return "설명하기";
  if (v === "make") return "만들기";
  return "풀기";
}

function baselineLabel(v) {
  if (v === "new") return "처음";
  if (v === "terms") return "용어는 봤다";
  return "해 본 적 있다";
}

function lensLabel(v) {
  if (v === "cooking") return "요리";
  if (v === "sport") return "스포츠";
  if (v === "music") return "음악";
  return "게임";
}

function buildAuthorBrief(answers) {
  return [
    "주제: " + answers.topic,
    "끝 목표: " + finishLineLabel(answers.finishLine),
    "출발점: " + baselineLabel(answers.baseline),
    "비유 분야: " + lensLabel(answers.lens),
    "",
    "위 설정으로 묶음을 만드세요. format은 course, volume, series 중 주제에 맞는 것.",
    "아이디어마다 네 장: 핵심 문장, 질문, 고칠 문장, 다른 분야 비유.",
    "확인한 https 사진만 image에 넣으세요. 사실을 지어내지 마세요.",
  ].join("\n");
}

function templateCampusFromAnswers(answers) {
  var slug = answers.topic.slice(0, 12).replace(/\s+/g, "-");
  var weekTitles = [
    "지도 잡기",
    "핵심 질문",
    "대조하기",
    "적용하기",
    "비판하기",
    "가르치기",
  ];
  var weeks = [];
  for (var w = 0; w < 6; w++) {
    weeks.push({
      id: "cw" + (w + 1),
      number: w + 1,
      title: weekTitles[w],
      promise: answers.topic + " — " + weekTitles[w],
      ideaIds: w === 0 ? ["ci1", "ci2"] : [],
    });
  }

  var lens = lensLabel(answers.lens);
  var topic = answers.topic;
  var cards = [
    {
      role: "librarian",
      id: "c-lib1",
      ideaId: "ci1",
      thesis:
        "「" +
        topic +
        "」에서 먼저 기준 하나를 고른다. 무엇이 같고 무엇이 다른지 말할 수 있어야 다음 카드가 붙는다.",
      provenance: "generated-draft",
    },
    {
      role: "tutor",
      id: "c-tut1",
      ideaId: "ci1",
      question: "이 주제에서 가장 먼저 구분할 한 쌍은?",
      choices: ["용어와 사례", "원인과 결과", "규칙과 예외", "도구와 목표"],
      correctIndex: 1,
      reveal: "원인과 결과를 나누면 설명과 풀이가 같은 축을 쓴다.",
      provenance: "generated-draft",
    },
    {
      role: "editor",
      id: "c-ed1",
      ideaId: "ci1",
      thesis: "「" + topic + "」는 한 문장으로 정의할 수 있다.",
      holeLabel: "아직 근거가 없다",
      patches: ["범위를 좁혀 다시 쓴다", "예시만 늘린다", "다른 주제로 바꾼다"],
      correctIndex: 0,
      reveal: "범위를 좁히면 검증 가능한 문장이 된다.",
      provenance: "generated-draft",
    },
    {
      role: "roommate",
      id: "c-rm1",
      ideaId: "ci1",
      foreignField: lens,
      analogy: lens + "에서도 먼저 규칙을 말하고 예외를 나중에 둔다.",
      analogyLimit: "비유는 출발점이지 답이 아니다.",
      provenance: "generated-draft",
    },
    {
      role: "librarian",
      id: "c-lib2",
      ideaId: "ci2",
      thesis:
        "「" +
        topic +
        "」를 " +
        finishLineLabel(answers.finishLine) +
        " 목표에 맞춰 한 줄 메모로 적는다. 사실 대신 내가 확인할 질문을 쓴다.",
      provenance: "generated-draft",
    },
    {
      role: "tutor",
      id: "c-tut2",
      ideaId: "ci2",
      question: "오늘 확인할 질문 하나를 고른다면?",
      choices: [
        "정의가 맞는지",
        "숫자가 맞는지",
        "내가 쓸 수 있는지",
        "남이 이미 알았는지",
      ],
      correctIndex: 2,
      reveal: finishLineLabel(answers.finishLine) + "에 쓸 수 있는지가 먼저다.",
      provenance: "generated-draft",
    },
    {
      role: "editor",
      id: "c-ed2",
      ideaId: "ci2",
      thesis: "이미 다 안다고 가정해도 된다.",
      holeLabel: "출발점과 맞지 않다",
      patches: [
        "출발점에 맞는 빈칸을 적는다",
        "질문을 없앤다",
        "주제를 바꾼다",
      ],
      correctIndex: 0,
      reveal: baselineLabel(answers.baseline) + "에서 시작하는 문장이 필요하다.",
      provenance: "generated-draft",
    },
    {
      role: "roommate",
      id: "c-rm2",
      ideaId: "ci2",
      foreignField: lens,
      analogy: "하루 " + answers.rhythm + "장은 " + lens + " 연습 분량과 비슷하다.",
      analogyLimit: "분량만 맞고 내용은 직접 채워야 한다.",
      provenance: "generated-draft",
    },
  ];

  return parseCampus({
    id: "custom-" + slug,
    title: topic,
    origin: "advisor-template",
    weeks: weeks,
    ideas: [
      { id: "ci1", title: "기준 잡기", weekId: "cw1" },
      { id: "ci2", title: "목표에 맞추기", weekId: "cw1" },
    ],
    cards: cards,
  });
}

function withBump(state, patch, now) {
  var progress = touchDayPulse(state.progress, now);
  if (patch && patch.progress) {
    progress = Object.assign({}, progress, patch.progress);
  }
  return Object.assign({}, state, patch, {
    progress: progress,
    transitionId: nextTransitionId(state),
  });
}

function record(state, event, now) {
  var progress = touchDayPulse(state.progress, now);
  var base = progress === state.progress ? state : Object.assign({}, state, { progress: progress });

  if (event.kind === "import-campus") {
    try {
      var imported = parseCampus(event.raw);
      var feed = initialFeedBookmark(imported);
      return withBump(base, {
        campus: imported,
        session: { kind: "feed", feed: feed },
        notice: null,
      }, now);
    } catch (e) {
      return withBump(base, {
        notice: typeof e === "string" ? e : "묶음을 읽지 못했습니다.",
      }, now);
    }
  }

  if (event.kind === "start-advisor") {
    if (base.session.kind !== "feed") return base;
    return withBump(base, {
      session: {
        kind: "advisor",
        stage: "topic",
        answers: {},
        returnTo: base.session.feed,
      },
    }, now);
  }

  if (event.kind === "cancel-advisor") {
    if (base.session.kind !== "advisor") return base;
    return withBump(base, {
      session: { kind: "feed", feed: base.session.returnTo },
      notice: null,
    }, now);
  }

  if (event.kind === "reset-sample") {
    if (!event.raw) return base;
    var resetState = createInitialState(event.raw, now);
    resetState.transitionId = nextTransitionId(base);
    return resetState;
  }

  if (
    event.transitionId &&
    event.kind !== "import-campus" &&
    event.kind !== "start-advisor" &&
    event.kind !== "cancel-advisor" &&
    event.transitionId !== base.transitionId
  ) {
    return base;
  }

  if (event.kind === "open-idea" || event.kind === "open-card") {
    if (base.session.kind === "advisor") return base;
    var sourceFeed = base.session.kind === "strip" ? base.session.returnTo : base.session.feed;
    var targetCard = null;
    if (event.kind === "open-idea") {
      var openedBundle = cardsForIdea(base.campus, event.ideaId);
      targetCard = openedBundle.librarian || null;
    } else {
      targetCard = findCard(base.campus, event.cardId);
    }
    if (!targetCard) return base;
    var openSlot = SLOT_ROLES.indexOf(targetCard.role);
    if (openSlot < 0) openSlot = 0;
    var openedFeed = {
      current: beginEncounter(targetCard),
      slotIndex: openSlot,
      ideaId: targetCard.ideaId,
      completedCardIds: sourceFeed.completedCardIds || [],
      recentIdeaIds: sourceFeed.recentIdeaIds || [],
      hub: false,
    };
    return withBump(base, {
      session: {
        kind: "feed",
        feed: trailed(openedFeed, sourceFeed),
      },
    }, now);
  }

  if (event.kind === "open-strip") {
    if (base.session.kind !== "feed") return base;
    return withBump(base, {
      session: {
        kind: "strip",
        selectedWeek: event.week || 1,
        returnTo: base.session.feed,
      },
    }, now);
  }

  if (event.kind === "close-strip") {
    if (base.session.kind !== "strip") return base;
    return withBump(base, {
      session: { kind: "feed", feed: base.session.returnTo },
    }, now);
  }

  if (event.kind === "select-week") {
    if (base.session.kind !== "strip") return base;
    return withBump(base, {
      session: {
        kind: "strip",
        selectedWeek: event.week,
        returnTo: base.session.returnTo,
      },
    }, now);
  }

  if (base.session.kind === "advisor") {
    return recordAdvisor(base, event, now);
  }

  if (base.session.kind !== "feed") return base;

  if (event.kind === "submit-text") return base;

  var feed = base.session.feed;

  if (event.kind === "back") {
    return recordBack(base, feed, now);
  }

  if (feed.hub || feed.current.role === "hub") {
    if (event.kind === "activate") {
      var hubIdx = parseInt(String(event.actionId).split("-")[1], 10);
      if (hubIdx === 0) {
        return record(base, { kind: "start-advisor" }, now);
      }
      if (hubIdx === 1) {
        return record(base, { kind: "open-strip", week: 1 }, now);
      }
      if (hubIdx === 2 && event.raw) {
        return record(base, { kind: "reset-sample", raw: event.raw }, now);
      }
    }
    return base;
  }

  if (event.kind === "activate") {
    return recordActivate(base, feed, event, now);
  }

  if (event.kind === "advance") {
    if (!canAdvance(feed.current)) return base;
    return recordAdvance(base, feed, now);
  }

  if (event.kind === "submit-text") {
    if (base.session.kind === "advisor") return recordAdvisor(base, event, now);
  }

  return base;
}

function recordAdvisor(state, event, now) {
  var session = state.session;
  if (session.kind !== "advisor") return state;

  if (session.stage === "topic" && event.kind === "submit-text") {
    var topic = String(event.value || "").trim();
    if (!topic) return state;
    return withBump(state, {
      session: Object.assign({}, session, {
        stage: "finish-line",
        answers: { topic: topic },
      }),
    }, now);
  }

  if (event.kind !== "activate") return state;

  if (session.stage === "finish-line") {
    var flMap = ["explain", "make", "solve"];
    var flIdx = parseInt(String(event.actionId).split("-")[2], 10);
    return withBump(state, {
      session: Object.assign({}, session, {
        stage: "baseline",
        answers: Object.assign({}, session.answers, {
          finishLine: flMap[flIdx] || "explain",
        }),
      }),
    }, now);
  }

  if (session.stage === "baseline") {
    var blMap = ["new", "terms", "tried"];
    var blIdx = parseInt(String(event.actionId).split("-")[2], 10);
    return withBump(state, {
      session: Object.assign({}, session, {
        stage: "lens",
        answers: Object.assign({}, session.answers, {
          baseline: blMap[blIdx] || "new",
        }),
      }),
    }, now);
  }

  if (session.stage === "rhythm") {
    return withBump(state, {
      session: Object.assign({}, session, { stage: "lens" }),
    }, now);
  }

  if (session.stage === "lens") {
    var lnMap = ["cooking", "sport", "music", "game"];
    var lnIdx = parseInt(String(event.actionId).split("-")[2], 10);
    var answers = Object.assign({}, session.answers, {
      lens: lnMap[lnIdx] || "cooking",
    });
    var campus = templateCampusFromAnswers(answers);
    var brief = buildAuthorBrief(answers);
    var newFeed = initialFeedBookmark(campus);
    return withBump(state, {
      campus: campus,
      authorBrief: brief,
      session: { kind: "feed", feed: newFeed },
    }, now);
  }

  return state;
}

function recordActivate(state, feed, event, now) {
  var enc = feed.current;
  var card = findCard(state.campus, enc.cardId);
  if (!card) return state;

  if (card.role === "tutor" && enc.phase === "asking") {
    var idx = parseInt(String(event.actionId).split("-")[1], 10);
    var choice = card.choices[idx];
    if (!choice) return state;
    var verdict = choice.isCorrect ? "correct" : "incorrect";
    var mem = Object.assign({}, state.progress.tutorMemory);
    var grade = choice.isCorrect ? "good" : "again";
    var tid = nextTransitionId(state);
    mem[card.id] = applyTutorSm2(mem[card.id], grade, now, tid);
    var wrongTutor = state.progress.wrongTutor;
    if (!choice.isCorrect) {
      wrongTutor = { cardId: card.id, cardsSinceWrong: 0 };
    }
    var newEnc = {
      role: "tutor",
      phase: "revealed",
      cardId: card.id,
      selectedIndex: idx,
      verdict: verdict,
    };
    return withBump(state, {
      progress: Object.assign({}, state.progress, {
        tutorMemory: mem,
        wrongTutor: wrongTutor,
      }),
      session: {
        kind: "feed",
        feed: Object.assign({}, feed, { current: newEnc }),
      },
    }, now);
  }

  if (card.role === "tutor" && enc.phase === "revealed") {
    return state;
  }

  if (card.role === "editor" && enc.phase === "hole") {
    var eidx = parseInt(String(event.actionId).split("-")[1], 10);
    var patch = card.patches[eidx];
    if (!patch) return state;
    var everdict = patch.closesHole ? "closed" : "still-open";
    var newEncE = {
      role: "editor",
      phase: "patched",
      cardId: card.id,
      selectedIndex: eidx,
      verdict: everdict,
    };
    return withBump(state, {
      session: {
        kind: "feed",
        feed: Object.assign({}, feed, { current: newEncE }),
      },
    }, now);
  }

  if (card.role === "editor" && enc.phase === "patched") {
    return state;
  }

  return state;
}

function trailed(nextFeed, fromFeed) {
  var trail = (fromFeed.trail || []).slice();
  if (fromFeed.current && fromFeed.current.cardId) {
    trail.push({
      cardId: fromFeed.current.cardId,
      slotIndex: fromFeed.slotIndex,
      ideaId: fromFeed.ideaId,
    });
  }
  if (trail.length > 40) trail = trail.slice(trail.length - 40);
  return Object.assign({}, nextFeed, { trail: trail });
}

function recordBack(state, feed, now) {
  var trail = feed.trail || [];
  if (trail.length === 0) return state;
  var prev = trail[trail.length - 1];
  var card = findCard(state.campus, prev.cardId);
  if (!card) return state;
  return withBump(state, {
    session: {
      kind: "feed",
      feed: {
        current: beginEncounter(card),
        slotIndex: prev.slotIndex,
        ideaId: prev.ideaId,
        completedCardIds: feed.completedCardIds,
        recentIdeaIds: feed.recentIdeaIds,
        hub: false,
        trail: trail.slice(0, -1),
      },
    },
  }, now);
}

function finishAdvance(state, progress, feed, completed, recent, resumeFeed, now) {
  return withBump(state, {
    progress: progress,
    session: { kind: "feed", feed: resumeFeed },
  }, now);
}

function recordAdvance(state, feed, now) {
  var enc = feed.current;
  if (enc.role === "hub") return state;
  if (enc.role === "day-close") return state;

  var card = findCard(state.campus, enc.cardId);
  var seen = feed.completedCardIds.indexOf(enc.cardId) >= 0;
  var completed = seen ? feed.completedCardIds.slice() : feed.completedCardIds.concat([enc.cardId]);
  var recent = seen ? feed.recentIdeaIds.slice() : feed.recentIdeaIds.concat([feed.ideaId]);
  if (recent.length > 3) recent = recent.slice(recent.length - 3);

  var progress = Object.assign({}, state.progress, {
    dayPulse: {
      date: state.progress.dayPulse.date,
      completed: seen
        ? state.progress.dayPulse.completed
        : state.progress.dayPulse.completed + 1,
    },
  });

  if (progress.wrongTutor && !seen) {
    progress.wrongTutor = {
      cardId: progress.wrongTutor.cardId,
      cardsSinceWrong: progress.wrongTutor.cardsSinceWrong + 1,
    };
  }

  var nextPick = pickNextLearning(state.campus, feed, progress, now);
  if (nextPick && nextPick.hub) {
    var hubFeed = {
      current: { role: "hub", phase: "open" },
      slotIndex: 0,
      ideaId: feed.ideaId,
      completedCardIds: completed,
      recentIdeaIds: recent,
      hub: true,
    };
    return finishAdvance(state, progress, feed, completed, recent, trailed(hubFeed, feed), now);
  }

  if (!nextPick || !nextPick.card) {
    var emptyHubFeed = {
      current: { role: "hub", phase: "open" },
      slotIndex: 0,
      ideaId: feed.ideaId,
      completedCardIds: completed,
      recentIdeaIds: recent,
      hub: true,
    };
    return finishAdvance(state, progress, feed, completed, recent, trailed(emptyHubFeed, feed), now);
  }

  if (nextPick.clearWrong) {
    progress.wrongTutor = null;
  }

  var bridgeHint = null;
  if (
    nextPick.card &&
    nextPick.card.role === "editor" &&
    enc.role === "tutor" &&
    enc.phase === "revealed" &&
    card &&
    card.reveal
  ) {
    bridgeHint = card.reveal;
  }

  var nextFeed = {
    current: beginEncounter(nextPick.card),
    slotIndex: nextPick.slotIndex,
    ideaId: nextPick.ideaId,
    completedCardIds: completed,
    recentIdeaIds: recent,
    hub: false,
    tutorSecondLook: nextPick.clearWrong ? nextPick.card.id : null,
    bridgeHint: bridgeHint,
  };

  return finishAdvance(state, progress, feed, completed, recent, trailed(nextFeed, feed), now);
}

function dumpState(state) {
  return JSON.stringify(state);
}

function parseState(json, fallbackCampus, now) {
  if (typeof now !== "number") now = Date.now();
  var fallback = createInitialState(fallbackCampus, now);
  if (!json) return { state: fallback, recovered: true };
  try {
    var raw = typeof json === "string" ? JSON.parse(json) : json;
    if (!isObject(raw) || raw.schema !== 1) {
      return {
        state: Object.assign({}, fallback, {
          notice: "저장된 상태를 읽지 못해 샘플로 시작합니다.",
        }),
        recovered: true,
      };
    }
    var campus = parseCampus(raw.campus || fallbackCampus);
    var loadedProgress = raw.progress || freshProgress(now);
    if (typeof loadedProgress.dailyGoal !== "number") {
      loadedProgress = Object.assign({}, loadedProgress, {
        dailyGoal: DEFAULT_DAILY_GOAL,
      });
    }
    return {
      state: {
        schema: 1,
        campus: campus,
        session: raw.session,
        progress: loadedProgress,
        transitionId: raw.transitionId || "t-0",
        notice: raw.notice || null,
        authorBrief: raw.authorBrief || null,
      },
      recovered: false,
    };
  } catch (e) {
    return {
      state: Object.assign({}, fallback, {
        notice: "저장된 상태를 읽지 못해 샘플로 시작합니다.",
      }),
      recovered: true,
    };
  }
}


export {
  parseCampus,
  createInitialState,
  schedule,
  record,
  dumpState,
  parseState,
};
