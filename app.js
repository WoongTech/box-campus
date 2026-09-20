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
    importToggle.textContent = "넣기";
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
        touchStartY = e.changedTouches[0].clientY;
      },
      { passive: true }
    );
    root.addEventListener("touchend", function (e) {
      var dy = touchStartY - e.changedTouches[0].clientY;
      if (dy > 60) onAdvance();
    });

    function persist() {
      storage.write(BoxCampus.dumpState(state));
    }

    function dispatch(event) {
      state = BoxCampus.record(state, event, clock.now());
      persist();
      render();
    }

    function onAdvance() {
      var frame = BoxCampus.schedule(state, clock.now(), { kind: "resume" });
      if (frame.kind !== "card") return;
      var control = frame.view.control;
      if (control.kind !== "advance") return;
      dispatch({ kind: "advance", transitionId: frame.transitionId });
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

      var top = document.createElement("div");
      top.className = "top-bar";
      top.innerHTML =
        "<span>" +
        state.campus.title +
        "</span><span>오늘 " +
        view.dayCount +
        "장</span>";
      main.appendChild(top);

      var stage = document.createElement("div");
      stage.className = "card-stage";
      var body = document.createElement("div");
      body.className = "card-body";
      for (var i = 0; i < view.blocks.length; i++) {
        renderBlock(body, view.blocks[i]);
      }
      stage.appendChild(body);
      main.appendChild(stage);

      var thumb = document.createElement("div");
      thumb.className = "thumb-zone";

      var control = view.control;
      if (control.kind === "advance") {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "primary-btn";
        btn.textContent = control.label;
        btn.addEventListener("click", onAdvance);
        thumb.appendChild(btn);
      } else if (control.kind === "choices") {
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
