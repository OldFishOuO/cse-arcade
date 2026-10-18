/* ============================================================
   遊戲 10：十六進位調色盤 — 看懂 #RRGGBB
   教的是：十六進位、一個通道一個 byte、24 位元色彩

   設計原則：這款不是要考記憶力。
   玩家只要知道「數字越大 = 這個顏色越多」就能推出答案，
   所以選項之間一定差很多，而且畫面上永遠看得到對照表。
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  var HEX = '0123456789ABCDEF';

  /* 每個通道只用這四格，顏色才夠好分辨、數字也好記 */
  var LEVELS = [0x00, 0x55, 0xAA, 0xFF];
  var LEVEL_WORD = ['沒有', '一點', '很多', '全開'];

  function toHex(n) {
    n = CSE.util.clamp(Math.round(n), 0, 255);
    return HEX.charAt(n >> 4) + HEX.charAt(n & 15);
  }
  function rgbHex(c) { return '#' + toHex(c[0]) + toHex(c[1]) + toHex(c[2]); }

  /* 用「格子編號」表示顏色：[0..3, 0..3, 0..3] */
  function randLv() {
    var lv;
    do {
      lv = [CSE.util.randInt(0, 3), CSE.util.randInt(0, 3), CSE.util.randInt(0, 3)];
    } while (lv[0] === lv[1] && lv[1] === lv[2]);   /* 避開灰階，太難分 */
    return lv;
  }
  function lvToRgb(lv) { return [LEVELS[lv[0]], LEVELS[lv[1]], LEVELS[lv[2]]]; }
  function dist(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  }

  CSE.registerGame({
    id: 'color',
    name: '十六進位調色盤',
    tag: '色彩編碼 · HEX',
    icon: '#',
    accent: 'var(--pink)',
    level: '入門',
    blurb: '網頁上的 #FF8800 到底是什麼顏色？不用背，只要知道「數字越大這個顏色越多」就能推出來。',
    how: [
      '#RRGGBB 的三組數字，分別代表紅、綠、藍各有多少。',
      '00 是完全沒有、FF 是開到最大 —— 畫面下方隨時看得到對照表。',
      '題目會給顏色讓你選色碼，或給色碼讓你選顏色。',
      '選項之間一定差很多，用推的就好，不需要背。'
    ],
    controls: '點選項；鍵盤 1–4 也可以',
    duration: 70,
    medals: { bronze: 550, silver: 1050, gold: 1650 },
    titles: ['體驗組', '色碼新手', '調色達人', '前端之眼'],
    knowledge: {
      title: '#RRGGBB 其實就是三個 byte',
      lines: [
        'RR、GG、BB 各是一個 16 進位兩位數，範圍 00–FF，也就是十進位的 0–255。',
        '0–255 剛好是 8 個位元能表示的範圍 —— 跟「二進位快打」撥的那 8 個開關一模一樣。',
        '三個通道各 1 byte，共 24 位元，可以組出 16,777,216 種顏色，俗稱「全彩」。',
        '#FF0000 只開紅色、#00FF00 只開綠色、#FFFFFF 三個全開是白、#000000 全關是黑。'
      ]
    },

    mount: function (stage, api) {
      var qi = 0, right = 0, wrong = 0, streak = 0, bestStreak = 0;
      var locked = true, qLeft = 0, PER_Q = 14;
      var answerLv = null, mode = 'toHex';

      var qLabel = api.el('div', { class: 'cl-label' });
      var qBox = api.el('div', { class: 'cl-q' });
      var qHint = api.el('div', { class: 'cl-qhint' });
      var opts = api.el('div', { class: 'cl-opts' });
      var fb = api.el('div', { class: 'cl-fb' });
      var barIn = api.el('i', { style: { width: '0%' } });

      /* 永遠放在畫面上的對照表：這款遊戲的重點是讀懂它，不是背下來 */
      var legend = api.el('div', { class: 'cl-legend' }, [
        api.el('div', { class: 'cl-legend-row' }, [
          api.el('span', { class: 'cl-legend-t', text: '#' }),
          api.el('span', { class: 'cl-legend-seg', style: { color: 'var(--red)' }, text: 'RR' }),
          api.el('span', { class: 'cl-legend-seg', style: { color: 'var(--green)' }, text: 'GG' }),
          api.el('span', { class: 'cl-legend-seg', style: { color: 'var(--cyan)' }, text: 'BB' }),
          api.el('span', { class: 'faint', text: '＝ 紅 / 綠 / 藍 各有多少' })
        ]),
        api.el('div', { class: 'cl-scale' }, LEVELS.map(function (v, i) {
          return api.el('div', { class: 'cl-scale-item' }, [
            api.el('b', { text: toHex(v) }),
            api.el('span', { text: LEVEL_WORD[i] })
          ]);
        }))
      ]);

      stage.appendChild(api.el('div', { class: 'cl-wrap' }, [
        api.el('div', { class: 'cl-bar' }, barIn),
        qLabel,
        qBox,
        qHint,
        opts,
        fb,
        legend
      ]));

      function nextQ() {
        qi++;
        locked = false;
        qLeft = PER_Q;
        answerLv = randLv();
        mode = qi % 2 ? 'toHex' : 'toColor';

        /* 干擾選項一定要跟答案差很多，用看的就分得出來。
           前幾題差距更大，後面才稍微縮小，但永遠不會「幾乎一樣」。 */
        var minGap = qi <= 4 ? 4 : qi <= 9 ? 3 : 2;
        var wrongs = [];
        var guard = 0;
        while (wrongs.length < 3 && guard++ < 300) {
          var cand = randLv();
          if (dist(cand, answerLv) < minGap) continue;
          var tooClose = wrongs.some(function (w) { return dist(w, cand) < 2; });
          if (!tooClose) wrongs.push(cand);
        }
        while (wrongs.length < 3) wrongs.push(randLv());

        var all = CSE.util.shuffle([answerLv].concat(wrongs));
        var ansRgb = lvToRgb(answerLv);

        CSE.ui.clear(qBox);
        CSE.ui.clear(opts);
        fb.className = 'cl-fb';
        fb.textContent = '';
        api.hint('');

        if (mode === 'toHex') {
          qLabel.textContent = '這個顏色的色碼是哪一個？';
          qHint.textContent = '提示：看看紅、綠、藍各佔多少，再比對數字大小。';
          qBox.appendChild(api.el('div', {
            class: 'cl-swatch cl-swatch--big',
            style: { background: rgbHex(ansRgb) }
          }));
          all.forEach(function (lv) {
            var c = lvToRgb(lv);
            opts.appendChild(api.el('button', {
              type: 'button', class: 'btn cl-opt cl-opt--text',
              text: rgbHex(c),
              onclick: function () { choose(lv, this); }
            }));
          });
        } else {
          qLabel.textContent = '哪一個是這個色碼？';
          /* 直接把三個通道翻成白話 —— 這是教學，不是洩題：
             玩家還是得自己把「紅全開、綠沒有」對應到色票。 */
          qHint.textContent = '紅 ' + LEVEL_WORD[answerLv[0]] +
                              '　綠 ' + LEVEL_WORD[answerLv[1]] +
                              '　藍 ' + LEVEL_WORD[answerLv[2]];
          qBox.appendChild(api.el('div', { class: 'cl-code', text: rgbHex(ansRgb) }));
          all.forEach(function (lv) {
            var c = lvToRgb(lv);
            opts.appendChild(api.el('button', {
              type: 'button', class: 'btn cl-opt cl-opt--sw',
              'aria-label': rgbHex(c),
              onclick: function () { choose(lv, this); }
            }, api.el('span', { class: 'cl-swatch', style: { background: rgbHex(c) } })));
          });
        }
      }

      function markAnswer() {
        var want = rgbHex(lvToRgb(answerLv));
        Array.prototype.forEach.call(opts.children, function (b) {
          b.disabled = true;
          var label = b.getAttribute('aria-label') || b.textContent;
          if (label === want) b.classList.add('right');
        });
      }

      function choose(lv, btn) {
        if (locked) return;
        locked = true;
        var ok = dist(lv, answerLv) === 0;

        if (ok) {
          right++; streak++;
          bestStreak = Math.max(bestStreak, streak);
          var speed = Math.max(0, Math.round(qLeft * 7));
          var gain = 90 + speed + 15 * Math.min(streak - 1, 6);
          api.addScore(gain);
          api.sfx.play(streak >= 3 ? 'great' : 'ok');
          markAnswer();
          fb.className = 'cl-fb right';
          fb.textContent = '✓ 答對了（+' + gain + '）' + (streak > 1 ? '　' + streak + ' 連對' : '');
        } else {
          wrong++; streak = 0;
          api.sfx.play('bad');
          btn.classList.add('wrong');
          markAnswer();
          var a = answerLv;
          fb.className = 'cl-fb wrong';
          fb.textContent = '✗ 答案是 ' + rgbHex(lvToRgb(a)) +
            '（紅 ' + LEVEL_WORD[a[0]] + '、綠 ' + LEVEL_WORD[a[1]] + '、藍 ' + LEVEL_WORD[a[2]] + '）';
        }
        api.setStat('連對', streak);
        api.after(ok ? 850 : 1900, nextQ);
      }

      api.on(document, 'keydown', function (e) {
        if (locked) return;
        var n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4 && opts.children[n - 1]) {
          e.preventDefault();
          opts.children[n - 1].click();
        }
      });

      api.onResult(function () {
        var tot = right + wrong;
        return {
          stats: [
            { k: '答對', v: right + ' 題' },
            { k: '答錯', v: wrong + ' 題' },
            { k: '正確率', v: (tot ? Math.round(right / tot * 100) : 0) + '%' },
            { k: '最高連對', v: bestStreak }
          ]
        };
      });

      api.setStat('連對', 0);
      nextQ();

      return {
        onTick: function (dt) {
          if (locked) return;
          qLeft -= dt;
          barIn.style.width = Math.max(0, Math.min(100, (1 - qLeft / PER_Q) * 100)) + '%';
          if (qLeft <= 0) {
            qLeft = 0;
            locked = true;
            wrong++; streak = 0;
            api.setStat('連對', 0);
            api.sfx.play('bad');
            markAnswer();
            fb.className = 'cl-fb wrong';
            fb.textContent = '⏱ 時間到 — 答案是 ' + rgbHex(lvToRgb(answerLv));
            api.after(1900, nextQ);
          }
        }
      };
    }
  });
})();
