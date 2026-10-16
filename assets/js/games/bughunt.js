/* ============================================================
   遊戲 3：Bug 獵人 — 在程式碼裡點出有問題的那一行
   教的是：常見錯誤型態（off-by-one、= vs ==、無限迴圈…）
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  /* bugLines 可給多行（有些錯誤本質上橫跨兩行） */
  var SNIPPETS = [
    {
      title: 'average.py — 計算平均分數',
      code: [
        'scores = [90, 85, 77, 60]',
        'total = 0',
        'for i in range(0, 5):',
        '    total = total + scores[i]',
        'print(total / 4)'
      ],
      bugLines: [3],
      why: '清單只有 4 個元素（編號 0~3），<code>range(0, 5)</code> 會跑到 i = 4，抓 <code>scores[4]</code> 就爆掉了。',
      fix: '改成 <code>range(0, len(scores))</code>，永遠跟著清單長度走。',
      hint: '數一下清單裡有幾個數字，再看迴圈跑幾次。',
      kind: '陣列越界 / off-by-one'
    },
    {
      title: 'login.py — 檢查密碼',
      code: [
        'password = input("請輸入密碼：")',
        'if password = "1234":',
        '    print("歡迎回來")',
        'else:',
        '    print("密碼錯誤")'
      ],
      bugLines: [2],
      why: '<code>=</code> 是「賦值」，<code>==</code> 才是「比較」。這行等於想把字串塞進 password，不是在比較。',
      fix: '改成 <code>if password == "1234":</code>',
      hint: '「等於」在程式裡有兩種寫法，意思完全不同。',
      kind: '= 與 == 混用'
    },
    {
      title: 'countdown.py — 倒數計時',
      code: [
        'n = 10',
        'while n > 0:',
        '    print(n)',
        '    n = n + 1',
        'print("發射！")'
      ],
      bugLines: [4],
      why: 'n 每次都變大，<code>n > 0</code> 永遠成立 → 無限迴圈，程式會卡死。',
      fix: '改成 <code>n = n - 1</code>。',
      hint: '想像 n 的值一步一步變成什麼，迴圈什麼時候才會停。',
      kind: '無限迴圈'
    },
    {
      title: 'wordcount.py — 算所有單字總長度',
      code: [
        'words = ["cat", "dog", "fish"]',
        'for w in words:',
        '    count = 0',
        '    count = count + len(w)',
        'print(count)'
      ],
      bugLines: [3],
      why: '歸零的動作被寫在迴圈裡面，每一圈都重新變成 0，最後只剩最後一個單字的長度。',
      fix: '把 <code>count = 0</code> 移到迴圈外面（第 2 行之前）。',
      hint: '注意縮排：哪些行在迴圈「裡面」？',
      kind: '變數初始化位置錯誤'
    },
    {
      title: 'swap.py — 交換兩個變數',
      code: [
        'a = 3',
        'b = 5',
        'a = b',
        'b = a',
        'print(a, b)'
      ],
      bugLines: [3, 4],
      why: '第 3 行先把 a 蓋成 5，原本的 3 就消失了，第 4 行再抄回來只會得到 5, 5。',
      fix: '先存起來：<code>tmp = a; a = b; b = tmp</code>（Python 也可以 <code>a, b = b, a</code>）。',
      hint: '把每一行執行完 a、b 各是多少寫在旁邊試試。',
      kind: '覆蓋資料 / 缺暫存變數'
    },
    {
      title: 'float.py — 浮點數比較',
      code: [
        'x = 0.1 + 0.2',
        'if x == 0.3:',
        '    print("相等")',
        'else:',
        '    print("居然不相等")'
      ],
      bugLines: [2],
      why: '電腦用二進位存小數，0.1 + 0.2 實際是 0.30000000000000004，直接用 <code>==</code> 比會失敗。',
      fix: '改成比差距：<code>if abs(x - 0.3) &lt; 1e-9:</code>',
      hint: '這段其實沒有語法錯，但輸出會跟你想的不一樣。',
      kind: '浮點數精度'
    },
    {
      title: 'pizza.py — 分披薩',
      code: [
        'students = 7',
        'pizza = 3',
        'each = pizza // students',
        'print("每人分到", each, "片")'
      ],
      bugLines: [3],
      why: '<code>//</code> 是整數除法，3 // 7 直接變成 0，每個人都分到 0 片。',
      fix: '用 <code>/</code> 得到 0.428…，或換算成「每人幾分之幾」。',
      hint: '3 除以 7 的結果，用這個運算子算出來是多少？',
      kind: '整數除法'
    },
    {
      title: 'age.py — 計算明年年齡',
      code: [
        'age = input("你幾歲？")',
        'next_year = age + 1',
        'print("明年你", next_year, "歲")'
      ],
      bugLines: [2],
      why: '<code>input()</code> 拿回來的是字串，字串不能直接加數字。',
      fix: '先轉型：<code>age = int(input("你幾歲？"))</code>',
      hint: '使用者打進來的東西，在程式裡是什麼型別？',
      kind: '型別錯誤'
    },
    {
      title: 'filter.py — 刪掉偶數',
      code: [
        'nums = [1, 2, 3, 4, 5, 6]',
        'for n in nums:',
        '    if n % 2 == 0:',
        '        nums.remove(n)',
        'print(nums)'
      ],
      bugLines: [4],
      why: '邊走邊刪：刪掉一個元素後面全部往前移，迴圈的位置卻繼續往後，會跳過元素。',
      fix: '另外建新清單：<code>nums = [n for n in nums if n % 2 != 0]</code>',
      hint: '一邊走一邊改手上的清單，會發生什麼事？',
      kind: '迭代中修改容器'
    },
    {
      title: 'square.py — 平方函式',
      code: [
        'def square(n):',
        '    answer = n * n',
        '',
        'print(square(4))'
      ],
      bugLines: [2],
      why: '算完了卻沒有把答案交出去，函式預設回傳 None，所以會印出 None。',
      fix: '加上 <code>return answer</code>。',
      hint: '函式算完之後，怎麼把結果給外面？',
      kind: '忘記 return'
    },
    {
      title: 'grade.py — 判斷成績區間',
      code: [
        'score = 85',
        'if score > 60 and < 90:',
        '    print("及格，但還不是高分")'
      ],
      bugLines: [2],
      why: '<code>and</code> 兩邊都必須是完整的條件，<code>&lt; 90</code> 少了左邊的 score。',
      fix: '改成 <code>if score > 60 and score &lt; 90:</code>（Python 也能寫 <code>60 &lt; score &lt; 90</code>）。',
      hint: '把 and 左右兩半分開唸一次，右半邊唸得通嗎？',
      kind: '條件式語法錯誤'
    },
    {
      title: 'first.py — 取第一個使用者',
      code: [
        'users = []',
        'first = users[0]',
        'if first != None:',
        '    print(first)'
      ],
      bugLines: [2],
      why: '清單是空的，還沒檢查就直接取 <code>[0]</code>，程式在第 2 行就當掉了，第 3 行的檢查根本來不及。',
      fix: '先檢查再取：<code>if len(users) > 0:</code>',
      hint: '檢查的順序對嗎？哪一行會先被執行？',
      kind: '未檢查就取值'
    },
    {
      title: 'fact.py — 階乘',
      code: [
        'def fact(n):',
        '    return n * fact(n - 1)',
        '',
        'print(fact(5))'
      ],
      bugLines: [2],
      why: '遞迴沒有終止條件，會一直往下叫自己，直到堆疊爆掉。',
      fix: '補上終止條件：<code>if n &lt;= 1: return 1</code>',
      hint: '這個函式會自己呼叫自己，什麼時候才停下來？',
      kind: '遞迴缺終止條件'
    },
    {
      title: 'cart.py — 購物車總價',
      code: [
        'total_price = 0',
        'items = [100, 250, 80]',
        'for p in items:',
        '    total_prices = total_price + p',
        'print(total_price)'
      ],
      bugLines: [4],
      why: '變數名多打一個 s（<code>total_prices</code>），累加其實加到一個新變數上，原本的永遠是 0。',
      fix: '改成 <code>total_price = total_price + p</code>。',
      hint: '仔細比對每個變數的拼字。',
      kind: '變數名稱打錯'
    }
  ];

  var ROUND = 8;          /* 每局題數 */
  var PER_Q = 20;         /* 每題秒數 */
  var LIVES = 3;

  /* ---------- 極簡語法上色 ---------- */
  var TOKEN = /(#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(\d+\.?\d*(?:e-?\d+)?)\b|\b(def|for|while|if|elif|else|in|range|return|not|and|or|None|True|False|import|from|lambda|break|continue|pass)\b|\b(print|input|len|int|str|float|abs|remove|append)\b/g;

  function highlight(line) {
    var out = '', last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(line)) !== null) {
      out += CSE.ui.esc(line.slice(last, m.index));
      var cls = m[1] ? 'tk-com' : m[2] ? 'tk-str' : m[3] ? 'tk-num' : m[4] ? 'tk-key' : 'tk-fn';
      out += '<span class="' + cls + '">' + CSE.ui.esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    out += CSE.ui.esc(line.slice(last));
    return out;
  }

  CSE.registerGame({
    id: 'bughunt',
    name: 'Bug 獵人',
    tag: '程式設計 · DEBUG',
    icon: '!',
    accent: 'var(--amber)',
    blurb: '工程師一半的時間在抓 bug。每段程式裡藏一個錯誤，點出是哪一行。不會寫程式也看得懂。',
    how: [
      '畫面顯示一小段程式，裡面藏著一個錯誤。',
      '直接點你覺得有問題的那一行。',
      '點對加分，點錯扣一條命（共 3 條）；每題限時 20 秒。',
      '答完都會解釋為什麼錯、怎麼修 — 這才是重點。'
    ],
    controls: '點擊程式碼的任一行；也可按鍵盤數字鍵選行',
    duration: 165,
    medals: { bronze: 450, silver: 900, gold: 1400 },
    titles: ['體驗組', '見習除錯員', 'Bug 獵人', '首席 Debugger'],
    knowledge: {
      title: '為什麼叫 bug？',
      lines: [
        '1947 年 Grace Hopper 的團隊在電腦裡找到一隻飛蛾，「debug」這個說法因此廣為流傳。',
        '業界估計工程師有 30–50% 的時間在讀程式和找錯，不是在寫新功能。',
        '你剛剛做的事叫 code review（程式碼審查），是真實工作流程的一環。',
        '資工系的「程式設計」「軟體工程」就在練這件事：寫得對，更要看得出哪裡不對。'
      ]
    },

    mount: function (stage, api) {
      var queue = CSE.util.shuffle(SNIPPETS).slice(0, ROUND);
      var qi = -1;
      var lives = LIVES;
      var right = 0, wrong = 0, hintUsed = 0;
      var locked = true;
      var qLeft = 0, hintOn = false;
      var lineEls = [];

      var titleEl = api.el('div', { class: 'code-title', text: '' });
      var codeBox = api.el('div', { class: 'code' }, [titleEl]);
      var livesEl = api.el('span', { class: 'lives', text: '♥♥♥' });
      var qLeftEl = api.el('b', { text: String(PER_Q) });
      var kindEl = api.el('span', { class: 'faint', text: '' });
      var fb = api.el('div', { class: 'bh-fb', text: '點一行你覺得有問題的程式碼。' });

      var btnHint = api.el('button', {
        type: 'button', class: 'btn btn--sm', text: '提示（−40）',
        onclick: function () {
          if (hintOn || locked) return;
          hintOn = true; hintUsed++;
          api.addScore(-40);
          api.sfx.play('click');
          fb.className = 'bh-fb';
          fb.innerHTML = '<b>提示：</b>' + queue[qi].hint;
        }
      });

      var nextBtn = api.el('button', {
        type: 'button', class: 'btn btn--sm btn--primary hidden', text: '下一題',
        onclick: function () { api.sfx.play('click'); nextQ(); }
      });

      stage.appendChild(api.el('div', { class: 'bh-wrap' }, [
        api.el('div', { class: 'bh-meta' }, [
          api.el('div', {}, [livesEl, ' ', kindEl]),
          api.el('div', { class: 'row' }, [
            api.el('span', { class: 'faint' }, ['本題剩 ', qLeftEl, ' 秒']),
            btnHint, nextBtn
          ])
        ]),
        codeBox,
        fb
      ]));

      function paintLives() {
        livesEl.textContent = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, LIVES - lives));
      }

      function renderSnippet(s) {
        while (codeBox.children.length > 1) codeBox.removeChild(codeBox.lastChild);
        titleEl.textContent = s.title;
        lineEls = [];
        s.code.forEach(function (text, i) {
          var ln = i + 1;
          var blank = text.trim() === '';
          var row = api.el('div', {
            class: 'cline' + (blank ? ' dead' : ''),
            role: blank ? null : 'button',
            tabindex: blank ? null : '0'
          }, [
            api.el('span', { class: 'ln', text: String(ln) }),
            api.el('span', { html: highlight(text) || ' ' })
          ]);
          if (!blank) {
            row.addEventListener('click', function () { answer(ln, row); });
            row.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); answer(ln, row); }
            });
          }
          lineEls[ln] = row;
          codeBox.appendChild(row);
        });
      }

      function answer(ln, row) {
        if (locked) return;
        var s = queue[qi];
        var correct = s.bugLines.indexOf(ln) >= 0;
        locked = true;
        nextBtn.classList.remove('hidden');

        if (correct) {
          right++;
          var speed = Math.max(0, Math.round(qLeft * 7));
          var gain = 100 + speed;
          api.addScore(gain);
          api.sfx.play('great');
          row.classList.add('right');
          fb.className = 'bh-fb right';
          fb.innerHTML = '<b>✓ 答對了（+' + gain + '）· ' + CSE.ui.esc(s.kind) + '</b><br>' +
            s.why + '<br><span class="faint">修法：</span>' + s.fix;
        } else {
          wrong++;
          lives--;
          paintLives();
          api.sfx.play('bad');
          row.classList.add('wrong');
          s.bugLines.forEach(function (b) { if (lineEls[b]) lineEls[b].classList.add('reveal'); });
          fb.className = 'bh-fb wrong';
          fb.innerHTML = '<b>✗ 錯誤在第 ' + s.bugLines.join(' / ') + ' 行 · ' + CSE.ui.esc(s.kind) + '</b><br>' +
            s.why + '<br><span class="faint">修法：</span>' + s.fix;
        }
        if (lives <= 0) { api.after(2400, function () { gameOver('lives'); }); }
      }

      function timeUp() {
        if (locked) return;
        var s = queue[qi];
        wrong++;
        lives--;
        paintLives();
        locked = true;
        nextBtn.classList.remove('hidden');
        api.sfx.play('bad');
        s.bugLines.forEach(function (b) { if (lineEls[b]) lineEls[b].classList.add('reveal'); });
        fb.className = 'bh-fb wrong';
        fb.innerHTML = '<b>⏱ 時間到 — 錯誤在第 ' + s.bugLines.join(' / ') + ' 行</b><br>' +
          s.why + '<br><span class="faint">修法：</span>' + s.fix;
        if (lives <= 0) api.after(2400, function () { gameOver('lives'); });
      }

      function nextQ() {
        if (lives <= 0) { gameOver('lives'); return; }   /* 搶在延遲結束前按「下一題」 */
        qi++;
        if (qi >= queue.length) { gameOver('cleared'); return; }
        var s = queue[qi];
        hintOn = false;
        locked = false;
        qLeft = PER_Q;
        qLeftEl.textContent = String(PER_Q);
        nextBtn.classList.add('hidden');
        kindEl.textContent = '第 ' + (qi + 1) + ' / ' + queue.length + ' 題';
        api.setStat('答對', right);
        fb.className = 'bh-fb';
        fb.textContent = '點一行你覺得有問題的程式碼。';
        renderSnippet(s);
      }

      function gameOver(reason) {
        api.finish({
          reason: reason === 'cleared' ? 'cleared' : 'timeout',
          stats: [
            { k: '答對', v: right + ' 題' },
            { k: '答錯', v: wrong + ' 題' },
            { k: '用提示', v: hintUsed + ' 次' },
            { k: '剩餘生命', v: Math.max(0, lives) }
          ]
        });
      }

      /* 鍵盤選行 */
      api.on(document, 'keydown', function (e) {
        if (locked) {
          if (e.key === 'Enter' && !nextBtn.classList.contains('hidden')) { e.preventDefault(); nextQ(); }
          return;
        }
        var n = parseInt(e.key, 10);
        if (!isNaN(n) && lineEls[n]) { e.preventDefault(); answer(n, lineEls[n]); }
      });

      api.onResult(function () {
        return {
          stats: [
            { k: '答對', v: right + ' 題' },
            { k: '答錯', v: wrong + ' 題' },
            { k: '用提示', v: hintUsed + ' 次' }
          ]
        };
      });

      paintLives();
      nextQ();

      /* 每題獨立倒數 */
      return {
        onFrame: function (dt) {
          if (locked) return;
          qLeft -= dt;
          if (qLeft <= 0) { qLeft = 0; qLeftEl.textContent = '0'; timeUp(); return; }
          qLeftEl.textContent = String(Math.ceil(qLeft));
        }
      };
    }
  });
})();
