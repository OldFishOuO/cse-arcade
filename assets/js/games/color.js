/* ============================================================
   遊戲 10：十六進位調色盤 — 看懂 #RRGGBB
   教的是：十六進位、一個通道一個 byte、24 位元色彩
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  var HEX = '0123456789ABCDEF';

  function toHex(n) {
    n = CSE.util.clamp(Math.round(n), 0, 255);
    return HEX.charAt(n >> 4) + HEX.charAt(n & 15);
  }
  function rgbHex(r, g, b) { return '#' + toHex(r) + toHex(g) + toHex(b); }

  /* 產生一個「好描述」的顏色：至少一個通道明顯高或低 */
  function randColor() {
    var pick = function () { return CSE.util.randInt(0, 15) * 17; };   /* 00,11,22…FF 比較好讀 */
    return [pick(), pick(), pick()];
  }

  /* 依難度產生干擾選項：越後面越接近正確答案 */
  function distractor(c, level) {
    var span = level < 3 ? 136 : level < 6 ? 85 : 51;
    var out = c.slice();
    var tries = 0;
    do {
      out = c.map(function (v) {
        var d = CSE.util.randInt(1, span / 17) * 17 * (Math.random() < 0.5 ? -1 : 1);
        return CSE.util.clamp(v + d, 0, 255);
      });
      tries++;
    } while (out[0] === c[0] && out[1] === c[1] && out[2] === c[2] && tries < 20);
    return out;
  }

  CSE.registerGame({
    id: 'color',
    name: '十六進位調色盤',
    tag: '色彩編碼 · HEX',
    icon: '#',
    accent: 'var(--pink)',
    blurb: '網頁上的 #FF8800 到底是什麼顏色？認出色碼與顏色的對應，順便搞懂十六進位。',
    how: [
      '題目會給你一個顏色，或一組 #RRGGBB 色碼。',
      '從四個選項中挑出正確的那一個。',
      '每題 12 秒，越快答對分數越高，連對有加成。',
      '下方隨時看得到 R / G / B 三個通道的數值對照。'
    ],
    controls: '點選項；鍵盤 1–4 也可以',
    duration: 70,
    medals: { bronze: 600, silver: 1150, gold: 1750 },
    titles: ['體驗組', '色碼新手', '調色達人', '前端之眼'],
    knowledge: {
      title: '#RRGGBB 其實就是三個 byte',
      lines: [
        'RR、GG、BB 各是一個 16 進位的兩位數，範圍 00–FF，也就是十進位的 0–255。',
        '0–255 剛好是 8 個位元能表示的範圍 —— 跟「二進位快打」撥的那 8 個開關一模一樣。',
        '三個通道各 1 byte，共 24 位元，可以組出 16,777,216 種顏色，俗稱「全彩」。',
        '#FFFFFF 是三個通道全開（白），#000000 全關（黑），#FF0000 只開紅色通道。'
      ]
    },

    mount: function (stage, api) {
      var qi = 0, right = 0, wrong = 0, streak = 0, bestStreak = 0;
      var locked = true, qLeft = 0, PER_Q = 12;
      var answer = null, mode = 'toHex';

      var qLabel = api.el('div', { class: 'cl-label' });
      var qBox = api.el('div', { class: 'cl-q' });
      var opts = api.el('div', { class: 'cl-opts' });
      var fb = api.el('div', { class: 'cl-fb' });
      var breakdown = api.el('div', { class: 'cl-break' });
      var barIn = api.el('i', { style: { width: '0%' } });

      stage.appendChild(api.el('div', { class: 'cl-wrap' }, [
        api.el('div', { class: 'cl-bar' }, barIn),
        qLabel,
        qBox,
        opts,
        fb,
        breakdown
      ]));

      function showBreakdown(c) {
        CSE.ui.clear(breakdown);
        var names = [['R', '紅', 'var(--red)'], ['G', '綠', 'var(--green)'], ['B', '藍', 'var(--cyan)']];
        names.forEach(function (nm, i) {
          breakdown.appendChild(api.el('div', { class: 'cl-chan' }, [
            api.el('span', { class: 'cl-chan-k', style: { color: nm[2] }, text: nm[0] + ' ' + nm[1] }),
            api.el('b', { text: toHex(c[i]) }),
            api.el('span', { class: 'faint', text: '= ' + c[i] })
          ]));
        });
      }

      function nextQ() {
        qi++;
        locked = false;
        qLeft = PER_Q;
        answer = randColor();
        mode = qi % 2 ? 'toHex' : 'toColor';

        var wrongs = [];
        var guard = 0;
        while (wrongs.length < 3 && guard++ < 80) {
          var d = distractor(answer, qi);
          var dup = wrongs.some(function (w) { return w[0] === d[0] && w[1] === d[1] && w[2] === d[2]; });
          if (!dup && !(d[0] === answer[0] && d[1] === answer[1] && d[2] === answer[2])) wrongs.push(d);
        }
        while (wrongs.length < 3) wrongs.push(randColor());

        var all = CSE.util.shuffle([answer].concat(wrongs));

        CSE.ui.clear(qBox);
        CSE.ui.clear(opts);
        CSE.ui.clear(breakdown);
        fb.className = 'cl-fb';
        fb.textContent = '';
        api.hint('');

        if (mode === 'toHex') {
          qLabel.textContent = '這個顏色的色碼是？';
          qBox.appendChild(api.el('div', {
            class: 'cl-swatch cl-swatch--big',
            style: { background: rgbHex(answer[0], answer[1], answer[2]) }
          }));
          all.forEach(function (c, i) {
            opts.appendChild(api.el('button', {
              type: 'button', class: 'btn cl-opt cl-opt--text',
              text: rgbHex(c[0], c[1], c[2]),
              onclick: function () { choose(c, this); }
            }));
          });
        } else {
          qLabel.textContent = '哪一個是這個色碼？';
          qBox.appendChild(api.el('div', {
            class: 'cl-code', text: rgbHex(answer[0], answer[1], answer[2])
          }));
          all.forEach(function (c) {
            opts.appendChild(api.el('button', {
              type: 'button', class: 'btn cl-opt cl-opt--sw',
              'aria-label': rgbHex(c[0], c[1], c[2]),
              onclick: function () { choose(c, this); }
            }, api.el('span', {
              class: 'cl-swatch',
              style: { background: rgbHex(c[0], c[1], c[2]) }
            })));
          });
        }
      }

      function choose(c, btn) {
        if (locked) return;
        locked = true;
        var ok = (c[0] === answer[0] && c[1] === answer[1] && c[2] === answer[2]);
        Array.prototype.forEach.call(opts.children, function (b) { b.disabled = true; });

        if (ok) {
          right++; streak++;
          bestStreak = Math.max(bestStreak, streak);
          var speed = Math.max(0, Math.round(qLeft * 8));
          var gain = 90 + speed + 15 * Math.min(streak - 1, 6);
          api.addScore(gain);
          api.sfx.play(streak >= 3 ? 'great' : 'ok');
          btn.classList.add('right');
          fb.className = 'cl-fb right';
          fb.textContent = '✓ 答對了（+' + gain + '）' + (streak > 1 ? '　' + streak + ' 連對' : '');
        } else {
          wrong++; streak = 0;
          api.sfx.play('bad');
          btn.classList.add('wrong');
          Array.prototype.forEach.call(opts.children, function (b, i) {
            var label = b.getAttribute('aria-label') || b.textContent;
            if (label === rgbHex(answer[0], answer[1], answer[2])) b.classList.add('right');
          });
          fb.className = 'cl-fb wrong';
          fb.textContent = '✗ 正確答案是 ' + rgbHex(answer[0], answer[1], answer[2]);
        }
        api.setStat('連對', streak);
        showBreakdown(answer);
        api.after(ok ? 900 : 1700, nextQ);
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
            Array.prototype.forEach.call(opts.children, function (b) {
              b.disabled = true;
              var label = b.getAttribute('aria-label') || b.textContent;
              if (label === rgbHex(answer[0], answer[1], answer[2])) b.classList.add('right');
            });
            fb.className = 'cl-fb wrong';
            fb.textContent = '⏱ 時間到 — 正確答案是 ' + rgbHex(answer[0], answer[1], answer[2]);
            showBreakdown(answer);
            api.after(1700, nextQ);
          }
        }
      };
    }
  });
})();
