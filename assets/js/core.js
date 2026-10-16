/* ============================================================
   core.js — DOM 工具 / 儲存 / 設定 / 音效 / 提示 / 遊戲註冊表
   刻意不使用 ES module，讓 index.html 直接雙擊（file://）也能跑
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE = window.CSE || {};

  /* ---------------- 小工具 ---------------- */
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function nf(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  CSE.util = {
    randInt: randInt, pick: pick, shuffle: shuffle,
    clamp: clamp, pad: pad, nf: nf,
    /* 以毫秒為單位的 mm:ss */
    mmss: function (sec) {
      sec = Math.max(0, Math.floor(sec));
      return pad(Math.floor(sec / 60), 1) + ':' + pad(sec % 60, 2);
    }
  };

  /* ---------------- DOM ---------------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') {
          for (var s in v) { if (Object.prototype.hasOwnProperty.call(v, s)) n.style[s] = v[s]; }
        } else if (k === 'dataset') {
          for (var d in v) { if (Object.prototype.hasOwnProperty.call(v, d)) n.dataset[d] = v[d]; }
        } else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
          n.addEventListener(k.slice(2), v);
        } else {
          n.setAttribute(k, v === true ? '' : v);
        }
      }
    }
    if (kids !== null && kids !== undefined) append(n, kids);
    return n;
  }
  function append(parent, kids) {
    if (Array.isArray(kids)) {
      for (var i = 0; i < kids.length; i++) append(parent, kids[i]);
    } else if (kids instanceof Node) {
      parent.appendChild(kids);
    } else if (kids !== null && kids !== undefined && kids !== false) {
      parent.appendChild(document.createTextNode(String(kids)));
    }
  }
  function svgEl(tag, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'text') n.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v);
      }
    }
    return n;
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function corners() {
    return [
      el('i', { class: 'corner tl' }), el('i', { class: 'corner tr' }),
      el('i', { class: 'corner bl' }), el('i', { class: 'corner br' })
    ];
  }

  /* ---------------- 儲存（localStorage + 記憶體後援） ---------------- */
  var PREFIX = 'cse.v1.';
  var memStore = {};
  var lsOK = (function () {
    try {
      var t = PREFIX + '__probe';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return true;
    } catch (e) { return false; }
  })();

  CSE.store = {
    ok: lsOK,
    get: function (key, def) {
      try {
        var raw = lsOK ? window.localStorage.getItem(PREFIX + key) : memStore[key];
        if (raw === null || raw === undefined) return def;
        return JSON.parse(raw);
      } catch (e) { return def; }
    },
    set: function (key, val) {
      try {
        var raw = JSON.stringify(val);
        if (lsOK) window.localStorage.setItem(PREFIX + key, raw);
        else memStore[key] = raw;
        return true;
      } catch (e) { return false; }
    },
    del: function (key) {
      try {
        if (lsOK) window.localStorage.removeItem(PREFIX + key);
        else delete memStore[key];
      } catch (e) { /* ignore */ }
    },
    keys: function () {
      try {
        if (!lsOK) return Object.keys(memStore);
        var out = [];
        for (var i = 0; i < window.localStorage.length; i++) {
          var k = window.localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
        }
        return out;
      } catch (e) { return []; }
    },
    clearAll: function () {
      var self = this;
      this.keys().forEach(function (k) { self.del(k); });
      memStore = {};
    }
  };

  /* ---------------- 設定 ---------------- */
  var DEFAULTS = { sound: true, motion: true, scanline: true, kiosk: false, idle: 75 };

  CSE.settings = {
    _v: null,
    all: function () {
      if (!this._v) {
        var saved = CSE.store.get('settings', {}) || {};
        this._v = {};
        for (var k in DEFAULTS) {
          if (!Object.prototype.hasOwnProperty.call(DEFAULTS, k)) continue;
          this._v[k] = (saved[k] === undefined) ? DEFAULTS[k] : saved[k];
        }
      }
      return this._v;
    },
    get: function (k) { return this.all()[k]; },
    set: function (k, v) {
      this.all()[k] = v;
      CSE.store.set('settings', this._v);
      this.apply();
      if (typeof this.onchange === 'function') this.onchange(k, v);
    },
    toggle: function (k) { this.set(k, !this.get(k)); return this.get(k); },
    apply: function () {
      var v = this.all();
      var r = document.documentElement;
      r.dataset.motion = v.motion ? 'on' : 'off';
      r.dataset.scanline = v.scanline ? 'on' : 'off';
      var b = document.getElementById('btnSound');
      if (b) b.setAttribute('aria-pressed', v.sound ? 'true' : 'false');
    },
    onchange: null
  };

  /* ---------------- 音效（Web Audio，無外部檔案） ---------------- */
  var actx = null;
  var audioBlocked = false;

  function ctx() {
    if (audioBlocked) return null;
    if (actx) return actx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { audioBlocked = true; return null; }
      actx = new AC();
    } catch (e) { audioBlocked = true; return null; }
    return actx;
  }

  function tone(freq, dur, type, vol, delay, slideTo) {
    var c = ctx();
    if (!c) return;
    try {
      var t0 = c.currentTime + (delay || 0);
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol === undefined ? 0.07 : vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    } catch (e) { /* ignore */ }
  }

  var SOUNDS = {
    click: function () { tone(520, 0.045, 'square', 0.045); },
    type:  function () { tone(880, 0.02, 'square', 0.02); },
    tick:  function () { tone(1400, 0.03, 'sine', 0.035); },
    ok:    function () { tone(660, 0.08, 'triangle', 0.07); tone(990, 0.1, 'triangle', 0.06, 0.07); },
    great: function () { tone(660, 0.07, 'triangle', 0.07); tone(880, 0.07, 'triangle', 0.07, 0.06); tone(1320, 0.14, 'triangle', 0.06, 0.12); },
    bad:   function () { tone(200, 0.18, 'sawtooth', 0.055, 0, 90); },
    win:   function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.16, 'triangle', 0.065, i * 0.1); }); },
    over:  function () { [392, 330, 262].forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.06, i * 0.14); }); }
  };

  CSE.sfx = {
    /* 必須在第一次使用者互動時呼叫，否則瀏覽器會擋住音訊 */
    unlock: function () {
      var c = ctx();
      if (c && c.state === 'suspended') { try { c.resume(); } catch (e) { /* ignore */ } }
    },
    play: function (name) {
      if (!CSE.settings.get('sound')) return;
      var fn = SOUNDS[name];
      if (fn) { this.unlock(); fn(); }
    }
  };

  /* ---------------- Toast ---------------- */
  CSE.toast = function (msg, kind, ms) {
    var box = document.getElementById('toasts');
    if (!box) return;
    var t = el('div', { class: 'toast' + (kind ? ' ' + kind : ''), text: msg });
    box.appendChild(t);
    var life = ms || 2200;
    setTimeout(function () {
      t.style.transition = 'opacity .25s';
      t.style.opacity = '0';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, life);
  };

  /* ---------------- Modal ---------------- */
  CSE.modal = function (opts) {
    opts = opts || {};
    var host = document.getElementById('modals');
    var dialog = el('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true' });
    var back = el('div', { class: 'backdrop' }, dialog);

    if (opts.accent) dialog.style.setProperty('--accent', opts.accent);
    if (opts.title) dialog.appendChild(el('h2', { text: opts.title }));
    if (opts.body) append(dialog, opts.body);

    function close() {
      document.removeEventListener('keydown', onKey, true);
      if (back.parentNode) back.parentNode.removeChild(back);
      if (typeof opts.onClose === 'function') opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

    var actions = opts.actions || [{ label: '關閉' }];
    var bar = el('div', { class: 'row', style: { marginTop: '16px', justifyContent: 'flex-end' } });
    actions.forEach(function (a) {
      bar.appendChild(el('button', {
        type: 'button',
        class: 'btn' + (a.primary ? ' btn--primary' : '') + (a.danger ? ' btn--danger' : ''),
        text: a.label,
        onclick: function () {
          CSE.sfx.play('click');
          var keep = a.onClick && a.onClick();
          if (!keep) close();
        }
      }));
    });
    dialog.appendChild(bar);

    back.addEventListener('click', function (e) { if (e.target === back && !opts.sticky) close(); });
    document.addEventListener('keydown', onKey, true);
    host.appendChild(back);

    var focusTarget = dialog.querySelector('input, button.btn--primary, button');
    if (focusTarget) setTimeout(function () { focusTarget.focus(); }, 30);

    return { close: close, dialog: dialog };
  };

  CSE.confirm = function (title, msg, onYes, yesLabel) {
    CSE.modal({
      title: title,
      body: el('p', { class: 'muted', text: msg }),
      actions: [
        { label: yesLabel || '確定', primary: true, danger: true, onClick: onYes },
        { label: '取消' }
      ]
    });
  };

  /* ---------------- 遊戲註冊表 ---------------- */
  CSE.games = [];
  CSE.gameById = {};
  CSE.registerGame = function (def) {
    if (!def || !def.id || typeof def.mount !== 'function') {
      console.error('[CSE] 遊戲註冊失敗，缺少 id 或 mount：', def);
      return;
    }
    if (CSE.gameById[def.id]) {
      console.warn('[CSE] 重複的遊戲 id：' + def.id);
      return;
    }
    def.duration = def.duration || 0;
    def.medals = def.medals || { bronze: 400, silver: 900, gold: 1600 };
    CSE.games.push(def);
    CSE.gameById[def.id] = def;
  };

  CSE.ui = {
    el: el, svg: svgEl, append: append, clear: clear, esc: esc, corners: corners
  };
})();
