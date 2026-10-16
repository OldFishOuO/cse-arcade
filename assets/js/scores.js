/* ============================================================
   scores.js — 排行榜 / 個人最佳 / 徽章 / 資料匯出
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;
  var store = CSE.store;

  var MAX_ROWS = 60;          /* 每款遊戲保留的排行榜筆數 */
  var NAME_MAX = 10;

  /* 暱稱清理：去控制字元、限制長度、擋空白與少數髒字 */
  var BLOCK = ['幹', '靠北', 'fuck', 'shit', 'bitch', 'dick', '婊', '賤'];
  function cleanName(raw) {
    var s = String(raw === null || raw === undefined ? '' : raw);
    /* 移除控制字元與方向覆寫字元（避免排行榜被排版攻擊） */
    s = s.replace(/[\u0000-\u001F\u007F​-‏‪-‮⁠-⁯]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (!s) return '';
    if (s.length > NAME_MAX) s = s.slice(0, NAME_MAX);
    var low = s.toLowerCase();
    for (var i = 0; i < BLOCK.length; i++) {
      if (low.indexOf(BLOCK[i]) >= 0) return '';
    }
    return s;
  }

  function lbKey(gameId) { return 'lb.' + gameId; }
  function statKey(gameId) { return 'stat.' + gameId; }

  var Scores = {
    nameMax: NAME_MAX,
    cleanName: cleanName,

    /* ---- 排行榜 ---- */
    top: function (gameId, n) {
      var rows = store.get(lbKey(gameId), []) || [];
      if (!Array.isArray(rows)) rows = [];
      return rows.slice(0, n || MAX_ROWS);
    },
    submit: function (gameId, name, score, stats) {
      var nm = cleanName(name);
      if (!nm) return { ok: false, reason: 'name' };
      var rows = store.get(lbKey(gameId), []) || [];
      if (!Array.isArray(rows)) rows = [];
      var entry = { n: nm, s: Math.round(score), t: Date.now(), m: stats || null };
      rows.push(entry);
      rows.sort(function (a, b) { return (b.s - a.s) || (a.t - b.t); });
      rows = rows.slice(0, MAX_ROWS);
      store.set(lbKey(gameId), rows);
      store.set('lastName', nm);
      var rank = rows.indexOf(entry) + 1;
      return { ok: true, rank: rank, total: rows.length };
    },
    lastName: function () { return store.get('lastName', '') || ''; },

    /* ---- 個人紀錄（不需暱稱，自動累計） ---- */
    recordResult: function (gameId, score) {
      var st = store.get(statKey(gameId), { best: 0, plays: 0, sum: 0 }) || {};
      st.best = Math.max(st.best || 0, Math.round(score));
      st.plays = (st.plays || 0) + 1;
      st.sum = (st.sum || 0) + Math.round(score);
      store.set(statKey(gameId), st);
      return st;
    },
    stat: function (gameId) {
      return store.get(statKey(gameId), { best: 0, plays: 0, sum: 0 }) || { best: 0, plays: 0, sum: 0 };
    },
    best: function (gameId) { return this.stat(gameId).best || 0; },
    plays: function (gameId) { return this.stat(gameId).plays || 0; },

    /* 總分 = 每款遊戲的最佳分數加總（鼓勵把七款都玩過） */
    total: function () {
      var self = this, sum = 0;
      CSE.games.forEach(function (g) { sum += self.best(g.id); });
      return sum;
    },
    totalPlays: function () {
      var self = this, sum = 0;
      CSE.games.forEach(function (g) { sum += self.plays(g.id); });
      return sum;
    },

    /* ---- 獎牌 / 徽章 ---- */
    medalOf: function (gameId, score) {
      var g = CSE.gameById[gameId];
      if (!g) return null;
      var m = g.medals;
      if (score >= m.gold) return 'gold';
      if (score >= m.silver) return 'silver';
      if (score >= m.bronze) return 'bronze';
      return null;
    },
    medalIcon: function (medal) {
      return medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : '';
    },
    rankTitle: function (gameId, score) {
      var m = this.medalOf(gameId, score);
      var g = CSE.gameById[gameId];
      var titles = (g && g.titles) || ['體驗組', '新手上路', '熟練工程師', '系上傳說'];
      return m === 'gold' ? titles[3] : m === 'silver' ? titles[2] : m === 'bronze' ? titles[1] : titles[0];
    },

    badges: function () {
      var self = this;
      var out = [];
      CSE.games.forEach(function (g) {
        var best = self.best(g.id);
        var medal = self.medalOf(g.id, best);
        out.push({
          id: 'g.' + g.id,
          icon: medal ? self.medalIcon(medal) : '▢',
          name: g.name,
          note: medal
            ? self.rankTitle(g.id, best) + '（' + CSE.util.nf(best) + ' 分）'
            : (best > 0 ? '還差 ' + CSE.util.nf(g.medals.bronze - best) + ' 分拿銅牌' : '尚未挑戰'),
          got: !!medal
        });
      });

      var playedAll = CSE.games.every(function (g) { return self.plays(g.id) > 0; });
      var allBronze = CSE.games.every(function (g) { return self.medalOf(g.id, self.best(g.id)); });
      var allGold = CSE.games.every(function (g) { return self.medalOf(g.id, self.best(g.id)) === 'gold'; });
      var total = self.total();
      var th = (CSE.config.prize && CSE.config.prize.threshold) || 3000;

      out.push({ id: 'meta.all', icon: '🎒', name: '全系通識', note: '七款遊戲都玩過一次', got: playedAll });
      out.push({ id: 'meta.bronze', icon: '🔧', name: '修完必修', note: '每款至少拿到銅牌', got: allBronze });
      out.push({ id: 'meta.prize', icon: '🎁', name: '兌換資格', note: '總分達 ' + CSE.util.nf(th) + ' 分', got: total >= th });
      out.push({ id: 'meta.gold', icon: '👑', name: '系主任認證', note: '每款都拿到金牌', got: allGold });
      return out;
    },

    /* ---- 攤位結束後的資料匯出 ---- */
    exportCsv: function () {
      var rows = [['game_id', 'game_name', 'rank', 'nickname', 'score', 'time_iso']];
      var self = this;
      CSE.games.forEach(function (g) {
        self.top(g.id).forEach(function (r, i) {
          rows.push([g.id, g.name, i + 1, r.n, r.s, new Date(r.t).toISOString()]);
        });
      });
      var csv = rows.map(function (r) {
        return r.map(function (c) {
          var s = String(c);
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(',');
      }).join('\r\n');
      /* BOM：讓 Excel 正確讀中文 */
      return '﻿' + csv;
    },
    summary: function () {
      var self = this;
      return CSE.games.map(function (g) {
        var rows = self.top(g.id);
        return {
          id: g.id, name: g.name,
          plays: self.plays(g.id),
          entries: rows.length,
          best: rows.length ? rows[0].s : 0,
          avg: rows.length ? Math.round(rows.reduce(function (s, r) { return s + r.s; }, 0) / rows.length) : 0
        };
      });
    },
    resetAll: function () { store.clearAll(); CSE.settings._v = null; }
  };

  CSE.scores = Scores;

  /* 下載檔案（file:// 與 http:// 都可用） */
  CSE.download = function (filename, text, mime) {
    try {
      var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 150);
      return true;
    } catch (e) {
      CSE.toast('這個瀏覽器無法下載檔案', 'bad');
      return false;
    }
  };
})();
