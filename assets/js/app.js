/* ============================================================
   app.js — 路由 / 首頁 / 排行榜 / 關於 / 設定 / 背景特效 / 攤位模式
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;
  var ui = CSE.ui, el = ui.el;
  var cfg = CSE.config;

  var view = document.getElementById('view');
  var navEl = document.getElementById('nav');
  var totalChip = document.getElementById('totalChip');

  /* 首頁卡片順序：先用「資工系大誤解」當開場，再往技術深處走 */
  var ORDER = ['myth', 'binary', 'bughunt', 'logic', 'sort', 'packet', 'typing'];
  function orderedGames() {
    var out = [];
    ORDER.forEach(function (id) { if (CSE.gameById[id]) out.push(CSE.gameById[id]); });
    CSE.games.forEach(function (g) { if (out.indexOf(g) < 0) out.push(g); });
    return out;
  }

  /* 每個頁面自己的清理工作（打字機、計時器…） */
  var pageCleanups = [];
  function onLeave(fn) { pageCleanups.push(fn); }
  function cleanPage() {
    var list = pageCleanups; pageCleanups = [];
    list.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
  }

  /* ---------------- 背景矩陣雨 ---------------- */
  var rain = (function () {
    var cv = document.getElementById('bgfx');
    var ctx = cv.getContext ? cv.getContext('2d') : null;
    var cols = [], W = 0, H = 0, raf = 0, on = false, acc = 0;
    var GLYPHS = '01{}[]()<>/\\=+-*&|!?;:ABCDEF01'.split('');

    function resize() {
      if (!ctx) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.floor(W * dpr);
      cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = '13px monospace';
      var n = Math.ceil(W / 18);
      cols = [];
      for (var i = 0; i < n; i++) cols.push(Math.random() * -H);
    }

    function step() {
      if (!on) return;
      raf = requestAnimationFrame(step);
      acc++;
      if (acc % 2) return;                     /* 降到約 30fps，省電 */
      ctx.fillStyle = 'rgba(6,10,15,0.10)';
      ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < cols.length; i++) {
        var y = cols[i];
        var x = i * 18 + 3;
        ctx.fillStyle = 'rgba(57,255,136,0.82)';
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y);
        ctx.fillStyle = 'rgba(56,217,255,0.22)';
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y - 17);
        cols[i] = y > H + Math.random() * 400 ? 0 : y + 17;
      }
    }

    return {
      start: function () {
        if (!ctx || on || !CSE.settings.get('motion')) return;
        on = true; resize(); step();
      },
      stop: function () {
        on = false;
        cancelAnimationFrame(raf);
        if (ctx) ctx.clearRect(0, 0, W, H);
      },
      resize: function () { if (on) resize(); }
    };
  })();

  window.addEventListener('resize', function () { rain.resize(); });

  /* ---------------- 打字機 ---------------- */
  function typewriter(target, lines, done) {
    if (!CSE.settings.get('motion')) {
      lines.forEach(function (t) { target.appendChild(el('div', { html: t })); });
      if (done) done();
      return function () {};
    }
    var li = 0, ci = 0, cur = null, timer = 0, stopped = false;
    var plain = lines.map(function (t) { return t.replace(/<[^>]*>/g, ''); });
    function tick() {
      if (stopped) return;
      if (li >= lines.length) { if (done) done(); return; }
      if (!cur) { cur = el('div', {}); target.appendChild(cur); }
      ci++;
      cur.textContent = plain[li].slice(0, ci);
      if (ci >= plain[li].length) {
        cur.innerHTML = lines[li];     /* 打完這行才換成帶標記的版本 */
        li++; ci = 0; cur = null;
        timer = setTimeout(tick, 220);
      } else {
        timer = setTimeout(tick, 16);
      }
    }
    tick();
    return function () { stopped = true; clearTimeout(timer); };
  }

  /* ---------------- 首頁 ---------------- */
  function screenHome() {
    rain.start();
    var total = CSE.scores.total();
    var played = CSE.games.filter(function (g) { return CSE.scores.plays(g.id) > 0; }).length;
    var badges = CSE.scores.badges().filter(function (b) { return b.got; }).length;

    var termBody = el('div', { class: 'term-body' });
    var hero = el('div', { class: 'hero' }, el('div', { class: 'term' }, [
      el('div', { class: 'term-bar' }, [
        el('i', { class: 'term-dot r' }), el('i', { class: 'term-dot y' }), el('i', { class: 'term-dot g' }),
        el('span', { text: 'iecs-arcade — bash — 80×24' })
      ]),
      termBody
    ]));

    var typedBox = el('div', { class: 'faint', style: { fontSize: '13px', marginBottom: '10px' } });
    termBody.appendChild(typedBox);
    var stop = typewriter(typedBox, [
      '<span class="prompt">whoami</span>',
      '<span style="color:var(--green)">' + ui.esc(cfg.school + ' ' + cfg.dept) + '</span>',
      '<span class="prompt">./start-arcade.sh</span>'
    ], function () {
      termBody.appendChild(el('h1', { text: cfg.title }));
      termBody.appendChild(el('p', { class: 'hero-sub', text: cfg.tagline }));
      termBody.appendChild(el('div', { class: 'hero-stats' }, [
        el('div', { class: 'hero-stat' }, [el('b', { text: CSE.util.nf(total) }), el('span', { text: '你的總分' })]),
        el('div', { class: 'hero-stat' }, [el('b', { text: played + ' / ' + CSE.games.length }), el('span', { text: '玩過的遊戲' })]),
        el('div', { class: 'hero-stat' }, [el('b', { text: String(badges) }), el('span', { text: '拿到的徽章' })])
      ]));
    });
    onLeave(stop);

    var cards = el('div', { class: 'grid-games' });
    /* 都沒玩過的人，第一張卡標成「推薦先玩」，給一個明確的起點 */
    var firstTime = CSE.scores.totalPlays() === 0;
    orderedGames().forEach(function (g, gi) {
      var best = CSE.scores.best(g.id);
      var medal = CSE.scores.medalOf(g.id, best);
      var pick = firstTime && gi === 0;
      var card = el('button', {
        type: 'button',
        class: 'gcard' + (pick ? ' gcard--pick' : ''),
        style: { '--accent': g.accent || 'var(--green)' }
      }, [
        pick ? el('span', { class: 'gcard-pick', text: '推薦先玩' }) : null,
        el('div', { class: 'gcard-top' }, [
          el('div', { class: 'gcard-icon', html: g.icon || '#' }),
          el('div', {}, [
            el('div', { class: 'gcard-name', text: g.name }),
            el('div', { class: 'gcard-tag', text: g.tag || '' })
          ])
        ]),
        el('div', { class: 'gcard-blurb', text: g.blurb }),
        el('div', { class: 'gcard-foot' }, [
          el('span', { class: 'gcard-best', html: best ? ('最佳 <b>' + CSE.util.nf(best) + '</b>') : '還沒玩過' }),
          el('span', { class: 'medal', text: medal ? CSE.scores.medalIcon(medal) : (g.duration ? g.duration + ' 秒' : '10 題') })
        ])
      ]);
      card.style.setProperty('--accent', g.accent || 'var(--green)');
      card.addEventListener('click', function () {
        CSE.sfx.unlock();
        CSE.sfx.play('click');
        location.hash = '#/g/' + g.id;
      });
      cards.appendChild(card);
    });

    var blocks = [hero];

    if (cfg.prize && cfg.prize.enabled) {
      var reached = total >= cfg.prize.threshold;
      blocks.push(el('div', { class: 'notice' }, [
        el('span', { class: 'ic', text: reached ? '🎁' : '◆' }),
        el('div', {}, [
          el('b', { text: reached ? '你已經達到兌換門檻了！' : cfg.prize.text }),
          el('div', { class: 'faint', style: { fontSize: '12px' } },
            reached ? '把這個畫面拿給攤位人員看就可以兌換。'
                    : '目前 ' + CSE.util.nf(total) + ' / ' + CSE.util.nf(cfg.prize.threshold) +
                      ' 分，還差 ' + CSE.util.nf(cfg.prize.threshold - total) + ' 分' +
                      '　·　總分 = 七款各自的最佳分數加總，七款都玩過最快')
        ])
      ]));
    }

    blocks.push(cards);

    /* 徽章 */
    var bg = el('div', { class: 'badges' }, CSE.scores.badges().map(function (b) {
      return el('div', { class: 'badge' + (b.got ? '' : ' off') }, [
        el('span', { class: 'bi', text: b.icon }),
        el('div', {}, [el('b', { text: b.name }), el('span', { text: b.note })])
      ]);
    }));
    blocks.push(el('div', { class: 'panel' }, [
      ui.corners(),
      el('div', { class: 'kicker', text: 'ACHIEVEMENTS' }),
      el('h2', { text: '關卡護照' }),
      el('p', { class: 'muted', style: { fontSize: '13px' }, text: '每款遊戲達到分數門檻就能拿到銅、銀、金牌。七款全破看看會發生什麼事。' }),
      bg
    ]));

    ui.clear(view);
    ui.append(view, blocks);
  }

  /* ---------------- 遊戲頁 ---------------- */
  function screenGame(id) {
    rain.stop();
    var def = CSE.gameById[id];
    if (!def) { CSE.toast('找不到這個遊戲', 'bad'); location.hash = '#/'; return; }
    ui.clear(view);
    var mount = el('div', {});
    view.appendChild(mount);
    CSE.host.start(def, mount);
  }

  /* ---------------- 排行榜 ---------------- */
  function screenBoard(params) {
    rain.stop();
    var games = orderedGames();
    var active = params.g && CSE.gameById[params.g] ? params.g : games[0].id;

    var tabs = el('div', { class: 'lb-tabs' });
    var tableBox = el('div', {});

    function paint() {
      var g = CSE.gameById[active];
      var rows = CSE.scores.top(active, 10);
      ui.clear(tableBox);
      tableBox.appendChild(el('div', { class: 'row spread', style: { marginBottom: '10px' } }, [
        el('div', {}, [
          el('div', { class: 'kicker', text: g.tag || '' }),
          el('h2', { text: g.name + ' 排行榜' })
        ]),
        el('a', { class: 'btn btn--sm', href: '#/g/' + g.id, text: '挑戰這款' })
      ]));
      if (!rows.length) {
        tableBox.appendChild(el('div', { class: 'empty', text: '還沒有人登錄成績，來當第一個。' }));
      } else {
        tableBox.appendChild(el('table', { class: 'data' }, [
          el('thead', {}, el('tr', {}, [
            el('th', { text: '#' }), el('th', { text: '暱稱' }),
            el('th', { style: { textAlign: 'right' }, text: '分數' }),
            el('th', { style: { textAlign: 'right' }, text: '時間' })
          ])),
          el('tbody', {}, rows.map(function (r, i) {
            var d = new Date(r.t);
            return el('tr', {}, [
              el('td', { class: 'rk', text: String(i + 1) }),
              el('td', { text: r.n }),
              el('td', { class: 'n', text: CSE.util.nf(r.s) }),
              el('td', { class: 'faint', style: { textAlign: 'right', fontSize: '12px' },
                text: CSE.util.pad(d.getHours(), 2) + ':' + CSE.util.pad(d.getMinutes(), 2) })
            ]);
          }))
        ]));
      }
      Array.prototype.forEach.call(tabs.children, function (b) {
        b.setAttribute('aria-current', b.dataset.id === active ? 'page' : 'false');
        b.className = 'btn btn--sm' + (b.dataset.id === active ? ' btn--primary' : '');
      });
    }

    games.forEach(function (g) {
      var b = el('button', { type: 'button', class: 'btn btn--sm', text: g.name, dataset: { id: g.id } });
      b.addEventListener('click', function () {
        active = g.id;
        CSE.sfx.play('click');
        paint();
      });
      tabs.appendChild(b);
    });

    var sum = CSE.scores.summary();
    var overview = el('div', { class: 'panel', style: { marginTop: 'var(--gap)' } }, [
      ui.corners(),
      el('div', { class: 'kicker', text: 'BOOTH STATS' }),
      el('h2', { text: '攤位統計' }),
      el('p', { class: 'muted', style: { fontSize: '13px' },
        text: '這些數字只存在這台裝置上。活動結束可以到「攤位設定」匯出 CSV。' }),
      el('table', { class: 'data' }, [
        el('thead', {}, el('tr', {}, [
          el('th', { text: '遊戲' }),
          el('th', { style: { textAlign: 'right' }, text: '遊玩次數' }),
          el('th', { style: { textAlign: 'right' }, text: '登錄筆數' }),
          el('th', { style: { textAlign: 'right' }, text: '最高分' })
        ])),
        el('tbody', {}, sum.map(function (s) {
          return el('tr', {}, [
            el('td', { text: s.name }),
            el('td', { class: 'n', text: String(s.plays) }),
            el('td', { class: 'n', text: String(s.entries) }),
            /* 沒人登錄暱稱時顯示破折號，避免看起來像「玩了但得 0 分」 */
            el('td', { class: 'n', text: s.entries ? CSE.util.nf(s.best) : '—' })
          ]);
        }))
      ])
    ]);

    ui.clear(view);
    ui.append(view, [
      el('div', { class: 'panel' }, [ui.corners(), tabs, tableBox]),
      overview
    ]);
    paint();
  }

  /* ---------------- 關於資工系 ---------------- */

  /* config.links 裡有填的才長出按鈕；要加新平台就在這個表加一行 */
  var LINK_LABELS = [
    ['ig_assoc', '系學會 IG'],
    ['web', '系網站'],
    ['ig', '系上 IG'],
    ['fb', 'Facebook'],
    ['threads', 'Threads'],
    ['line', 'LINE 社群']
  ];
  function linkButtons() {
    var links = cfg.links || {};
    return LINK_LABELS.filter(function (pair) {
      return typeof links[pair[0]] === 'string' && links[pair[0]].trim();
    }).map(function (pair) {
      return el('a', {
        class: 'btn', href: links[pair[0]].trim(),
        target: '_blank', rel: 'noopener noreferrer', text: pair[1]
      });
    });
  }

  function screenAbout() {
    rain.stop();
    var a = cfg.about;
    ui.clear(view);
    ui.append(view, [
      el('div', { class: 'panel' }, [
        ui.corners(),
        el('div', { class: 'kicker', text: 'ABOUT' }),
        el('h1', { text: cfg.dept + '　在學什麼？' }),
        el('p', { class: 'muted', style: { maxWidth: '68ch' }, text: a.intro })
      ]),
      el('div', { class: 'about-grid', style: { marginTop: 'var(--gap)' } }, [
        el('div', { class: 'panel' }, [
          ui.corners(),
          el('h2', { text: '◆ 核心課程' }),
          el('ul', {}, a.courses.map(function (c) {
            return el('li', {}, [el('b', { style: { color: 'var(--green)' }, text: c[0] }), '　' + c[1]]);
          }))
        ]),
        el('div', { class: 'panel' }, [
          ui.corners(),
          el('h2', { text: '◆ 畢業之後' }),
          el('ul', {}, a.careers.map(function (c) {
            return el('li', {}, [el('b', { style: { color: 'var(--cyan)' }, text: c[0] }), '　' + c[1]]);
          }))
        ])
      ]),
      el('div', { class: 'panel', style: { marginTop: 'var(--gap)' } }, [
        ui.corners(),
        el('h2', { text: '◆ 想先知道的四件事' }),
        el('ul', {}, a.myths.map(function (m) { return el('li', { text: m }); })),
        el('div', { class: 'divider' }),
        el('div', { class: 'row' }, [
          el('a', { class: 'btn btn--primary', href: '#/g/myth', text: '來玩「資工系大誤解」' })
        ].concat(linkButtons()))
      ])
    ]);
  }

  /* ---------------- 攤位設定 ---------------- */
  function screenSettings() {
    rain.stop();
    function toggleRow(key, title, note) {
      var btn = el('button', {
        type: 'button', class: 'toggle', 'aria-pressed': CSE.settings.get(key) ? 'true' : 'false',
        'aria-label': title
      });
      btn.addEventListener('click', function () {
        var v = CSE.settings.toggle(key);
        btn.setAttribute('aria-pressed', v ? 'true' : 'false');
        CSE.sfx.play('click');
        /* 背景動畫的開關由 CSE.settings.onchange 統一處理 */
      });
      return el('div', { class: 'setrow' }, [
        el('div', { class: 't' }, [el('b', { text: title }), el('span', { text: note })]),
        btn
      ]);
    }

    var idleInput = el('input', {
      type: 'number', min: '20', max: '600', value: String(CSE.settings.get('idle')),
      style: { width: '96px' }
    });
    idleInput.addEventListener('change', function () {
      var v = CSE.util.clamp(parseInt(idleInput.value, 10) || 75, 20, 600);
      idleInput.value = String(v);
      CSE.settings.set('idle', v);
      CSE.toast('閒置時間設為 ' + v + ' 秒', 'ok');
    });

    ui.clear(view);
    ui.append(view, [
      el('div', { class: 'panel' }, [
        ui.corners(),
        el('div', { class: 'kicker', text: 'BOOTH SETUP' }),
        el('h1', { text: '攤位設定' }),
        el('p', { class: 'muted', style: { fontSize: '13px' },
          text: '這頁是給擺攤的人用的。所有資料只存在這台裝置的瀏覽器裡，不會上傳。' }),
        CSE.store.ok ? null : el('div', { class: 'notice' }, [
          el('span', { class: 'ic', text: '!' }),
          el('div', { text: '這個瀏覽器不允許存資料（可能是無痕模式或檔案協定限制），分數在重新整理後會消失。建議改用本機伺服器開啟。' })
        ]),
        toggleRow('sound', '音效', '攤位很吵的話可以關掉'),
        toggleRow('motion', '背景動畫', '關掉可以讓舊筆電跑更順'),
        toggleRow('scanline', 'CRT 掃描線', '復古濾鏡，看不習慣可以關'),
        toggleRow('kiosk', '攤位模式（閒置自動回首頁）', '沒人操作一段時間後自動回到首頁，適合無人看顧的平板'),
        el('div', { class: 'setrow' }, [
          el('div', { class: 't' }, [
            el('b', { text: '閒置秒數' }),
            el('span', { text: '攤位模式下，多久沒人碰就回首頁' })
          ]),
          idleInput
        ])
      ]),
      el('div', { class: 'panel', style: { marginTop: 'var(--gap)' } }, [
        ui.corners(),
        el('h2', { text: '◆ 資料' }),
        el('p', { class: 'muted', style: { fontSize: '13px' },
          text: '活動結束前記得先匯出，不然清掉就沒了。CSV 可以直接用 Excel 開。' }),
        el('div', { class: 'row' }, [
          el('button', {
            type: 'button', class: 'btn btn--primary', text: '匯出排行榜 CSV',
            onclick: function () {
              var d = new Date();
              var name = 'iecs-arcade-' + d.getFullYear() + CSE.util.pad(d.getMonth() + 1, 2) +
                CSE.util.pad(d.getDate(), 2) + '-' + CSE.util.pad(d.getHours(), 2) + CSE.util.pad(d.getMinutes(), 2) + '.csv';
              if (CSE.download(name, CSE.scores.exportCsv(), 'text/csv')) CSE.toast('已匯出 ' + name, 'ok');
            }
          }),
          el('button', {
            type: 'button', class: 'btn', text: '全螢幕',
            onclick: function () { toggleFullscreen(); }
          }),
          el('button', {
            type: 'button', class: 'btn btn--danger', text: '清除所有分數與設定',
            onclick: function () {
              CSE.confirm('確定要清除嗎？',
                '所有排行榜、個人最佳與徽章都會消失，而且無法復原。建議先匯出 CSV。',
                function () {
                  CSE.scores.resetAll();
                  CSE.settings.apply();
                  CSE.toast('已清除所有資料', 'ok');
                  refreshChrome();
                  location.hash = '#/';
                }, '清除');
            }
          })
        ])
      ]),
      el('div', { class: 'panel', style: { marginTop: 'var(--gap)' } }, [
        ui.corners(),
        el('h2', { text: '◆ 擺攤小提醒' }),
        el('ul', {}, [
          '把瀏覽器按 F11 或用上方 ⛶ 進入全螢幕，訪客就不會誤觸網址列。',
          '攤位模式打開後，沒人玩會自動回首頁，排隊的人一來就能直接開始。',
          '多台裝置的排行榜是各自獨立的；要合併就各自匯出 CSV 再合併。',
          '完全離線可用，不需要網路。'
        ].map(function (t) { return el('li', { class: 'muted', style: { fontSize: '13px', marginBottom: '6px' }, text: t }); }))
      ])
    ]);
  }

  /* ---------------- 全螢幕 ---------------- */
  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        var p = document.documentElement.requestFullscreen &&
          document.documentElement.requestFullscreen();
        if (p && p.catch) p.catch(function () { CSE.toast('瀏覽器不允許全螢幕，請按 F11', 'bad'); });
      } else {
        document.exitFullscreen();
      }
    } catch (e) { CSE.toast('請改按鍵盤 F11 切換全螢幕', 'bad'); }
  }

  /* ---------------- 頂列狀態 ---------------- */
  function refreshChrome() {
    totalChip.querySelector('b').textContent = CSE.util.nf(CSE.scores.total());
  }

  /* ---------------- 導覽列 ----------------
     七款遊戲全部塞進橫列會超出畫面，而桌機用滑鼠滑不動橫向捲動區，
     等於後面的連結碰不到。改成：少數常用連結留在列上，
     遊戲收進一個下拉面板，窄螢幕則整個收成 ☰。 */

  var gamesBtn = null;     /* 桌機的「遊戲 ▾」按鈕 */
  var hamBtn = null;       /* 窄螢幕的 ☰ */
  var panel = null;        /* 開著的選單面板 */

  var FLAT_LINKS = [
    { href: '#/', label: '首頁' },
    { href: '#/board', label: '排行榜' },
    { href: '#/about', label: '關於資工系', wide: true }
  ];

  function buildNav() {
    ui.clear(navEl);

    navEl.appendChild(el('a', {
      class: 'navlink', href: '#/', text: '首頁', dataset: { route: '#/' }
    }));

    gamesBtn = el('button', {
      type: 'button', class: 'navlink navbtn', 'aria-expanded': 'false',
      'aria-haspopup': 'true',
      onclick: function (e) { e.stopPropagation(); togglePanel(); }
    }, [el('span', { class: 'navbtn-label', text: '遊戲' }), el('i', { class: 'caret', text: '▾' })]);
    navEl.appendChild(gamesBtn);

    navEl.appendChild(el('a', {
      class: 'navlink', href: '#/board', text: '排行榜', dataset: { route: '#/board' }
    }));
    navEl.appendChild(el('a', {
      class: 'navlink navlink--wide', href: '#/about', text: '關於資工系',
      dataset: { route: '#/about' }
    }));

    /* 窄螢幕的漢堡鈕，放在右側控制區最前面 */
    hamBtn = el('button', {
      type: 'button', class: 'iconbtn navham', 'aria-expanded': 'false',
      'aria-label': '選單', title: '選單', text: '☰',
      onclick: function (e) { e.stopPropagation(); togglePanel(); }
    });
    var right = document.querySelector('.topright');
    right.insertBefore(hamBtn, right.firstChild);
  }

  function closePanel() {
    if (!panel) return;
    if (panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    if (gamesBtn) gamesBtn.setAttribute('aria-expanded', 'false');
    if (hamBtn) hamBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onPanelKey, true);
    document.removeEventListener('click', onOutside, true);
  }

  function onPanelKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closePanel(); }
  }
  function onOutside(e) {
    if (panel && !panel.contains(e.target) &&
        e.target !== gamesBtn && !gamesBtn.contains(e.target) &&
        e.target !== hamBtn) closePanel();
  }

  function togglePanel() {
    if (panel) { closePanel(); return; }
    CSE.sfx.play('click');

    var hash = location.hash || '#/';
    var grid = el('div', { class: 'navpanel-grid' });
    orderedGames().forEach(function (g) {
      var href = '#/g/' + g.id;
      var best = CSE.scores.best(g.id);
      var item = el('a', {
        class: 'navitem' + (hash.indexOf(href) === 0 ? ' navitem--now' : ''),
        href: href, style: { '--accent': g.accent || 'var(--green)' },
        onclick: function () { closePanel(); }
      }, [
        el('span', { class: 'navitem-ic', html: g.icon || '#' }),
        el('span', { class: 'navitem-txt' }, [
          el('b', { text: g.name }),
          el('span', { text: best ? '最佳 ' + CSE.util.nf(best) : '還沒玩過' })
        ])
      ]);
      grid.appendChild(item);
    });

    var others = el('div', { class: 'navpanel-links' },
      FLAT_LINKS.concat([{ href: '#/settings', label: '攤位設定' }]).map(function (l) {
        return el('a', {
          class: 'navlink' + (hash === l.href ? ' navlink--now' : ''),
          href: l.href, text: l.label,
          onclick: function () { closePanel(); }
        });
      }));

    panel = el('div', { class: 'navpanel', role: 'menu' }, [
      el('div', { class: 'navpanel-head', text: '七款小遊戲' }),
      grid,
      el('div', { class: 'navpanel-head', text: '其他' }),
      others
    ]);
    panel.addEventListener('click', function (e) { e.stopPropagation(); });

    document.querySelector('.topbar').appendChild(panel);
    if (gamesBtn) gamesBtn.setAttribute('aria-expanded', 'true');
    if (hamBtn) hamBtn.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', onPanelKey, true);
    /* 延後一拍再掛，免得開啟這一次的 click 立刻把它關掉 */
    setTimeout(function () { document.addEventListener('click', onOutside, true); }, 0);
  }

  function markNav(route) {
    closePanel();
    Array.prototype.forEach.call(navEl.children, function (a) {
      if (a.dataset && a.dataset.route === route) a.setAttribute('aria-current', 'page');
      else if (a.dataset) a.removeAttribute('aria-current');
    });
    /* 在遊戲頁時，按鈕直接顯示目前玩的是哪一款，不用再猜自己在哪 */
    if (!gamesBtn) return;
    var inGame = route.indexOf('#/g/') === 0;
    var g = inGame ? CSE.gameById[route.slice(4)] : null;
    gamesBtn.querySelector('.navbtn-label').textContent = g ? g.name : '遊戲';
    if (inGame) gamesBtn.setAttribute('aria-current', 'page');
    else gamesBtn.removeAttribute('aria-current');
  }

  /* ---------------- 路由 ---------------- */
  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qi = h.indexOf('?');
    var params = {};
    if (qi >= 0) {
      h.slice(qi + 1).split('&').forEach(function (kv) {
        var p = kv.split('=');
        params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
      h = h.slice(0, qi);
    }
    return { path: h, params: params };
  }

  function route() {
    cleanPage();
    CSE.host.stop();
    var r = parseHash();
    var parts = r.path.split('/').filter(Boolean);

    refreshChrome();
    window.scrollTo(0, 0);

    if (parts[0] === 'g' && parts[1]) { markNav('#/g/' + parts[1]); screenGame(parts[1]); }
    else if (parts[0] === 'board') { markNav('#/board'); screenBoard(r.params); }
    else if (parts[0] === 'about') { markNav('#/about'); screenAbout(); }
    else if (parts[0] === 'settings') { markNav('#/settings'); screenSettings(); }
    else { markNav('#/'); screenHome(); }

    view.focus({ preventScroll: true });
  }

  /* ---------------- 攤位模式：閒置回首頁 ---------------- */
  var idleTimer = 0;
  var attractEl = null;
  var lastInput = Date.now();

  function showAttract() {
    if (attractEl) return;
    attractEl = el('div', { class: 'attract', role: 'button', tabindex: '0',
      'aria-label': '點擊開始' }, el('div', {}, [
      el('div', { class: 'big', text: '點一下開始' }),
      el('div', { class: 'sm', text: cfg.title + '　·　' + cfg.tagline })
    ]));
    function go() {
      if (attractEl && attractEl.parentNode) attractEl.parentNode.removeChild(attractEl);
      attractEl = null;
      CSE.sfx.unlock();
      resetIdle();
    }
    attractEl.addEventListener('click', go);
    attractEl.addEventListener('keydown', go);
    document.body.appendChild(attractEl);
  }

  /* ---------------- 自動更新偵測 ----------------
     GitHub Pages 把 index.html 也快取 10 分鐘，所以推了新版之後，
     攤位上那台開著不動的裝置會一直停在舊版（連資產的 ?v= 都是舊的）。
     這裡讓網頁自己去比對版本，發現有新版就重新整理一次。
     只在沒人正在玩的時候做，而且每個版本只重載一次，不會無限迴圈。 */
  function checkForUpdate() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    var mine = document.documentElement.dataset.build;
    if (!mine || typeof fetch !== 'function') return;

    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.v || d.v === mine) return;
        if (CSE.host.busy) return;                  /* 有人正在玩就先不要動 */
        var key = 'cse.reloadedFor.' + d.v;
        try {
          if (sessionStorage.getItem(key)) return;  /* 這個版本已經重載過了 */
          sessionStorage.setItem(key, '1');
        } catch (e) { return; }                     /* 存不了就不要冒險重載 */
        location.reload();
      })
      .catch(function () { /* 離線或沒有 version.json，忽略 */ });
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    if (!CSE.settings.get('kiosk')) return;
    var secs = CSE.settings.get('idle') || 75;
    idleTimer = setTimeout(function () {
      /* 正在玩就不要打斷 —— 但如果連「正在玩」都已經很久沒人碰，
         代表玩家中途走掉了（例如關卡制遊戲沒有倒數，會一直停在那裡）。
         這種情況還是要回首頁，否則下一位訪客會看到別人玩到一半的畫面。 */
      if (CSE.host.busy && (Date.now() - lastInput) < secs * 2000) {
        resetIdle();
        return;
      }
      CSE.host.stop();
      if (location.hash !== '#/' && location.hash !== '' && location.hash !== '#') location.hash = '#/';
      showAttract();
      checkForUpdate();   /* 沒人在用的空檔，順便確認有沒有新版 */
    }, secs * 1000);
  }

  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) {
    window.addEventListener(t, function () {
      lastInput = Date.now();
      if (attractEl) return;
      resetIdle();
    }, { passive: true });
  });

  CSE.settings.onchange = function (k) {
    if (k === 'kiosk' || k === 'idle') resetIdle();
    if (k === 'motion') {
      if (CSE.settings.get('motion') && location.hash.indexOf('/g/') < 0) rain.start();
      else rain.stop();
    }
  };

  /* ---------------- 啟動 ---------------- */
  function boot() {
    /* 版面文字 */
    document.title = cfg.title + ' · ' + cfg.booth;
    document.getElementById('brandTitle').textContent = cfg.title;
    document.getElementById('brandSub').textContent = cfg.booth;
    document.getElementById('footText').textContent = cfg.school + ' ' + cfg.dept + '　·　' + cfg.booth;

    CSE.settings.apply();
    buildNav();
    refreshChrome();

    document.getElementById('btnSound').addEventListener('click', function () {
      var v = CSE.settings.toggle('sound');
      CSE.sfx.unlock();
      if (v) CSE.sfx.play('ok');
      CSE.toast(v ? '音效開啟' : '音效關閉');
    });
    document.getElementById('btnFull').addEventListener('click', toggleFullscreen);

    /* 第一次互動解鎖音訊（瀏覽器政策） */
    window.addEventListener('pointerdown', function once() {
      CSE.sfx.unlock();
      window.removeEventListener('pointerdown', once);
    }, { once: true });

    CSE.host.onFinish = function () { refreshChrome(); };

    window.addEventListener('hashchange', route);
    route();
    resetIdle();

    /* 開啟時先確認一次，之後每 10 分鐘在沒人玩的時候再確認 */
    checkForUpdate();
    setInterval(function () { if (!CSE.host.busy) checkForUpdate(); }, 10 * 60 * 1000);

    if (CSE.games.length !== 7) {
      console.warn('[CSE] 載入了 ' + CSE.games.length + ' 款遊戲（預期 7 款），請檢查 index.html 的 script 標籤');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
