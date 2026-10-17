/* ============================================================
   遊戲 4：排序大師 — 用最少的交換次數把長條由小到大排好
   教的是：排序、置換環（最少交換次數 = n − 環數）
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  var ROUNDS = [5, 6, 7];

  /* 最少交換次數（任意兩兩交換）= n − 置換環數，需要元素互不相同 */
  function minSwaps(arr) {
    var sorted = arr.slice().sort(function (a, b) { return a - b; });
    var pos = {};
    sorted.forEach(function (v, i) { pos[v] = i; });
    var seen = new Array(arr.length);
    var swaps = 0;
    for (var i = 0; i < arr.length; i++) {
      if (seen[i]) continue;
      var j = i, len = 0;
      while (!seen[j]) { seen[j] = true; j = pos[arr[j]]; len++; }
      swaps += len - 1;
    }
    return swaps;
  }

  function isSorted(a) {
    for (var i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
    return true;
  }

  /* 產生互不相同、尚未排好、且至少要 2 次交換的題目 */
  function makeArray(n) {
    for (var attempt = 0; attempt < 200; attempt++) {
      var pool = [];
      while (pool.length < n) {
        var v = CSE.util.randInt(5, 99);
        if (pool.indexOf(v) < 0) pool.push(v);
      }
      var arr = CSE.util.shuffle(pool);
      if (!isSorted(arr) && minSwaps(arr) >= 2) return arr;
    }
    return [42, 17, 93, 8, 55].slice(0, n);
  }

  CSE.registerGame({
    id: 'sort',
    name: '排序大師',
    tag: '演算法 · SORTING',
    icon: '↕',
    accent: 'var(--cyan)',
    blurb: '把長條由小到大排好 — 聽起來簡單，但要用「最少的交換次數」就是演算法的問題了。',
    how: [
      '點一根長條選起來，再點另一根就會交換兩者。',
      '目標：由左到右從小排到大。',
      '每關都有「理論最少交換次數」，超過會扣分，剛好達標有大獎。',
      '共三關，長條會越來越多。'
    ],
    controls: '點兩根長條交換；再點同一根可取消選取',
    duration: 150,
    medals: { bronze: 700, silver: 1250, gold: 1850 },
    titles: ['體驗組', '排序學徒', '交換達人', '演算法大師'],
    knowledge: {
      title: '為什麼「最少交換次數」算得出來？',
      lines: [
        '把「誰該去哪裡」畫成箭頭，會形成一圈一圈的環。長度 k 的環需要 k−1 次交換。',
        '所以最少交換次數 = 元素個數 − 環的數量。這是離散數學裡的置換（permutation）理論。',
        '真正的排序演算法比的是「比較次數」：泡泡排序 O(n²)、快速排序平均 O(n log n)。',
        '一百萬筆資料，兩者差距大約是 50000 倍 — 這就是資工系「演算法」在乎的事。'
      ]
    },

    mount: function (stage, api) {
      var round = 0;
      var arr = [], sortedRef = [], par = 0, swaps = 0, sel = -1;
      var bars = [];
      var roundStart = 0, busy = false;
      var totalSwaps = 0, perfect = 0;

      var barsBox = api.el('div', { class: 'bars' });
      var parEl = api.el('b', { text: '0' });
      var swEl = api.el('b', { text: '0' });
      var info = api.el('div', { class: 'sm-info' }, [
        api.el('div', { class: 'statlist' }, [
          api.el('div', {}, ['目標最少交換', parEl]),
          api.el('div', {}, ['你已交換', swEl])
        ])
      ]);
      var btnReset = api.el('button', {
        type: 'button', class: 'btn btn--sm', text: '這關重排（−50）',
        onclick: function () {
          if (busy) return;
          api.addScore(-50);
          api.sfx.play('bad');
          loadRound(ROUNDS[round]);
        }
      });

      stage.appendChild(api.el('div', { class: 'sm-wrap' }, [
        barsBox,
        info,
        api.el('div', { class: 'row', style: { justifyContent: 'center' } }, [btnReset])
      ]));

      /* 用像素而不是百分比：.bars 是 flex 伸縮來的高度，
         在 flex 容器裡百分比高度不保證解析得出來（實測會縮成內容高度）。 */
      function barPx(v) {
        var box = barsBox.clientHeight || 240;
        var max = Math.max.apply(null, arr) || 1;
        return Math.round(box * (0.24 + (v / max) * 0.72));
      }

      function paintBar(i) {
        var b = bars[i];
        b.textContent = String(arr[i]);
        b.style.height = barPx(arr[i]) + 'px';
        b.classList.toggle('sel', sel === i);
        b.classList.toggle('ok', arr[i] === sortedRef[i]);
        b.setAttribute('aria-label', '第 ' + (i + 1) + ' 根，數值 ' + arr[i]);
      }
      function paintAll() { for (var i = 0; i < arr.length; i++) paintBar(i); }

      function click(i) {
        if (busy) return;
        if (sel === i) { sel = -1; api.sfx.play('click'); paintAll(); return; }
        if (sel < 0) { sel = i; api.sfx.play('click'); paintAll(); return; }
        var a = sel; sel = -1;
        var t = arr[a]; arr[a] = arr[i]; arr[i] = t;
        swaps++; totalSwaps++;
        swEl.textContent = String(swaps);
        api.sfx.play('type');
        paintAll();
        if (isSorted(arr)) roundDone();
        else if (swaps > par) api.hint('已經超過最少次數 ' + (swaps - par) + ' 次，但還是可以排完。', 'bad');
        else api.hint('還剩 ' + (par - swaps) + ' 次交換額度', '');
      }

      function roundDone() {
        busy = true;
        var over = Math.max(0, swaps - par);
        var spent = (performance.now() - roundStart) / 1000;
        var speed = Math.max(0, Math.round((30 - spent) * 4));
        var gain = Math.max(40, 230 - over * 35) + speed;
        if (over === 0) { gain += 120; perfect++; }
        api.addScore(gain);
        api.sfx.play('great');
        api.hint(over === 0
          ? '完美！剛好 ' + par + ' 次交換　+' + gain + ' 分（含完美獎勵）'
          : '排好了！用了 ' + swaps + ' 次（最少 ' + par + ' 次）　+' + gain + ' 分', 'good');
        round++;
        if (round >= ROUNDS.length) {
          var bonus = Math.round(api.timeLeft() * 5);
          api.addScore(bonus);
          api.after(900, function () {
            api.finish({
              reason: 'cleared',
              stats: [
                { k: '完美關卡', v: perfect + ' / ' + ROUNDS.length },
                { k: '總交換', v: totalSwaps + ' 次' },
                { k: '剩餘時間加分', v: '+' + bonus }
              ]
            });
          });
          return;
        }
        api.after(1100, function () { loadRound(ROUNDS[round]); });
      }

      function loadRound(n) {
        busy = false;
        sel = -1;
        swaps = 0;
        arr = makeArray(n);
        sortedRef = arr.slice().sort(function (a, b) { return a - b; });
        par = minSwaps(arr);
        parEl.textContent = String(par);
        swEl.textContent = '0';
        api.setStat('關卡', (round + 1) + '/' + ROUNDS.length);
        api.hint('點兩根長條交換它們的位置');

        CSE.ui.clear(barsBox);
        bars = [];
        for (var i = 0; i < n; i++) {
          var b = api.el('button', { type: 'button', class: 'bar' });
          (function (idx) { b.addEventListener('click', function () { click(idx); }); })(i);
          bars.push(b);
          barsBox.appendChild(b);
        }
        paintAll();
        roundStart = performance.now();
      }

      /* 視窗大小改變（轉向、全螢幕）時重算高度 */
      api.on(window, 'resize', function () { if (bars.length) paintAll(); });

      api.onResult(function () {
        return {
          stats: [
            { k: '完成關卡', v: round + ' / ' + ROUNDS.length },
            { k: '完美關卡', v: perfect },
            { k: '總交換', v: totalSwaps + ' 次' }
          ]
        };
      });

      loadRound(ROUNDS[0]);
    }
  });
})();
