/* ============================================================
   遊戲 8：河內塔 — 把所有圓盤搬到最右邊的柱子
   教的是：遞迴、指數成長、最少步數 = 2^n − 1
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  var ROUNDS = [3, 4, 5];          /* 每關的圓盤數：最少 7 / 15 / 31 步 */
  var DISC_COLORS = [
    'var(--green)', 'var(--cyan)', 'var(--amber)',
    'var(--violet)', 'var(--pink)', 'var(--lime)'
  ];

  CSE.registerGame({
    id: 'hanoi',
    name: '河內塔',
    tag: '演算法 · RECURSION',
    icon: '≡',
    accent: 'var(--lime)',
    blurb: '把整疊圓盤搬到最右邊，大的不能壓小的。規則三秒就懂，但要用最少步數就是遞迴的經典題。',
    how: [
      '點一根柱子拿起最上面的圓盤，再點另一根放下。',
      '大的圓盤不能疊在小的上面。',
      '把所有圓盤搬到最右邊的柱子就過關。',
      '每關都有「理論最少步數」，走得越接近分數越高。共三關。'
    ],
    controls: '點柱子拿起／放下；也可按鍵盤 1、2、3',
    duration: 160,
    medals: { bronze: 500, silver: 1000, gold: 1600 },
    titles: ['體驗組', '搬運學徒', '遞迴好手', '河內塔大師'],
    knowledge: {
      title: '為什麼最少步數是 2ⁿ − 1？',
      lines: [
        '想搬 n 個：先把上面 n−1 個搬到中間，搬走最大的，再把 n−1 個搬過來。',
        '這就是遞迴 —— 大問題拆成兩個一模一樣的小問題，所以 T(n) = 2·T(n−1) + 1。',
        '3 個要 7 步、10 個要 1023 步、20 個就要一百萬步以上，這叫指數成長。',
        '傳說中僧侶要搬 64 個圓盤，一秒一步也要五千八百億年 —— 演算法的複雜度就是這麼有感。'
      ]
    },

    mount: function (stage, api) {
      var round = 0;
      var pegs = [[], [], []];        /* 每根柱子由下往上的圓盤大小 */
      var n = 0, par = 0, moves = 0;
      var sel = -1, busy = false, roundStart = 0;
      var totalMoves = 0, perfect = 0, cleared = 0;

      var board = api.el('div', { class: 'hn-board' });
      var parEl = api.el('b', { text: '0' });
      var mvEl = api.el('b', { text: '0' });
      var info = api.el('div', { class: 'statlist hn-info' }, [
        api.el('div', {}, ['最少步數', parEl]),
        api.el('div', {}, ['你走了', mvEl])
      ]);
      var btnReset = api.el('button', {
        type: 'button', class: 'btn btn--sm', text: '這關重來（−40）',
        onclick: function () {
          if (busy) return;
          api.addScore(-40);
          api.sfx.play('bad');
          loadRound(ROUNDS[round]);
        }
      });

      stage.appendChild(api.el('div', { class: 'hn-wrap' }, [
        board,
        info,
        api.el('div', { class: 'row', style: { justifyContent: 'center' } }, [btnReset])
      ]));

      function render() {
        CSE.ui.clear(board);
        for (var p = 0; p < 3; p++) {
          var col = api.el('button', {
            type: 'button',
            class: 'hn-peg' + (sel === p ? ' sel' : ''),
            'aria-label': '第 ' + (p + 1) + ' 根柱子，' + pegs[p].length + ' 個圓盤'
          });
          col.appendChild(api.el('i', { class: 'hn-rod' }));
          var stack = api.el('div', { class: 'hn-stack' });
          /* 由上往下畫，所以把陣列反過來 */
          for (var i = pegs[p].length - 1; i >= 0; i--) {
            var size = pegs[p][i];
            stack.appendChild(api.el('div', {
              class: 'hn-disc' + (sel === p && i === pegs[p].length - 1 ? ' lift' : ''),
              style: {
                width: Math.round(34 + (size / n) * 62) + '%',
                background: DISC_COLORS[(size - 1) % DISC_COLORS.length]
              },
              text: String(size)
            }));
          }
          col.appendChild(stack);
          col.appendChild(api.el('span', { class: 'hn-base', text: p === 2 ? '目標' : String(p + 1) }));
          (function (idx) {
            col.addEventListener('click', function () { tap(idx); });
          })(p);
          board.appendChild(col);
        }
      }

      function tap(p) {
        if (busy) return;
        if (sel < 0) {
          if (!pegs[p].length) {
            api.hint('這根柱子是空的，先點有圓盤的柱子。', 'bad');
            api.sfx.play('bad');
            return;
          }
          sel = p;
          api.sfx.play('click');
          api.hint('拿起 ' + pegs[p][pegs[p].length - 1] + ' 號圓盤，點另一根柱子放下');
          render();
          return;
        }
        if (sel === p) {                 /* 再點一次 = 放回去 */
          sel = -1;
          api.sfx.play('click');
          api.hint('');
          render();
          return;
        }
        var disc = pegs[sel][pegs[sel].length - 1];
        var top = pegs[p].length ? pegs[p][pegs[p].length - 1] : Infinity;
        if (disc > top) {
          api.hint(disc + ' 號比 ' + top + ' 號大，不能疊上去。', 'bad');
          api.sfx.play('bad');
          sel = -1;
          render();
          return;
        }
        pegs[sel].pop();
        pegs[p].push(disc);
        sel = -1;
        moves++; totalMoves++;
        mvEl.textContent = String(moves);
        api.sfx.play('type');
        api.hint(moves > par ? '已經超過最少步數 ' + (moves - par) + ' 步' : '還剩 ' + (par - moves) + ' 步額度');
        render();
        if (pegs[2].length === n) roundDone();
      }

      function roundDone() {
        busy = true;
        cleared++;
        var over = Math.max(0, moves - par);
        var spent = (performance.now() - roundStart) / 1000;
        var speed = Math.max(0, Math.round((40 - spent) * 3));
        var gain = Math.max(50, 240 - over * 25) + speed;
        if (over === 0) { gain += 140; perfect++; }
        api.addScore(gain);
        api.sfx.play('great');
        api.hint(over === 0
          ? '完美！剛好 ' + par + ' 步　+' + gain + ' 分（含最少步數獎勵）'
          : '過關！用了 ' + moves + ' 步（最少 ' + par + ' 步）　+' + gain + ' 分', 'good');

        round++;
        if (round >= ROUNDS.length) {
          var bonus = Math.round(api.timeLeft() * 5);
          api.addScore(bonus);
          api.after(1000, function () {
            api.finish({
              reason: 'cleared',
              stats: [
                { k: '完美關卡', v: perfect + ' / ' + ROUNDS.length },
                { k: '總步數', v: totalMoves + ' 步' },
                { k: '剩餘時間加分', v: '+' + bonus }
              ]
            });
          });
          return;
        }
        api.after(1300, function () { loadRound(ROUNDS[round]); });
      }

      function loadRound(discs) {
        busy = false;
        sel = -1;
        moves = 0;
        n = discs;
        par = Math.pow(2, discs) - 1;
        pegs = [[], [], []];
        for (var i = discs; i >= 1; i--) pegs[0].push(i);   /* 大的在最下面 */
        parEl.textContent = String(par);
        mvEl.textContent = '0';
        api.setStat('關卡', (round + 1) + '/' + ROUNDS.length);
        api.hint(discs + ' 個圓盤，最少 ' + par + ' 步。點柱子拿起圓盤。');
        roundStart = performance.now();
        render();
      }

      api.on(document, 'keydown', function (e) {
        if (e.key >= '1' && e.key <= '3') {
          e.preventDefault();
          tap(parseInt(e.key, 10) - 1);
        }
      });

      api.onResult(function () {
        return {
          stats: [
            { k: '完成關卡', v: cleared + ' / ' + ROUNDS.length },
            { k: '完美關卡', v: perfect },
            { k: '總步數', v: totalMoves + ' 步' }
          ]
        };
      });

      loadRound(ROUNDS[0]);
    }
  });
})();
