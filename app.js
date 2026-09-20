/* global BoxCampus, BOX_CAMPUS_SAMPLE */
(function () {
  "use strict";

  var STORAGE_KEY = "box-campus-v1";

  function boot(options) {
    var root = options.root;
    var sample = options.sample;
    var storage = options.storage || defaultStorage();
    var clock = options.clock || { now: function () { return Date.now(); } };

    var state;
    var parsed = BoxCampus.parseState(storage.read(), sample, clock.now());
    state = parsed.state;
    var library = loadLibrary();
    remember();

    var noticeEl = document.createElement("div");
    noticeEl.className = "notice";
    noticeEl.hidden = true;
    root.appendChild(noticeEl);

    var briefBar = document.createElement("div");
    briefBar.className = "brief-bar";
    briefBar.hidden = true;
    root.appendChild(briefBar);

    var main = document.createElement("div");
    main.id = "stage";
    root.appendChild(main);

    var importToggle = document.createElement("button");
    importToggle.className = "panel-toggle";
    importToggle.type = "button";
    importToggle.hidden = true;
    root.appendChild(importToggle);

    var importPanel = document.createElement("div");
    importPanel.className = "import-panel";
    importPanel.innerHTML =
      '<div class="import-panel-inner">' +
      '<p>Cursor나 Grok이 만든 묶음을 붙여 넣으세요.</p>' +
      '<textarea id="import-area" spellcheck="false"></textarea>' +
      '<div class="row">' +
      '<button type="button" class="primary-btn" id="import-btn">묶음 붙이기</button>' +
      '<button type="button" id="import-close">닫기</button>' +
      "</div></div>";
    root.appendChild(importPanel);

    var accountSheet = document.createElement("div");
    accountSheet.className = "import-panel";
    root.appendChild(accountSheet);

    function fillAccounts() {
      accountSheet.innerHTML = "";
      var inner = document.createElement("div");
      inner.className = "import-panel-inner";
      var heading = document.createElement("p");
      heading.textContent = "따라가는 주제";
      inner.appendChild(heading);
      for (var i = 0; i < library.order.length; i++) {
        var id = library.order[i];
        var row = document.createElement("button");
        row.type = "button";
        row.className = "account-row" + (id === state.campus.id ? " on" : "");
        var name = id;
        try {
          var dumped = JSON.parse(library.shelves[id]);
          if (dumped.campus && dumped.campus.title) name = dumped.campus.title;
        } catch (err) {}
        row.textContent = name;
        row.addEventListener("click", function (accountId) {
          return function () {
            accountSheet.classList.remove("open");
            if (accountId !== state.campus.id) openAccount(accountId);
          };
        }(id));
        inner.appendChild(row);
      }
      var add = document.createElement("button");
      add.type = "button";
      add.className = "primary-btn";
      add.textContent = "주제 추가";
      add.addEventListener("click", function () {
        accountSheet.classList.remove("open");
        importPanel.classList.add("open");
      });
      var close = document.createElement("button");
      close.type = "button";
      close.textContent = "닫기";
      close.addEventListener("click", function () {
        accountSheet.classList.remove("open");
      });
      inner.appendChild(add);
      inner.appendChild(close);
      accountSheet.appendChild(inner);
    }

    importToggle.addEventListener("click", function () {
      importPanel.classList.add("open");
    });
    importPanel.querySelector("#import-close").addEventListener("click", function () {
      importPanel.classList.remove("open");
    });
    importPanel.querySelector("#import-btn").addEventListener("click", function () {
      var text = importPanel.querySelector("#import-area").value;
      var raw;
      try {
        raw = JSON.parse(text);
      } catch (e) {
        dispatch({ kind: "import-campus", raw: { invalid: true }, transitionId: state.transitionId });
        return;
      }
      dispatch({
        kind: "import-campus",
        raw: raw,
        transitionId: state.transitionId,
      });
      importPanel.classList.remove("open");
    });

    var touchStartY = 0;
    root.addEventListener(
      "touchstart",
      function (e) {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        touchStartY = e.changedTouches[0].clientY;
      },
      { passive: true }
    );
    root.addEventListener("touchend", function (e) {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      var dy = touchStartY - e.changedTouches[0].clientY;
      if (dy > 48) onAdvance();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") onAdvance();
    });
    var wheelLock = false;
    root.addEventListener(
      "wheel",
      function (e) {
        if (wheelLock || e.deltaY < 48) return;
        wheelLock = true;
        onAdvance();
        setTimeout(function () {
          wheelLock = false;
        }, 450);
      },
      { passive: true }
    );

    function loadLibrary() {
      try {
        var raw = localStorage.getItem("box-campus-library-v1");
        var data = raw ? JSON.parse(raw) : null;
        if (!data || !data.shelves) return { order: [], shelves: {}, saved: [] };
        data.order = data.order || [];
        data.saved = data.saved || [];
        return data;
      } catch (e) {
        return { order: [], shelves: {}, saved: [] };
      }
    }

    function writeLibrary() {
      try {
        localStorage.setItem("box-campus-library-v1", JSON.stringify(library));
      } catch (e2) {}
    }

    function remember() {
      var id = state.campus && state.campus.id;
      if (!id) return;
      library.shelves[id] = BoxCampus.dumpState(state);
      if (library.order.indexOf(id) < 0) library.order.push(id);
      writeLibrary();
    }

    function feedIdea() {
      if (!state.session || state.session.kind !== "feed" || !state.session.feed) return "";
      return state.session.feed.ideaId || "";
    }

    function cardIdNow() {
      if (!state.session || state.session.kind !== "feed" || !state.session.feed) return "";
      var current = state.session.feed.current;
      return current && current.cardId ? current.cardId : "";
    }

    function openAccount(id) {
      var raw = library.shelves[id];
      if (!raw) return;
      var next = BoxCampus.parseState(raw, sample, clock.now());
      state = next.state;
      persist();
      render();
    }

    function handleOf(title) {
      var compact = String(title || "").replace(/\s+/g, "");
      if (compact.length > 18) compact = compact.slice(0, 18);
      return compact;
    }

    function persist() {
      storage.write(BoxCampus.dumpState(state));
    }

    function dispatch(event) {
      state = BoxCampus.record(state, event, clock.now());
      persist();
      remember();
      render();
    }

    function onAdvance() {
      var beforeId = state.campus.id;
      var beforeIdea = feedIdea();
      var frame = BoxCampus.schedule(state, clock.now(), { kind: "resume" });
      if (frame.kind !== "card") return;
      var control = frame.view.control;
      if (control.kind !== "advance") return;
      dispatch({ kind: "advance", transitionId: frame.transitionId });
      if (library.order.length < 2) return;
      if (feedIdea() === beforeIdea) return;
      var idx = library.order.indexOf(beforeId);
      var nextId = library.order[(idx + 1) % library.order.length];
      if (nextId && nextId !== state.campus.id) openAccount(nextId);
    }

    function renderBlock(el, block) {
      if (block.kind === "eyebrow") {
        var e = document.createElement("div");
        e.className = "eyebrow";
        e.textContent = block.text;
        el.appendChild(e);
      } else if (block.kind === "title") {
        var t = document.createElement("div");
        t.className = "title";
        t.textContent = block.text;
        el.appendChild(t);
      } else if (block.kind === "body") {
        var b = document.createElement("div");
        b.className = "body";
        b.textContent = block.text;
        el.appendChild(b);
      } else if (block.kind === "source") {
        var s = document.createElement("div");
        s.className = "source";
        s.textContent = block.text;
        el.appendChild(s);
      } else if (block.kind === "badge") {
        var g = document.createElement("div");
        g.className = "badge";
        g.textContent = block.text;
        el.appendChild(g);
      } else if (block.kind === "verdict") {
        var v = document.createElement("div");
        v.className = "verdict " + block.tone;
        v.textContent = block.text;
        el.appendChild(v);
      }
    }

    function renderCard(frame) {
      var view = frame.view;
      main.innerHTML = "";

      var stage = document.createElement("div");
      stage.className = "card-stage";
      if (view.control.kind === "advance") {
        stage.addEventListener("click", onAdvance);
      }
      var body = document.createElement("div");
      body.className = "card-body";
      for (var i = 0; i < view.blocks.length; i++) {
        renderBlock(body, view.blocks[i]);
      }
      stage.appendChild(body);
      main.appendChild(stage);

      var caption = document.createElement("div");
      caption.className = "caption";
      var account = document.createElement("div");
      account.className = "account-line";
      account.textContent = handleOf(state.campus.title);
      caption.appendChild(account);
      var capCount = document.createElement("div");
      capCount.className = "cap-count";
      capCount.textContent = "오늘 " + view.dayCount + "장";
      caption.appendChild(capCount);
      main.appendChild(caption);

      var rail = document.createElement("div");
      rail.className = "rail";
      var avatar = document.createElement("button");
      avatar.type = "button";
      avatar.className = "avatar";
      avatar.textContent = handleOf(state.campus.title).slice(0, 1);
      avatar.addEventListener("click", function (ev) {
        ev.stopPropagation();
        fillAccounts();
        accountSheet.classList.add("open");
      });
      var keep = document.createElement("button");
      keep.type = "button";
      keep.className = "mark";
      var savedId = cardIdNow();
      var kept = savedId && library.saved.indexOf(savedId) >= 0;
      keep.textContent = kept ? "저장됨" : "저장";
      keep.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (!savedId) return;
        var at = library.saved.indexOf(savedId);
        if (at >= 0) library.saved.splice(at, 1);
        else library.saved.push(savedId);
        writeLibrary();
        render();
      });
      rail.appendChild(avatar);
      rail.appendChild(keep);
      main.appendChild(rail);

      var thumb = document.createElement("div");
      thumb.className = "thumb-zone";

      var control = view.control;
      if (control.kind === "choices") {
        var grid = document.createElement("div");
        grid.className = "choice-grid";
        for (var c = 0; c < control.options.length; c++) {
          var opt = control.options[c];
          var ob = document.createElement("button");
          ob.type = "button";
          ob.textContent = opt.label;
          ob.addEventListener("click", function (actionId) {
            return function () {
              var hubRaw = null;
              if (String(actionId).indexOf("hub-2") >= 0) hubRaw = sample;
              dispatch({
                kind: "activate",
                transitionId: frame.transitionId,
                actionId: actionId,
                raw: hubRaw,
              });
            };
          }(opt.actionId));
          grid.appendChild(ob);
        }
        thumb.appendChild(grid);
      } else if (control.kind === "text") {
        var wrap = document.createElement("div");
        wrap.className = "text-step";
        var input = document.createElement("input");
        input.type = "text";
        input.maxLength = control.maxLength;
        input.placeholder = control.placeholder;
        var submit = document.createElement("button");
        submit.type = "button";
        submit.className = "primary-btn";
        submit.textContent = control.label;
        submit.addEventListener("click", function () {
          dispatch({
            kind: "submit-text",
            transitionId: frame.transitionId,
            actionId: control.actionId,
            value: input.value,
          });
        });
        wrap.appendChild(input);
        wrap.appendChild(submit);
        thumb.appendChild(wrap);
      }

      main.appendChild(thumb);
    }

    function renderStrip(frame) {
      main.innerHTML = "";
      var wrap = document.createElement("div");
      wrap.className = "strip-view";
      var h = document.createElement("h1");
      h.textContent = frame.title + " · 주 보기";
      wrap.appendChild(h);

      for (var w = 0; w < frame.weeks.length; w++) {
        var week = frame.weeks[w];
        var row = document.createElement("div");
        row.className = "week-row" + (week.ideaIds.length === 0 ? " locked" : "");
        var wh = document.createElement("h2");
        wh.textContent = week.number + "주 · " + week.title;
        row.appendChild(wh);
        var pr = document.createElement("p");
        pr.textContent = week.promise;
        row.appendChild(pr);
        if (week.ideaIds.length === 0) {
          var em = document.createElement("div");
          em.className = "empty";
          em.textContent = "아직 카드가 없다";
          row.appendChild(em);
        }
        wrap.appendChild(row);
      }

      var back = document.createElement("button");
      back.type = "button";
      back.className = "primary-btn";
      back.textContent = "카드로 돌아가기";
      back.style.marginTop = "1rem";
      back.addEventListener("click", function () {
        dispatch({ kind: "close-strip", transitionId: frame.transitionId });
      });
      wrap.appendChild(back);
      main.appendChild(wrap);
    }

    function render() {
      if (state.notice) {
        noticeEl.hidden = false;
        noticeEl.textContent = state.notice;
      } else {
        noticeEl.hidden = true;
      }

      if (state.authorBrief) {
        briefBar.hidden = false;
        briefBar.innerHTML = "";
        var span = document.createElement("span");
        span.textContent = "작성용 브리프가 준비되었습니다";
        var copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.textContent = "브리프 복사";
        copyBtn.addEventListener("click", function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(state.authorBrief);
          }
        });
        briefBar.appendChild(span);
        briefBar.appendChild(copyBtn);
      } else {
        briefBar.hidden = true;
      }

      var frame = BoxCampus.schedule(state, clock.now(), { kind: "resume" });
      if (frame.kind === "strip") {
        renderStrip(frame);
      } else {
        renderCard(frame);
      }
    }

    render();

    return {
      stop: function () {},
      getState: function () { return state; },
      dispatch: dispatch,
    };
  }

  function defaultStorage() {
    return {
      read: function () {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      },
      write: function (serialized) {
        localStorage.setItem(STORAGE_KEY, serialized);
      },
    };
  }

  window.bootBoxCampus = boot;
})();
