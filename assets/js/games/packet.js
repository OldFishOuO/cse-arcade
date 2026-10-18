/* ============================================================
   遊戲 6：封包路由 — 幫封包挑一條延遲最低的路
   教的是：網路拓撲、最短路徑（Dijkstra）、ping 的延遲是什麼
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  var LEVELS = [
    { cols: 3, rows: 2 },
    { cols: 4, rows: 2 },
    { cols: 4, rows: 3 },
    { cols: 5, rows: 3 },
    { cols: 5, rows: 3 }
  ];

  var W = 700, MARGIN = 58, ROW_H = 104;
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function buildGraph(cols, rows) {
    for (var attempt = 0; attempt < 80; attempt++) {
      var n = cols * rows;
      var H = MARGIN * 2 + (rows - 1) * ROW_H;
      var nodes = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          nodes.push({
            id: nodes.length,
            name: LETTERS.charAt(nodes.length % 26),
            x: MARGIN + (cols === 1 ? 0 : c * (W - MARGIN * 2) / (cols - 1)) + CSE.util.randInt(-12, 12),
            y: MARGIN + (rows === 1 ? 0 : r * ROW_H) + CSE.util.randInt(-12, 12),
            c: c, r: r
          });
        }
      }
      var idx = function (c, r) { return r * cols + c; };
      var edges = [];
      function addEdge(a, b) {
        edges.push({ a: a, b: b, w: CSE.util.randInt(1, 9) });
      }
      for (var r2 = 0; r2 < rows; r2++) {
        for (var c2 = 0; c2 < cols; c2++) {
          if (c2 + 1 < cols && Math.random() > 0.15) addEdge(idx(c2, r2), idx(c2 + 1, r2));
          if (r2 + 1 < rows && Math.random() > 0.25) addEdge(idx(c2, r2), idx(c2, r2 + 1));
          if (c2 + 1 < cols && r2 + 1 < rows && Math.random() > 0.55) addEdge(idx(c2, r2), idx(c2 + 1, r2 + 1));
          if (c2 + 1 < cols && r2 - 1 >= 0 && Math.random() > 0.65) addEdge(idx(c2, r2), idx(c2 + 1, r2 - 1));
        }
      }

      var adj = nodes.map(function () { return []; });
      edges.forEach(function (e, i) {
        adj[e.a].push({ to: e.b, w: e.w, e: i });
        adj[e.b].push({ to: e.a, w: e.w, e: i });
      });

      /* 連通性檢查 */
      var seen = [0], stack = [0];
      var visited = new Array(n); visited[0] = true;
      while (stack.length) {
        var u = stack.pop();
        adj[u].forEach(function (x) {
          if (!visited[x.to]) { visited[x.to] = true; stack.push(x.to); seen.push(x.to); }
        });
      }
      if (seen.length !== n) continue;

      /* 起點在最左欄、終點在最右欄，且不能相鄰（否則一步就到） */
      var src = idx(0, CSE.util.randInt(0, rows - 1));
      var dst = idx(cols - 1, CSE.util.randInt(0, rows - 1));
      if (adj[src].some(function (x) { return x.to === dst; })) continue;

      var best = dijkstra(nodes.length, adj, src, dst);
      if (!best || best.path.length < 3) continue;

      return { nodes: nodes, edges: edges, adj: adj, src: src, dst: dst, best: best, w: W, h: H };
    }
    return null;
  }

  function dijkstra(n, adj, src, dst) {
    var INF = Infinity;
    var dist = new Array(n), prev = new Array(n), used = new Array(n);
    for (var i = 0; i < n; i++) { dist[i] = INF; prev[i] = -1; used[i] = false; }
    dist[src] = 0;
    for (var k = 0; k < n; k++) {
      var u = -1, bd = INF;
      for (var j = 0; j < n; j++) if (!used[j] && dist[j] < bd) { bd = dist[j]; u = j; }
      if (u < 0) break;
      used[u] = true;
      if (u === dst) break;
      for (var a = 0; a < adj[u].length; a++) {
        var e = adj[u][a];
        if (dist[u] + e.w < dist[e.to]) { dist[e.to] = dist[u] + e.w; prev[e.to] = u; }
      }
    }
    if (dist[dst] === INF) return null;
    var path = [], cur = dst;
    while (cur !== -1) { path.unshift(cur); cur = prev[cur]; }
    return { cost: dist[dst], path: path };
  }

  CSE.registerGame({
    id: 'packet',
    name: '封包路由',
    tag: '計算機網路 · ROUTING',
    icon: '⇄',
    accent: 'var(--pink)',
    level: '普通',
    blurb: '你按下 Enter 之後，資料要經過好幾台路由器。線上的數字是延遲，幫封包找出最快的路。',
    how: [
      '綠色是起點、紫色是目標，線上的數字是那一段的延遲（毫秒）。',
      '從起點開始，一台一台點相鄰的路由器接出路徑。',
      '點路徑上最後一台可以回退一步。',
      '走到目標後按「送出封包」。走到理論最短路徑有大獎，共 5 關。'
    ],
    controls: '點節點接路徑；點最後一個節點可回退',
    duration: 150,
    medals: { bronze: 700, silver: 1300, gold: 2000 },
    titles: ['體驗組', '見習網管', '路由達人', '網路架構師'],
    knowledge: {
      title: '你的封包真的在找最短路',
      lines: [
        '網路上的路由器會互相交換「我到哪裡要多久」，再用 Dijkstra 這類演算法算最短路徑。',
        'ping 顯示的毫秒數，就是封包來回一趟累加起來的延遲。',
        'traceroute 這個指令可以把封包實際經過的每一站印出來，你可以回家試試。',
        '同樣的最短路徑演算法也用在 Google Maps 導航、遊戲 AI 尋路上。'
      ]
    },

    mount: function (stage, api) {
      var li = 0;
      var G = null, path = [], locked = false, levelStart = 0;
      var perfect = 0, totalDiff = 0;
      var anim = null;

      var canvas = api.el('div', { class: 'pk-canvas' });
      var costEl = api.el('b', { text: '0' });
      var bestEl = api.el('b', { text: '?' });
      var btnSend = api.el('button', { type: 'button', class: 'btn btn--primary', text: '送出封包', disabled: true, onclick: send });
      var btnClear = api.el('button', { type: 'button', class: 'btn btn--sm', text: '重選路徑', onclick: function () {
        if (locked || !G) return;
        path = [G.src];
        api.sfx.play('click');
        render();
      } });

      stage.appendChild(api.el('div', { class: 'pk-wrap' }, [
        canvas,
        api.el('div', { class: 'statlist pk-info' }, [
          api.el('div', {}, ['目前延遲', costEl]),
          api.el('div', {}, ['最短可能', bestEl])
        ]),
        api.el('div', { class: 'row', style: { justifyContent: 'center' } }, [btnSend, btnClear])
      ]));

      function pathCost() {
        var sum = 0;
        for (var i = 1; i < path.length; i++) {
          var link = G.adj[path[i - 1]].filter(function (x) { return x.to === path[i]; })[0];
          if (link) sum += link.w;
        }
        return sum;
      }

      function edgeInPath(e) {
        for (var i = 1; i < path.length; i++) {
          if ((path[i - 1] === e.a && path[i] === e.b) || (path[i - 1] === e.b && path[i] === e.a)) return true;
        }
        return false;
      }
      function edgeInBest(e) {
        var bp = G.best.path;
        for (var i = 1; i < bp.length; i++) {
          if ((bp[i - 1] === e.a && bp[i] === e.b) || (bp[i - 1] === e.b && bp[i] === e.a)) return true;
        }
        return false;
      }

      var svgRef = null, pktRef = null;

      function render(showBest) {
        var last = path[path.length - 1];
        var reach = {};
        if (!locked) {
          G.adj[last].forEach(function (x) { if (path.indexOf(x.to) < 0) reach[x.to] = true; });
        }

        var svg = api.svg('svg', { viewBox: '0 0 ' + G.w + ' ' + Math.round(G.h), role: 'img', 'aria-label': '網路拓撲圖' });

        G.edges.forEach(function (e) {
          var A = G.nodes[e.a], B = G.nodes[e.b];
          var cls = 'edge' + (edgeInPath(e) ? ' used' : (showBest && edgeInBest(e) ? ' best' : ''));
          svg.appendChild(api.svg('line', { class: cls, x1: A.x, y1: A.y, x2: B.x, y2: B.y }));
        });
        G.edges.forEach(function (e) {
          var A = G.nodes[e.a], B = G.nodes[e.b];
          var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          svg.appendChild(api.svg('rect', { class: 'ew-bg', x: mx - 10, y: my - 9, width: 20, height: 18, rx: 4 }));
          svg.appendChild(api.svg('text', { class: 'ew', x: mx, y: my, text: String(e.w) }));
        });

        G.nodes.forEach(function (nd) {
          var cls = 'node';
          if (nd.id === G.src) cls += ' src';
          else if (nd.id === G.dst) cls += ' dst';
          if (path.indexOf(nd.id) >= 0) cls += ' path';
          if (reach[nd.id]) cls += ' reach';
          var g = api.svg('g', { class: cls, tabindex: locked ? null : '0', role: 'button',
            'aria-label': '路由器 ' + nd.name });
          g.appendChild(api.svg('circle', { cx: nd.x, cy: nd.y, r: 22 }));
          g.appendChild(api.svg('text', { x: nd.x, y: nd.y, text: nd.name }));
          if (nd.id === G.src) g.appendChild(api.svg('text', { class: 'ew', x: nd.x, y: nd.y - 34, text: '起點' }));
          if (nd.id === G.dst) g.appendChild(api.svg('text', { class: 'ew', x: nd.x, y: nd.y - 34, text: '目標' }));
          if (!locked) {
            g.addEventListener('click', function () { tap(nd.id); });
            g.addEventListener('keydown', function (ev) {
              if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tap(nd.id); }
            });
          }
          svg.appendChild(g);
        });

        pktRef = api.svg('circle', { class: 'pkt', r: 7, cx: -50, cy: -50 });
        svg.appendChild(pktRef);

        CSE.ui.clear(canvas);
        canvas.appendChild(svg);
        svgRef = svg;

        var c = pathCost();
        costEl.textContent = String(c);
        bestEl.textContent = showBest ? String(G.best.cost) : '?';
        btnSend.disabled = locked || path[path.length - 1] !== G.dst;

        /* 死路提醒：沒有任何可以往前走的鄰居，又還沒到目標 */
        if (!locked && last !== G.dst && !Object.keys(reach).length) {
          api.hint('走進死路了 — 點路徑上任何一台可以退回去，或按「重選路徑」。', 'bad');
        }
      }

      function tap(id) {
        if (locked) return;
        var last = path[path.length - 1];
        /* 點路徑上的節點 = 退回那一步（點最後一台就是退一步） */
        var at = path.indexOf(id);
        if (at >= 0) {
          if (path.length === 1) return;
          path.length = (at === path.length - 1) ? at : at + 1;
          if (!path.length) path = [G.src];
          api.sfx.play('click');
          render();
          return;
        }
        var ok = G.adj[last].some(function (x) { return x.to === id; });
        if (!ok) {
          api.hint('路由器 ' + G.nodes[last].name + ' 和 ' + G.nodes[id].name + ' 之間沒有直接連線', 'bad');
          api.sfx.play('bad');
          return;
        }
        path.push(id);
        api.sfx.play('click');
        api.hint(path[path.length - 1] === G.dst ? '到目標了！可以送出封包' : '', 'good');
        render();
      }

      function send() {
        if (locked || path[path.length - 1] !== G.dst) return;
        locked = true;
        btnSend.disabled = true;
        var cost = pathCost();
        var diff = cost - G.best.cost;
        totalDiff += diff;

        /* 封包動畫 */
        var pts = path.map(function (i) { return G.nodes[i]; });
        anim = { pts: pts, seg: 0, t: 0 };

        api.after(Math.min(1400, 320 * (pts.length - 1) + 120), function () {
          anim = null;
          var spent = (performance.now() - levelStart) / 1000;
          var speed = Math.max(0, Math.round((22 - spent) * 5));
          var gain;
          if (diff === 0) { gain = 300 + speed + 100; perfect++; }
          else gain = Math.max(50, 300 - diff * 45) + Math.round(speed / 2);
          api.addScore(gain);
          api.sfx.play(diff === 0 ? 'great' : 'ok');
          api.hint(diff === 0
            ? '完美！延遲 ' + cost + ' ms 就是理論最短　+' + gain + ' 分'
            : '延遲 ' + cost + ' ms，最短是 ' + G.best.cost + ' ms（綠色虛線）　+' + gain + ' 分',
            diff === 0 ? 'good' : 'bad');
          render(true);

          li++;
          if (li >= LEVELS.length) {
            var bonus = Math.round(api.timeLeft() * 5);
            api.addScore(bonus);
            api.after(2000, function () {
              api.finish({
                reason: 'cleared',
                stats: [
                  { k: '完美路徑', v: perfect + ' / ' + LEVELS.length },
                  { k: '多繞', v: totalDiff + ' ms' },
                  { k: '剩餘時間加分', v: '+' + bonus }
                ]
              });
            });
          } else {
            api.after(2200, loadLevel);
          }
        });
      }

      function loadLevel() {
        var spec = LEVELS[li];
        G = buildGraph(spec.cols, spec.rows);
        if (!G) {   /* 極端情況產不出圖，退回最簡單的設定 */
          G = buildGraph(3, 2);
          if (!G) { api.hint('地圖產生失敗，請按重來', 'bad'); return; }
        }
        path = [G.src];
        locked = false;
        levelStart = performance.now();
        api.setStat('關卡', (li + 1) + '/' + LEVELS.length);
        api.hint('從綠色起點開始，一台一台點過去');
        render(false);
      }

      api.onResult(function () {
        return {
          stats: [
            { k: '完成關卡', v: li + ' / ' + LEVELS.length },
            { k: '完美路徑', v: perfect },
            { k: '總共多繞', v: totalDiff + ' ms' }
          ]
        };
      });

      loadLevel();

      return {
        onFrame: function (dt) {
          if (!anim || !pktRef) return;
          anim.t += dt * 3.2;
          while (anim.t >= 1 && anim.seg < anim.pts.length - 2) { anim.t -= 1; anim.seg++; }
          var a = anim.pts[anim.seg], b = anim.pts[Math.min(anim.seg + 1, anim.pts.length - 1)];
          var k = Math.min(1, anim.t);
          pktRef.setAttribute('cx', a.x + (b.x - a.x) * k);
          pktRef.setAttribute('cy', a.y + (b.y - a.y) * k);
        }
      };
    }
  });
})();
