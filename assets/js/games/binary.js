/* ============================================================
   遊戲 1：二進位快打 — 撥 8 個位元開關湊出目標十進位數
   教的是：位值、2 的次方、1 byte = 8 bits
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  var WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];

  CSE.registerGame({
    id: 'binary',
    name: '二進位快打',
    tag: '數位邏輯 · BINARY',
    icon: '10',
    accent: 'var(--green)',
    blurb: '電腦眼裡只有 0 和 1。撥動 8 個位元開關，湊出畫面上的十進位數字。',
    how: [
      '上方出現一個目標數字（1–255）。',
      '點下方 8 個開關，讓「目前數值」等於目標。',
      '數值一相符就自動跳下一題，連續答對有連擊加成。',
      '不會算就按「提示」看答案的二進位，但該題分數砍半。'
    ],
    controls: '滑鼠點擊或手指觸控；也可按鍵盤 1–8 切換第 1–8 個開關',
    duration: 60,
    medals: { bronze: 600, silver: 1300, gold: 2200 },
    titles: ['體驗組', '二進位新生', '位元快手', '人類 CPU'],
    knowledge: {
      title: '為什麼是 8 個開關？',
      lines: [
        '8 個位元 = 1 byte，剛好能表示 0–255，共 256 種狀態。',
        '每個位元的「權重」是 2 的次方：128、64、32、16、8、4、2、1。',
        '一個英文字元（ASCII）就是 1 byte；你剛剛其實是在手動編碼。',
        '顏色 #FF8800 裡的 FF 就是 255，也就是 8 個位元全部打開。'
      ]
    },

    mount: function (stage, api) {
      var bits = [0, 0, 0, 0, 0, 0, 0, 0];
      var target = 0;
      var streak = 0, solved = 0, skipped = 0, hintsUsed = 0;
      var qStart = 0, hintOn = false, qIndex = 0;

      var numEl = api.el('div', { class: 'num', text: '0' });
      var curVal = api.el('b', { text: '0' });
      var curBin = api.el('span', { class: 'faint', text: '' });
      var curEl = api.el('div', { class: 'bin-cur' }, ['目前：', curVal, ' ', curBin]);
      var binHint = api.el('div', { class: 'bin-binary', text: '' });

      var bitsWrap = api.el('div', { class: 'bin-bits' });
      var bitBtns = [];

      WEIGHTS.forEach(function (w, i) {
        var vEl = api.el('div', { class: 'v', text: '0' });
        var b = api.el('button', {
          type: 'button', class: 'bit', 'aria-pressed': 'false',
          'aria-label': '位元 ' + (i + 1) + '，權重 ' + w
        }, [vEl, api.el('div', { class: 'w', text: String(w) })]);
        b._v = vEl;
        b.addEventListener('click', function () { toggle(i); });
        bitBtns.push(b);
        bitsWrap.appendChild(b);
      });

      var btnHint = api.el('button', {
        type: 'button', class: 'btn btn--sm', text: '提示（分數砍半）',
        onclick: function () {
          if (hintOn) return;
          hintOn = true; hintsUsed++;
          api.sfx.play('click');
          paintHint();
        }
      });
      var btnSkip = api.el('button', {
        type: 'button', class: 'btn btn--sm', text: '跳過（−20）',
        onclick: function () {
          skipped++;
          streak = 0;
          api.setStat('連擊', 0);     /* 不補這行的話畫面會停在舊的連擊數 */
          api.addScore(-20);
          api.sfx.play('bad');
          api.hint('跳過了，連擊歸零。', 'bad');
          nextQuestion();
        }
      });
      var btnClear = api.el('button', {
        type: 'button', class: 'btn btn--sm', text: '全部歸零',
        onclick: function () {
          for (var i = 0; i < 8; i++) bits[i] = 0;
          api.sfx.play('click');
          paint();
        }
      });

      stage.appendChild(api.el('div', { class: 'bin-wrap' }, [
        api.el('div', { class: 'bin-target' }, [
          api.el('div', { class: 'lbl', text: '目標數字' }),
          numEl
        ]),
        binHint,
        bitsWrap,
        curEl,
        api.el('div', { class: 'bin-hintrow' }, [btnHint, btnSkip, btnClear])
      ]));

      function value() {
        var v = 0;
        for (var i = 0; i < 8; i++) if (bits[i]) v += WEIGHTS[i];
        return v;
      }

      function binStr(v) {
        var s = '';
        for (var i = 0; i < 8; i++) s += ((v >> (7 - i)) & 1);
        return s;
      }

      function paintHint() {
        binHint.textContent = hintOn ? binStr(target) : '';
      }

      function paint() {
        var v = value();
        curVal.textContent = String(v);
        curBin.textContent = '(' + binStr(v) + ')';
        curEl.className = 'bin-cur' + (v > target ? ' hi' : v < target ? ' lo' : '');
        for (var i = 0; i < 8; i++) {
          bitBtns[i].setAttribute('aria-pressed', bits[i] ? 'true' : 'false');
          bitBtns[i]._v.textContent = bits[i] ? '1' : '0';
        }
        if (v === target) win();
      }

      function toggle(i) {
        bits[i] = bits[i] ? 0 : 1;
        api.sfx.play('click');
        paint();
      }

      function win() {
        solved++;
        streak++;
        var elapsed = (performance.now() - qStart) / 1000;
        var speed = Math.max(0, Math.round((6 - elapsed) * 12));   /* 6 秒內有加成 */
        var base = 60 + 12 * Math.min(streak - 1, 8);
        var gain = Math.round((base + speed) * (hintOn ? 0.5 : 1));
        api.addScore(gain);
        api.setStat('連擊', streak);
        api.sfx.play(streak >= 4 ? 'great' : 'ok');
        api.hint('正確！+' + gain + ' 分' + (streak > 1 ? '（' + streak + ' 連擊）' : '') +
          '　' + target + ' = ' + binStr(target), 'good');
        nextQuestion();
      }

      function nextQuestion() {
        qIndex++;
        hintOn = false;
        paintHint();
        /* 前三題給小數字當暖身，之後整個 1–255 */
        var hi = qIndex <= 3 ? 15 : (qIndex <= 6 ? 63 : 255);
        var cur = value();
        var t, guard = 0;
        do {
          t = CSE.util.randInt(1, hi);
          guard++;
        } while (t === cur && guard < 50);
        target = t;
        numEl.textContent = String(target);
        qStart = performance.now();
        paint();   /* 若剛好已相等（極端狀況）也會正確處理 */
      }

      /* 鍵盤 1–8 */
      api.on(document, 'keydown', function (e) {
        if (e.key >= '1' && e.key <= '8') {
          e.preventDefault();
          toggle(parseInt(e.key, 10) - 1);
        }
      });

      api.setStat('連擊', 0);
      api.hint('撥開關讓「目前」等於「目標」');
      nextQuestion();

      api.onResult(function () {
        return {
          stats: [
            { k: '答對', v: solved + ' 題' },
            { k: '跳過', v: skipped + ' 題' },
            { k: '用提示', v: hintsUsed + ' 次' },
            { k: '平均', v: solved ? (60 / solved).toFixed(1) + ' 秒/題' : '—' }
          ]
        };
      });
    }
  });
})();
