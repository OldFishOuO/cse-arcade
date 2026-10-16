/* ============================================================
   遊戲 2：邏輯閘實驗室 — 撥輸入讓輸出亮燈，後半段改成「選對的閘」
   教的是：AND / OR / NOT / XOR / NAND、真值表
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  /* ---------- 邏輯運算 ---------- */
  function gate(t, a, b) {
    if (a === null || a === undefined) return null;
    if (t !== 'NOT' && (b === null || b === undefined)) return null;
    switch (t) {
      case 'AND':  return (a && b) ? 1 : 0;
      case 'OR':   return (a || b) ? 1 : 0;
      case 'XOR':  return (a !== b) ? 1 : 0;
      case 'NAND': return (a && b) ? 0 : 1;
      case 'NOR':  return (a || b) ? 0 : 1;
      case 'XNOR': return (a === b) ? 1 : 0;
      case 'NOT':  return a ? 0 : 1;
    }
    return null;
  }

  var PALETTE = ['AND', 'OR', 'XOR', 'NAND', 'NOR'];

  /* 遞迴計算，並把結果記在 node._val 上供畫線用 */
  function evaluate(node, inv, assign) {
    var v;
    if (node.t === 'IN') {
      v = inv[node.i] ? 1 : 0;
    } else if (node.t === 'Q') {
      var g = assign[node.slot];
      var a = evaluate(node.a, inv, assign);
      var b = node.b ? evaluate(node.b, inv, assign) : null;
      v = g ? gate(g, a, b) : null;
    } else if (node.t === 'NOT') {
      v = gate('NOT', evaluate(node.a, inv, assign), null);
    } else {
      v = gate(node.t, evaluate(node.a, inv, assign), evaluate(node.b, inv, assign));
    }
    node._val = v;
    return v;
  }

  function children(node) {
    if (node.t === 'IN') return [];
    return node.b ? [node.a, node.b] : [node.a];
  }

  /* ---------- 關卡 ---------- */
  function IN(i) { return { t: 'IN', i: i }; }

  var LEVELS = [
    {
      name: 'AND 很挑',
      inputs: ['A', 'B'], mode: 'inputs', target: 1,
      tree: { t: 'AND', a: IN(0), b: IN(1) },
      note: 'AND（且）：<b>兩邊都是 1</b> 才輸出 1。讓燈泡亮起來。'
    },
    {
      name: 'NOT 會翻臉',
      inputs: ['A', 'B'], mode: 'inputs', target: 0,
      tree: { t: 'OR', a: { t: 'NOT', a: IN(0) }, b: IN(1) },
      note: 'NOT（反）把 0 變 1、1 變 0。這次目標是讓輸出變成 <b>0</b>。'
    },
    {
      name: 'XOR 只愛不一樣',
      inputs: ['A', 'B'], mode: 'inputs', target: 1,
      tree: { t: 'XOR', a: IN(0), b: IN(1) },
      note: 'XOR（互斥或）：<b>兩邊不一樣</b>才輸出 1。這就是加法器的核心。'
    },
    {
      name: '三個輸入',
      inputs: ['A', 'B', 'C'], mode: 'inputs', target: 1,
      tree: { t: 'AND', a: { t: 'XOR', a: IN(0), b: IN(1) }, b: { t: 'NOT', a: IN(2) } },
      note: '訊號會一層一層往右傳。目標輸出 <b>1</b>。'
    },
    {
      name: 'NAND 是萬能的',
      inputs: ['A', 'B', 'C'], mode: 'inputs', target: 0,
      tree: { t: 'NAND', a: { t: 'OR', a: IN(0), b: IN(1) }, b: { t: 'AND', a: IN(1), b: IN(2) } },
      note: 'NAND = NOT + AND。只用 NAND 就能組出所有邏輯閘，所以晶片特別愛它。目標輸出 <b>0</b>。'
    },
    {
      name: '走到底',
      inputs: ['A', 'B', 'C'], mode: 'inputs', target: 1,
      tree: { t: 'AND', a: { t: 'OR', a: IN(0), b: IN(1) }, b: { t: 'NOT', a: { t: 'AND', a: IN(1), b: IN(2) } } },
      note: '最後一題撥開關的題目。目標輸出 <b>1</b>。'
    },
    {
      name: '補上缺的閘',
      inputs: ['A', 'B'], mode: 'gate', slots: 1,
      tree: { t: 'Q', slot: 0, a: IN(0), b: IN(1) },
      table: [0, 1, 1, 1],
      note: '這次換你當設計師：點 <b>?</b> 選一個閘，讓電路符合右邊的真值表，再按「驗證」。'
    },
    {
      name: '反過來想',
      inputs: ['A', 'B'], mode: 'gate', slots: 1,
      tree: { t: 'NOT', a: { t: 'Q', slot: 0, a: IN(0), b: IN(1) } },
      table: [1, 0, 0, 1],
      note: '後面已經接了一個 NOT。前面要放什麼，整體才會符合真值表？'
    },
    {
      name: '兩個空格',
      inputs: ['A', 'B', 'C'], mode: 'gate', slots: 2,
      tree: { t: 'Q', slot: 1, a: { t: 'Q', slot: 0, a: IN(0), b: IN(1) }, b: IN(2) },
      table: [0, 1, 0, 1, 0, 1, 1, 1],
      note: '兩個空格都要填。答案不只一組，只要真值表全對就算過關。'
    }
  ];

  /* ---------- 版面計算 ---------- */
  var ROW = 68, PAD = 44, IN_X = 54, COL_W = 132, GATE_W = 76, GATE_H = 46;

  function buildLayout(level) {
    var inputs = level.inputs;
    var inputY = inputs.map(function (_, i) { return PAD + i * ROW; });

    var all = [];
    (function walk(n) {
      children(n).forEach(walk);
      if (n.t !== 'IN') all.push(n);
    })(level.tree);

    /* col：葉子在 0，往輸出遞增 */
    function colOf(n) {
      if (n.t === 'IN') return 0;
      if (n._col !== undefined) return n._col;
      var c = 0;
      children(n).forEach(function (k) { c = Math.max(c, colOf(k)); });
      n._col = c + 1;
      return n._col;
    }
    function yOf(n) {
      if (n.t === 'IN') return inputY[n.i];
      if (n._y !== undefined) return n._y;
      var ks = children(n), sum = 0;
      ks.forEach(function (k) { sum += yOf(k); });
      n._y = sum / ks.length;
      return n._y;
    }
    all.forEach(function (n) { n._col = undefined; n._y = undefined; });
    all.forEach(colOf);
    all.forEach(yOf);

    /* 同一欄避免重疊 */
    var maxCol = 0;
    all.forEach(function (n) { maxCol = Math.max(maxCol, n._col); });
    for (var c = 1; c <= maxCol; c++) {
      var inCol = all.filter(function (n) { return n._col === c; })
        .sort(function (a, b) { return a._y - b._y; });
      for (var i = 1; i < inCol.length; i++) {
        if (inCol[i]._y - inCol[i - 1]._y < GATE_H + 14) {
          inCol[i]._y = inCol[i - 1]._y + GATE_H + 14;
        }
      }
    }
    all.forEach(function (n) { n._x = IN_X + 96 + (n._col - 1) * COL_W; });

    var maxY = Math.max.apply(null, inputY.concat(all.map(function (n) { return n._y; })));
    var contentW = IN_X + 96 + (maxCol - 1) * COL_W + GATE_W / 2 + 110;

    /* 小電路不要被放大到爆：給一個最小畫布寬度並置中 */
    var w = Math.max(560, contentW);
    var ox = (w - contentW) / 2;
    all.forEach(function (n) { n._x += ox; });

    return { nodes: all, inputY: inputY, ox: ox, w: w, h: maxY + PAD };
  }

  function outPort(n, lay) {
    return n.t === 'IN'
      ? { x: IN_X + lay.ox + 30, y: lay.inputY[n.i] }
      : { x: n._x + GATE_W / 2, y: n._y };
  }

  CSE.registerGame({
    id: 'logic',
    name: '邏輯閘實驗室',
    tag: '計算機組織 · LOGIC',
    icon: '&',
    accent: 'var(--violet)',
    blurb: 'CPU 裡面幾十億個電晶體，做的就是 AND / OR / NOT。撥開關點亮燈泡，再換你來設計電路。',
    how: [
      '左邊是輸入開關（A、B、C），點一下切換 0 / 1。',
      '訊號往右傳，亮綠色代表這條線是 1。',
      '前 6 關：撥開關讓最右邊的燈泡符合題目要求。',
      '後 3 關：點電路裡的「?」，從下方選一個邏輯閘，讓真值表全部正確，再按「驗證」。'
    ],
    controls: '點輸入開關切換 0/1；點「?」選閘',
    duration: 160,
    medals: { bronze: 650, silver: 1300, gold: 2100 },
    titles: ['體驗組', '邏輯新生', '電路達人', '晶片設計師'],
    knowledge: {
      title: '幾十億個開關疊出一台電腦',
      lines: [
        'CPU 裡沒有魔法，只有電晶體組成的 AND / OR / NOT 這些邏輯閘。',
        'XOR + AND 可以做出「半加器」，串起來就能做加法，再往上就是整台電腦。',
        'NAND 和 NOR 叫做「通用閘」：只用其中一種就能組出所有邏輯。',
        '這是資工系「數位邏輯設計」和「計算機組織」在教的東西。'
      ]
    },

    mount: function (stage, api) {
      var li = 0;                 /* 目前關卡 */
      var inv = [];               /* 輸入值 */
      var assign = {};            /* slot -> gate type */
      var selSlot = null;
      var cleared = 0, wrongTries = 0, levelStart = 0;

      var taskEl = api.el('div', { class: 'lg-task' });
      var dots = api.el('div', { class: 'lvdots' });
      var canvas = api.el('div', { class: 'lg-canvas' });
      var truth = api.el('div', { class: 'lg-truth' });
      var palette = api.el('div', { class: 'lg-palette' });

      stage.appendChild(api.el('div', { class: 'lg-wrap' }, [
        dots, taskEl, canvas, truth, palette
      ]));

      function paintDots() {
        CSE.ui.clear(dots);
        LEVELS.forEach(function (_, i) {
          dots.appendChild(api.el('i', {
            class: 'lvdot ' + (i < li ? 'done' : i === li ? 'now' : '')
          }));
        });
      }

      /* ---------- 繪製電路 ---------- */
      function render() {
        var lv = LEVELS[li];
        var lay = buildLayout(lv);
        evaluate(lv.tree, inv, assign);

        var svg = api.svg('svg', {
          viewBox: '0 0 ' + Math.round(lay.w) + ' ' + Math.round(lay.h),
          role: 'img', 'aria-label': '邏輯電路圖'
        });

        /* 連線 */
        lay.nodes.forEach(function (n) {
          var ks = children(n);
          ks.forEach(function (k, idx) {
            var p1 = outPort(k, lay);
            var dy = ks.length === 2 ? (idx === 0 ? -12 : 12) : 0;
            var p2 = { x: n._x - GATE_W / 2, y: n._y + dy };
            var on = k._val === 1;
            svg.appendChild(api.svg('path', {
              class: 'wire' + (on ? ' on' : ''),
              d: 'M' + p1.x + ' ' + p1.y +
                 ' C' + (p1.x + 46) + ' ' + p1.y +
                 ' ' + (p2.x - 46) + ' ' + p2.y +
                 ' ' + p2.x + ' ' + p2.y
            }));
          });
        });

        /* 輸出線 + 燈泡 */
        var root = lv.tree;
        var rp = outPort(root, lay);
        var lampX = rp.x + 72;
        svg.appendChild(api.svg('path', {
          class: 'wire' + (root._val === 1 ? ' on' : ''),
          d: 'M' + rp.x + ' ' + rp.y + ' L' + (lampX - 18) + ' ' + rp.y
        }));
        svg.appendChild(api.svg('circle', {
          class: 'lamp' + (root._val === 1 ? ' on' : ''),
          cx: lampX, cy: rp.y, r: 17
        }));
        svg.appendChild(api.svg('text', {
          class: 'ew', x: lampX, y: rp.y + 36, text: '輸出 ' + (root._val === null ? '?' : root._val)
        }));

        /* 輸入開關 */
        lv.inputs.forEach(function (name, i) {
          var y = lay.inputY[i];
          var ix = IN_X + lay.ox;
          var g = api.svg('g', { class: 'sw' + (inv[i] ? ' on' : ''), tabindex: '0', role: 'button',
            'aria-label': '輸入 ' + name + ' 目前是 ' + (inv[i] ? 1 : 0) });
          g.appendChild(api.svg('rect', { x: ix - 30, y: y - 21, width: 60, height: 42, rx: 7 }));
          g.appendChild(api.svg('text', { class: 'n', x: ix - 14, y: y + 5, text: name }));
          g.appendChild(api.svg('text', { class: 'b', x: ix + 14, y: y + 5, text: String(inv[i] ? 1 : 0) }));
          function hit() { inv[i] = inv[i] ? 0 : 1; api.sfx.play('click'); afterChange(); }
          g.addEventListener('click', hit);
          g.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(); }
          });
          svg.appendChild(g);
        });

        /* 閘 */
        lay.nodes.forEach(function (n) {
          var isQ = n.t === 'Q';
          var label = isQ ? (assign[n.slot] || '?') : n.t;
          var cls = 'gatebox' + (isQ && !assign[n.slot] ? ' q' : '') + (isQ && selSlot === n.slot ? ' sel' : '');
          var g = api.svg('g', isQ ? { class: 'sw', tabindex: '0', role: 'button', 'aria-label': '空的邏輯閘' } : {});
          g.appendChild(api.svg('rect', {
            class: cls, x: n._x - GATE_W / 2, y: n._y - GATE_H / 2,
            width: GATE_W, height: GATE_H, rx: 8
          }));
          g.appendChild(api.svg('text', {
            class: 'gatelabel' + (isQ && !assign[n.slot] ? ' q' : ''),
            x: n._x, y: n._y, text: label
          }));
          if (isQ) {
            function sel() { selSlot = n.slot; api.sfx.play('click'); render(); paintPalette(); }
            g.addEventListener('click', sel);
            g.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); }
            });
          }
          svg.appendChild(g);
        });

        CSE.ui.clear(canvas);
        canvas.appendChild(svg);
      }

      /* ---------- 真值表 ---------- */
      function paintTruth() {
        var lv = LEVELS[li];
        CSE.ui.clear(truth);
        if (lv.mode !== 'gate') return;
        var n = lv.inputs.length;
        var head = api.el('tr', {}, lv.inputs.map(function (name) { return api.el('th', { text: name }); })
          .concat([api.el('th', { text: '期望' }), api.el('th', { text: '目前' })]));
        var rows = [];
        var curIdx = 0;
        for (var i = 0; i < n; i++) curIdx = (curIdx << 1) | (inv[i] ? 1 : 0);
        for (var idx = 0; idx < (1 << n); idx++) {
          var bits = [];
          for (var b = 0; b < n; b++) bits.push((idx >> (n - 1 - b)) & 1);
          evaluate(lv.tree, bits, assign);
          var got = lv.tree._val;
          var want = lv.table[idx];
          var tds = bits.map(function (v) { return api.el('td', { text: String(v) }); });
          tds.push(api.el('td', { class: 'out', text: String(want) }));
          tds.push(api.el('td', {
            text: got === null ? '—' : String(got),
            style: { color: got === null ? 'var(--fg-faint)' : (got === want ? 'var(--green)' : 'var(--red)') }
          }));
          rows.push(api.el('tr', { class: idx === curIdx ? 'now' : '' }, tds));
        }
        /* 還原成玩家目前撥的輸入 */
        evaluate(lv.tree, inv, assign);
        truth.appendChild(api.el('table', {}, [
          api.el('thead', {}, head), api.el('tbody', {}, rows)
        ]));
      }

      /* ---------- 工具列 ---------- */
      function paintPalette() {
        var lv = LEVELS[li];
        CSE.ui.clear(palette);
        if (lv.mode !== 'gate') {
          palette.appendChild(api.el('div', { class: 'faint', style: { fontSize: '12.5px' },
            text: '提示：先看最右邊的閘需要什麼，再往左推回去。' }));
          return;
        }
        palette.appendChild(api.el('span', { class: 'faint', style: { fontSize: '12.5px' },
          text: selSlot === null ? '先點電路裡的 ? →' : '放入：' }));
        PALETTE.forEach(function (t) {
          palette.appendChild(api.el('button', {
            type: 'button', class: 'btn btn--sm', text: t, disabled: selSlot === null,
            onclick: function () {
              assign[selSlot] = t;
              api.sfx.play('click');
              selSlot = null;
              afterChange();
            }
          }));
        });
        palette.appendChild(api.el('button', {
          type: 'button', class: 'btn btn--sm', text: '清空',
          onclick: function () { assign = {}; selSlot = null; api.sfx.play('click'); afterChange(); }
        }));
        palette.appendChild(api.el('button', {
          type: 'button', class: 'btn btn--sm btn--primary', text: '驗證',
          onclick: verify
        }));
      }

      function verify() {
        if (li >= LEVELS.length) return;          /* 全破之後不再接受操作 */
        var lv = LEVELS[li];
        var n = lv.inputs.length;
        for (var s = 0; s < (lv.slots || 1); s++) {
          if (!assign[s]) {
            api.hint('還有空格沒填。', 'bad');
            api.sfx.play('bad');
            return;
          }
        }
        var ok = true;
        for (var idx = 0; idx < (1 << n) && ok; idx++) {
          var bits = [];
          for (var b = 0; b < n; b++) bits.push((idx >> (n - 1 - b)) & 1);
          evaluate(lv.tree, bits, assign);
          if (lv.tree._val !== lv.table[idx]) ok = false;
        }
        evaluate(lv.tree, inv, assign);
        if (ok) { levelCleared(); }
        else {
          wrongTries++;
          api.addScore(-30);
          api.sfx.play('bad');
          api.hint('還沒對。看「目前」欄哪幾列是紅的，就知道差在哪。', 'bad');
          paintTruth();
        }
      }

      function afterChange() {
        if (li >= LEVELS.length) return;
        var lv = LEVELS[li];
        evaluate(lv.tree, inv, assign);
        render();
        paintTruth();
        paintPalette();
        if (lv.mode === 'inputs' && lv.tree._val === lv.target) levelCleared();
      }

      function levelCleared() {
        cleared++;
        var spent = (performance.now() - levelStart) / 1000;
        var speed = Math.max(0, Math.round((20 - spent) * 6));
        var gain = 150 + speed;
        api.addScore(gain);
        api.sfx.play('great');
        api.hint('第 ' + (li + 1) + ' 關過關！+' + gain + ' 分', 'good');
        li++;
        if (li >= LEVELS.length) {
          var bonus = Math.round(api.timeLeft() * 6);
          api.addScore(bonus);
          api.finish({
            reason: 'cleared',
            stats: [
              { k: '過關', v: cleared + ' / ' + LEVELS.length },
              { k: '驗證失敗', v: wrongTries + ' 次' },
              { k: '剩餘時間加分', v: '+' + bonus }
            ]
          });
          return;
        }
        api.after(650, loadLevel);
      }

      function loadLevel() {
        if (li >= LEVELS.length) return;
        var lv = LEVELS[li];
        assign = {}; selSlot = null;
        inv = lv.inputs.map(function () { return 0; });

        /* 避免「一開始就已經達成目標」 */
        if (lv.mode === 'inputs') {
          evaluate(lv.tree, inv, assign);
          if (lv.tree._val === lv.target) {
            var n = lv.inputs.length;
            for (var idx = 1; idx < (1 << n); idx++) {
              var bits = [];
              for (var b = 0; b < n; b++) bits.push((idx >> (n - 1 - b)) & 1);
              evaluate(lv.tree, bits, assign);
              if (lv.tree._val !== lv.target) { inv = bits; break; }
            }
          }
        }

        levelStart = performance.now();
        api.setStat('關卡', (li + 1) + '/' + LEVELS.length);
        taskEl.innerHTML = '<b>第 ' + (li + 1) + ' 關 · ' + CSE.ui.esc(lv.name) + '</b>　' + lv.note;
        paintDots();
        afterChange();
      }

      api.onResult(function () {
        return {
          stats: [
            { k: '過關', v: cleared + ' / ' + LEVELS.length },
            { k: '驗證失敗', v: wrongTries + ' 次' }
          ]
        };
      });

      loadLevel();
    }
  });
})();
