/* ============================================================
   host.js — 遊戲外框：準備畫面 / 計時 / 計分 / 結果畫面 / 資源回收
   所有遊戲共用同一套生命週期，避免每款遊戲各自漏清計時器。
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;
  var ui = CSE.ui, el = ui.el;

  var current = null;      /* 目前執行中的 instance */

  var Host = {
    busy: false,           /* true = 正在遊戲中（閒置重置不會打斷） */

    stop: function () {
      if (current) { current._destroy(); current = null; }
      this.busy = false;
    },

    start: function (def, mountEl) {
      this.stop();
      current = createInstance(def, mountEl);
      return current;
    }
  };

  function createInstance(def, mountEl) {
    /* ---------- 狀態 ---------- */
    var S = {
      score: 0,
      left: def.duration || 0,
      running: false,
      ended: false,
      cleanups: [],
      rafId: 0,
      extra: null
    };

    /* ---------- 外框 DOM ---------- */
    var scoreB = el('b', { text: '0' });
    var timeB = el('b', { text: def.duration ? String(def.duration) : '—' });
    var timeBox = el('div', { class: 'statbox time' }, [el('span', { text: '時間' }), timeB]);
    var scoreBox = el('div', { class: 'statbox score' }, [el('span', { text: '分數' }), scoreB]);
    var extraSpan = el('span', { text: '' });
    var extraB = el('b', { text: '' });
    var extraBox = el('div', { class: 'statbox hidden' }, [extraSpan, extraB]);

    var stage = el('div', { class: 'gf-stage' });
    var hint = el('div', { class: 'gf-hint' });
    var body = el('div', { style: { flex: '1', display: 'flex', flexDirection: 'column', minHeight: '0' } });
    stage.appendChild(hint);
    stage.appendChild(body);

    var btnRestart = el('button', { type: 'button', class: 'btn btn--sm', text: '重來' });
    var btnHow = el('button', { type: 'button', class: 'btn btn--sm', text: '玩法' });
    var btnHome = el('button', { type: 'button', class: 'btn btn--sm', text: '離開' });

    var frame = el('div', { class: 'gframe' }, [
      el('div', { class: 'gf-top' }, [
        el('div', { class: 'gf-id' }, [
          el('b', { text: def.name }),
          el('span', { text: def.tag || '' })
        ]),
        el('div', { class: 'gf-stats' }, [timeBox, scoreBox, extraBox]),
        el('div', { class: 'gf-actions' }, [btnRestart, btnHow, btnHome])
      ]),
      stage
    ]);

    frame.style.setProperty('--accent', def.accent || 'var(--green)');
    if (!def.duration) timeBox.classList.add('hidden');

    ui.clear(mountEl);
    mountEl.appendChild(frame);

    btnHow.addEventListener('click', function () {
      CSE.sfx.play('click');
      CSE.modal({
        title: '玩法：' + def.name,
        accent: def.accent,
        body: [
          el('ol', { class: 'howto' }, (def.how || []).map(function (t) { return el('li', { text: t }); })),
          def.controls ? el('p', { class: 'faint', style: { fontSize: '12.5px' }, text: '操作：' + def.controls }) : null
        ]
      });
    });
    btnRestart.addEventListener('click', function () {
      CSE.sfx.play('click');
      begin();
    });
    btnHome.addEventListener('click', function () {
      CSE.sfx.play('click');
      location.hash = '#/';
    });

    /* ---------- 給遊戲用的 API ---------- */
    var api = {
      def: def,
      stage: body,
      el: el,
      svg: ui.svg,
      sfx: CSE.sfx,
      util: CSE.util,

      get score() { return S.score; },

      setScore: function (n) {
        S.score = Math.max(0, Math.round(n));
        scoreB.textContent = CSE.util.nf(S.score);
        return S.score;
      },
      addScore: function (n) { return api.setScore(S.score + n); },

      hint: function (text, kind) {
        hint.textContent = text || '';
        hint.className = 'gf-hint' + (kind ? ' ' + kind : '');
      },

      /* 第三個計分欄（連擊、關卡、剩餘生命…） */
      setStat: function (label, value) {
        if (label === null) { extraBox.classList.add('hidden'); return; }
        extraBox.classList.remove('hidden');
        extraSpan.textContent = label;
        extraB.textContent = String(value);
      },

      timeLeft: function () { return S.left; },
      addTime: function (sec) {
        S.left = Math.max(0, S.left + sec);
        paintTime();
      },

      /* 自動清理的事件監聽 */
      on: function (target, type, fn, opts) {
        target.addEventListener(type, fn, opts);
        S.cleanups.push(function () { target.removeEventListener(type, fn, opts); });
      },
      after: function (ms, fn) {
        var id = setTimeout(function () { if (!S.ended) fn(); }, ms);
        S.cleanups.push(function () { clearTimeout(id); });
        return id;
      },
      every: function (ms, fn) {
        var id = setInterval(function () { if (!S.ended) fn(); }, ms);
        S.cleanups.push(function () { clearInterval(id); });
        return id;
      },
      onDestroy: function (fn) { S.cleanups.push(fn); },

      /* 註冊「結算資料提供者」：時間到時 host 會呼叫它拿 stats / knowledge。
         這樣遊戲不必自己攔截時間到的時機。 */
      onResult: function (fn) { S.resultFn = fn; },

      restart: function () { begin(); },

      /* 結束一局 */
      finish: function (result) { endGame(result || {}); }
    };

    /* ---------- 計時 ----------
       用「真實時鐘」而不是 requestAnimationFrame 的幀差。

       原因：視窗被別的程式蓋住、最小化、或系統省電時，
       瀏覽器可能完全不產生畫面，rAF 一幀都不跑，
       但 document.hidden 仍然是 false（頁面自認看得見）。
       如果計時靠 rAF，這種情況下時鐘會停住、整局永遠不會結束。

       所以倒數改由 setInterval + Date.now() 推動；
       rAF 只留給動畫（api 的 onFrame），停了也只是畫面不動而已。

       切到別的分頁要暫停是刻意保留的行為，
       但改成明確監聽 visibilitychange，而不是依賴 rAF 的副作用。 ---------- */
    var TICK_MS = 200;

    function paintTime() {
      if (!def.duration) return;
      var s = Math.ceil(S.left);
      timeB.textContent = String(s);
      timeBox.classList.toggle('warn', s <= 10 && S.running);
    }

    /* 真實時鐘推動的倒數 + 給遊戲用的 onTick */
    function clockTick() {
      if (S.ended || !S.running) return;
      var now = Date.now();
      var dt = (now - S.lastTick) / 1000;
      S.lastTick = now;
      if (dt <= 0) return;
      dt = Math.min(dt, 1.0);            /* 卡頓時一次最多算 1 秒，不要瞬間扣光 */

      if (def.duration) {
        var before = Math.ceil(S.left);
        S.left -= dt;
        if (S.left <= 0) {
          S.left = 0;
          paintTime();
          endGame({ reason: 'timeout' });
          return;
        }
        var after = Math.ceil(S.left);
        if (after !== before) {
          paintTime();
          if (after <= 5) CSE.sfx.play('tick');
        }
      }
      if (S.tickFn) {
        try { S.tickFn(dt); } catch (e) { console.error('[CSE] onTick 失敗', e); }
      }
    }

    /* 切走 / 切回：暫停與續跑 */
    function onVisibility() {
      if (document.hidden) {
        S.paused = true;
      } else if (S.paused) {
        S.paused = false;
        S.lastTick = Date.now();         /* 丟掉離開期間的時間 */
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    /* rAF 只負責動畫，跑不動也不影響遊戲進行 */
    function frameLoop() {
      if (S.ended || !S.running) return;
      S.rafId = requestAnimationFrame(frameLoop);
      if (!S.onFrame || S.paused) return;
      var now = Date.now();
      var dt = Math.min(0.1, (now - S.lastFrame) / 1000);
      S.lastFrame = now;
      if (dt > 0) S.onFrame(dt);
    }

    /* ---------- 準備畫面 ---------- */
    var readyOverlay = null;

    function showReady() {
      Host.busy = false;
      S.running = false;
      S.ended = false;
      var best = CSE.scores.best(def.id);
      readyOverlay = el('div', { class: 'overlay' }, [
        el('div', { class: 'kicker', text: def.tag || 'MINI GAME' }),
        el('h2', { text: def.name }),
        el('p', { class: 'muted', style: { maxWidth: '46ch' }, text: def.blurb }),
        el('ol', { class: 'howto' }, (def.how || []).map(function (t) { return el('li', { text: t }); })),
        def.controls ? el('p', { class: 'faint', style: { fontSize: '12.5px' }, text: '操作：' + def.controls }) : null,
        el('div', { class: 'row', style: { justifyContent: 'center' } }, [
          el('button', {
            type: 'button', class: 'btn btn--primary btn--lg', text: '開始遊戲',
            onclick: function () { CSE.sfx.unlock(); CSE.sfx.play('ok'); begin(); }
          })
        ]),
        el('div', { class: 'faint', style: { fontSize: '12px' } },
          def.duration ? ('一局 ' + def.duration + ' 秒' + (best ? '　·　你的最佳：' + CSE.util.nf(best) + ' 分' : ''))
            : (best ? '你的最佳：' + CSE.util.nf(best) + ' 分' : ''))
      ]);
      stage.appendChild(readyOverlay);
    }

    /* ---------- 開始一局 ---------- */
    function begin() {
      runCleanups();
      S.score = 0; S.left = def.duration || 0;
      S.ended = false; S.running = true; S.onFrame = null;
      S.resultFn = null; S.tickFn = null; S.paused = document.hidden;
      api.setScore(0);
      api.setStat(null);
      api.hint('');
      paintTime();
      ui.clear(body);
      body.removeAttribute('inert');
      removeOverlays();
      Host.busy = true;

      var r;
      try {
        r = def.mount(body, api);
      } catch (e) {
        console.error('[CSE] ' + def.id + ' 啟動失敗', e);
        api.hint('這款遊戲載入失敗了，請按「重來」或回首頁。', 'bad');
        Host.busy = false;
        return;
      }
      if (r && typeof r.onFrame === 'function') S.onFrame = r.onFrame;
      if (r && typeof r.onTick === 'function') S.tickFn = r.onTick;
      if (r && typeof r.destroy === 'function') S.cleanups.push(r.destroy);

      S.lastTick = S.lastFrame = Date.now();
      clearInterval(S.tickId);
      S.tickId = setInterval(function () { if (!S.paused) clockTick(); }, TICK_MS);
      cancelAnimationFrame(S.rafId);
      S.rafId = requestAnimationFrame(frameLoop);
    }

    /* ---------- 結束一局 ---------- */
    function endGame(result) {
      if (S.ended) return;
      S.ended = true;
      S.running = false;
      Host.busy = false;
      cancelAnimationFrame(S.rafId);
      clearInterval(S.tickId);

      /* 結果畫面蓋上後，底下的遊戲元件不能再被點擊或用 Tab 聚焦 */
      try { body.setAttribute('inert', ''); } catch (e) { /* ignore */ }

      /* 讓遊戲補上自己的結算統計 */
      if (S.resultFn) {
        try {
          var extra = S.resultFn() || {};
          if (!result.stats && extra.stats) result.stats = extra.stats;
          if (!result.knowledge && extra.knowledge) result.knowledge = extra.knowledge;
        } catch (e) { console.warn('[CSE] onResult 失敗', e); }
      }

      var score = S.score;
      var prevBest = CSE.scores.best(def.id);
      CSE.scores.recordResult(def.id, score);
      var isPB = score > prevBest && score > 0;

      CSE.sfx.play(score >= def.medals.silver ? 'win' : 'over');
      if (typeof Host.onFinish === 'function') Host.onFinish(def.id, score);

      showResult(score, prevBest, isPB, result);
    }

    function showResult(score, prevBest, isPB, result) {
      var medal = CSE.scores.medalOf(def.id, score);
      var title = CSE.scores.rankTitle(def.id, score);
      var stats = result.stats || [];
      var know = result.knowledge || def.knowledge;

      var nameInput = el('input', {
        type: 'text', maxlength: String(CSE.scores.nameMax),
        placeholder: '暱稱（最多 ' + CSE.scores.nameMax + ' 字）',
        value: CSE.scores.lastName(),
        autocomplete: 'off', spellcheck: 'false'
      });
      var submitRow = el('div', { class: 'namebox' });
      var submitMsg = el('div', { class: 'faint', style: { fontSize: '12px', minHeight: '1.4em' } });

      function doSubmit() {
        var res = CSE.scores.submit(def.id, nameInput.value, score,
          stats.map(function (s) { return s.k + '=' + s.v; }).join('; '));
        if (!res.ok) {
          submitMsg.textContent = '請輸入 1–' + CSE.scores.nameMax + ' 個字的暱稱（避免不雅字）';
          submitMsg.className = 'bad';
          nameInput.focus();
          return;
        }
        CSE.sfx.play('great');
        ui.clear(submitRow);
        submitRow.appendChild(el('div', { class: 'tag', text: '已登錄排行榜　第 ' + res.rank + ' 名' }));
        submitRow.appendChild(el('a', { class: 'btn btn--sm', href: '#/board?g=' + def.id, text: '看排行榜' }));
        submitMsg.textContent = '';
      }

      var btnSubmit = el('button', { type: 'button', class: 'btn btn--primary', text: '登錄排行榜', onclick: doSubmit });
      submitRow.appendChild(nameInput);
      submitRow.appendChild(btnSubmit);
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); doSubmit(); }
      });

      var others = CSE.games.filter(function (g) { return g.id !== def.id; });
      var next = others.length ? CSE.util.pick(others) : null;

      var ov = el('div', { class: 'overlay' }, [
        el('div', { class: 'kicker', text: result.reason === 'cleared' ? '全部通關' : '時間到' }),
        el('div', { class: 'bigscore', text: CSE.util.nf(score) }),
        el('div', { class: 'rank-title', text: (medal ? CSE.scores.medalIcon(medal) + ' ' : '') + title }),
        isPB ? el('div', { class: 'tag', text: '★ 個人新紀錄！前一次最佳 ' + CSE.util.nf(prevBest) }) : null,
        stats.length ? el('div', { class: 'statlist' }, stats.map(function (s) {
          return el('div', {}, [s.k, el('b', { text: String(s.v) })]);
        })) : null,
        know ? el('div', { class: 'know' }, [
          el('h3', { text: '▸ ' + (know.title || '小知識') }),
          el('ul', {}, (know.lines || []).map(function (t) { return el('li', { text: t }); }))
        ]) : null,
        el('div', { class: 'divider' }),
        submitRow,
        submitMsg,
        el('div', { class: 'row', style: { justifyContent: 'center' } }, [
          el('button', { type: 'button', class: 'btn btn--primary', text: '再玩一次', onclick: function () { CSE.sfx.play('click'); begin(); } }),
          next ? el('a', { class: 'btn', href: '#/g/' + next.id, text: '下一款：' + next.name } ) : null,
          el('a', { class: 'btn btn--ghost', href: '#/', text: '回首頁' })
        ])
      ]);
      stage.appendChild(ov);
    }

    function removeOverlays() {
      var list = stage.querySelectorAll('.overlay');
      for (var i = 0; i < list.length; i++) list[i].parentNode.removeChild(list[i]);
      readyOverlay = null;
    }

    function runCleanups() {
      var list = S.cleanups;
      S.cleanups = [];
      for (var i = 0; i < list.length; i++) {
        try { list[i](); } catch (e) { console.warn('[CSE] cleanup 失敗', e); }
      }
    }

    /* ---------- 銷毀 ---------- */
    function destroy() {
      S.ended = true;
      S.running = false;
      Host.busy = false;
      cancelAnimationFrame(S.rafId);
      clearInterval(S.tickId);
      document.removeEventListener('visibilitychange', onVisibility);
      runCleanups();
      ui.clear(mountEl);
    }

    showReady();

    return {
      api: api,
      begin: begin,
      _destroy: destroy
    };
  }

  CSE.host = Host;
})();
