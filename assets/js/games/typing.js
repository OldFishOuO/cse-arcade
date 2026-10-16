/* ============================================================
   遊戲 5：終端機打字 — 把指令正確打出來
   教的是：常用命令列指令在做什麼（順便練鍵盤）
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  var CMDS = [
    ['ls -la', '列出目前資料夾裡所有檔案，包含隱藏檔與詳細資訊'],
    ['cd ..', '回到上一層資料夾'],
    ['pwd', '印出「我現在在哪個資料夾」'],
    ['mkdir project', '建立一個叫 project 的新資料夾'],
    ['rm -rf build', '強制刪除 build 資料夾（這個指令很危險，業界的恐怖故事來源）'],
    ['cp a.txt b.txt', '把 a.txt 複製成 b.txt'],
    ['mv old.js new.js', '把檔案改名或搬家'],
    ['cat README.md', '把檔案內容印在畫面上'],
    ['grep -r "TODO" .', '在所有檔案裡搜尋含 TODO 的那幾行'],
    ['chmod +x run.sh', '讓 run.sh 變成可執行檔'],
    ['git status', '看看哪些檔案改過但還沒存成版本'],
    ['git add .', '把所有修改標記成「準備提交」'],
    ['git commit -m "fix bug"', '把這次修改存成一個版本紀錄'],
    ['git push origin main', '把本機的版本推上遠端倉庫'],
    ['git pull', '把別人推上去的修改抓下來'],
    ['git log --oneline', '用一行一筆的方式看版本歷史'],
    ['git checkout -b feature', '開一條新分支來開發新功能'],
    ['npm install', '依照設定檔把專案需要的套件全部裝好'],
    ['npm run dev', '啟動開發用的伺服器'],
    ['python3 main.py', '用 Python 執行 main.py'],
    ['pip install numpy', '安裝 Python 的數值運算套件'],
    ['docker ps', '列出正在執行的容器'],
    ['ssh user@server', '遠端登入另一台電腦'],
    ['ping 8.8.8.8', '測試網路是否通、延遲多少毫秒'],
    ['curl -I example.com', '只抓網頁的 HTTP 標頭回來看'],
    ['kill -9 1234', '強制結束編號 1234 的程式'],
    ['top', '看哪個程式吃掉你的 CPU'],
    ['ps aux | grep node', '找出所有跟 node 有關的程序'],
    ['sudo apt update', '更新系統的套件清單（sudo = 用管理員身分）'],
    ['echo $PATH', '印出系統尋找指令的路徑清單']
  ];

  CSE.registerGame({
    id: 'typing',
    name: '終端機打字',
    tag: '系統 · TERMINAL',
    icon: '>_',
    accent: 'var(--lime)',
    blurb: '工程師的日常是黑底白字的視窗。把指令一字不差打出來，順便搞懂每個指令在做什麼。',
    how: [
      '畫面中間出現一個指令，照著打在輸入框裡。',
      '打對的字變綠色，打錯會變紅色 — 要退格改掉才能繼續。',
      '完全正確就自動跳下一個指令，不用按 Enter。',
      '下方會解釋這個指令在做什麼。限時 50 秒。'
    ],
    controls: '鍵盤輸入（請先切換成英數輸入法）',
    duration: 50,
    medals: { bronze: 700, silver: 1400, gold: 2300 },
    titles: ['體驗組', '鍵盤新手', '終端機熟手', '鍵盤俠'],
    knowledge: {
      title: '為什麼工程師還在用命令列？',
      lines: [
        '因為指令可以被「記下來、重複執行、自動化」 — 滑鼠點過的動作沒辦法。',
        '一行 grep 就能在幾萬個檔案裡找字串，比任何搜尋介面都快。',
        'git 是版本控制工具，業界幾乎人人在用；它記得你程式的每一次修改。',
        '資工系的「作業系統」「系統程式」就在教這些指令底下發生了什麼事。'
      ]
    },

    mount: function (stage, api) {
      var pool = CSE.util.shuffle(CMDS);
      var pi = 0;
      var target = '', desc = '';
      var typedOK = 0, errors = 0, done = 0, prevLen = 0;
      var startAt = performance.now();

      var targetEl = api.el('div', { class: 'ty-target' });
      var descEl = api.el('div', { class: 'ty-desc' });
      var input = api.el('input', {
        type: 'text', class: 'ty-input', autocomplete: 'off', autocapitalize: 'off',
        autocorrect: 'off', spellcheck: 'false', 'aria-label': '指令輸入框',
        placeholder: '在這裡打字…'
      });
      var wpmEl = api.el('b', { text: '0' });
      var accEl = api.el('b', { text: '100%' });
      var live = api.el('div', { class: 'statlist ty-live' }, [
        api.el('div', {}, ['WPM', wpmEl]),
        api.el('div', {}, ['正確率', accEl]),
        api.el('div', {}, ['完成', api.el('b', { id: 'tyDone', text: '0' })])
      ]);
      var doneEl = live.querySelector('#tyDone');

      stage.appendChild(api.el('div', { class: 'ty-wrap' }, [
        api.el('div', { class: 'faint center', style: { fontSize: '12px', letterSpacing: '.2em' }, text: 'user@cse:~$' }),
        targetEl,
        input,
        descEl,
        live
      ]));

      function paint() {
        var v = input.value;
        CSE.ui.clear(targetEl);
        var firstBad = -1;
        for (var i = 0; i < target.length; i++) {
          var ch = target.charAt(i);
          var cls = 'ch' + (ch === ' ' ? ' sp' : '');
          if (i < v.length) {
            if (v.charAt(i) === ch) cls += ' done';
            else { cls += ' err'; if (firstBad < 0) firstBad = i; }
          } else if (i === v.length) {
            cls += ' cur';
          }
          targetEl.appendChild(api.el('span', { class: cls, text: ch === ' ' ? '␣' : ch }));
        }
        if (v.length > target.length) {
          targetEl.appendChild(api.el('span', { class: 'ch err', text: '×'.repeat(v.length - target.length) }));
          if (firstBad < 0) firstBad = target.length;
        }
        if (firstBad >= 0) api.hint('有打錯的字，按退格鍵改掉', 'bad');
        else api.hint('');
      }

      function stats() {
        var mins = Math.max(0.05, (performance.now() - startAt) / 60000);
        wpmEl.textContent = String(Math.round((typedOK / 5) / mins));
        var tot = typedOK + errors;
        accEl.textContent = (tot ? Math.round((typedOK / tot) * 100) : 100) + '%';
        doneEl.textContent = String(done);
      }

      function nextCmd() {
        if (pi >= pool.length) pool = CSE.util.shuffle(CMDS), pi = 0;
        var item = pool[pi++];
        target = item[0];
        desc = item[1];
        input.value = '';
        prevLen = 0;
        descEl.innerHTML = '<b>' + CSE.ui.esc(target.split(' ')[0]) + '</b>　' + CSE.ui.esc(desc);
        paint();
        api.setStat('完成', done);
      }

      input.addEventListener('input', function () {
        var v = input.value;
        /* 只在「新增一個字」時判斷對錯，避免退格重複計算 */
        if (v.length === prevLen + 1) {
          var i = v.length - 1;
          if (i < target.length && v.charAt(i) === target.charAt(i)) {
            typedOK++;
            api.addScore(8);
            api.sfx.play('type');
          } else {
            errors++;
            api.sfx.play('bad');
          }
        }
        prevLen = v.length;
        paint();
        stats();
        if (v === target) {
          done++;
          api.addScore(60);
          api.sfx.play('ok');
          nextCmd();
          stats();
        }
      });

      /* 防作弊：不能貼上 */
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        CSE.toast('這個遊戲不能貼上喔', 'bad');
      });
      /* 中文輸入法會讓字元進不來，提醒一次 */
      var warned = false;
      input.addEventListener('compositionstart', function () {
        if (warned) return;
        warned = true;
        CSE.toast('請切換成英數輸入法（Shift 或 Ctrl+Space）', 'bad', 3200);
      });
      /* 點畫面任何地方都把焦點送回輸入框（不用 blur 自動搶回，
         否則手機鍵盤會一直彈出來，也會搶走上方按鈕的焦點） */
      api.on(stage, 'click', function (e) {
        if (e.target.closest && e.target.closest('button, a')) return;
        input.focus();
      });
      /* 空白鍵不要把頁面往下捲 */
      api.on(window, 'keydown', function (e) {
        if (e.key === ' ' && document.activeElement !== input) e.preventDefault();
      });

      api.onResult(function () {
        var mins = Math.max(0.05, (performance.now() - startAt) / 60000);
        var tot = typedOK + errors;
        return {
          stats: [
            { k: '完成指令', v: done + ' 個' },
            { k: 'WPM', v: Math.round((typedOK / 5) / mins) },
            { k: '正確率', v: (tot ? Math.round((typedOK / tot) * 100) : 100) + '%' },
            { k: '打錯', v: errors + ' 次' }
          ]
        };
      });

      nextCmd();
      api.after(60, function () { input.focus(); });

      return {
        destroy: function () { try { input.blur(); } catch (e) { /* ignore */ } }
      };
    }
  });
})();
