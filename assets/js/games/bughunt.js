/* ============================================================
   遊戲 3：Bug 獵人 — 在程式碼裡點出有問題的那一行
   開場先選程式語言（Python / C / JavaScript），
   題目不會混在一起，玩家才知道要用哪一種語言的邏輯去想。
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  /* ---------- 題庫：bugLines 可給多行（有些錯誤本質上橫跨兩行） ---------- */

  var PY = [
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

  var C = [
    {
      title: 'sum.c — 加總陣列',
      code: [
        'int arr[5] = {1, 2, 3, 4, 5};',
        'int total = 0;',
        'for (int i = 0; i <= 5; i++) {',
        '    total += arr[i];',
        '}',
        'printf("%d\\n", total);'
      ],
      bugLines: [3],
      why: '陣列合法的編號是 0~4，<code>i &lt;= 5</code> 會多跑一次去讀 <code>arr[5]</code>，那是別人的記憶體。',
      fix: '改成 <code>i &lt; 5</code>。',
      hint: '宣告 5 格，最後一格的編號是幾？',
      kind: '陣列越界 / off-by-one'
    },
    {
      title: 'input.c — 讀一個數字',
      code: [
        'int age;',
        'printf("請輸入年齡：");',
        'scanf("%d", age);',
        'printf("你 %d 歲\\n", age);'
      ],
      bugLines: [3],
      why: '<code>scanf</code> 要的是「變數的位址」，直接給值會讓它往一個亂七八糟的地方寫，程式直接當掉。',
      fix: '加上取址運算子：<code>scanf("%d", &amp;age);</code>',
      hint: 'scanf 要把讀到的東西「放進去」，它需要知道什麼？',
      kind: 'scanf 忘記 &'
    },
    {
      title: 'compare.c — 比較兩個字串',
      code: [
        'char a[20] = "hello";',
        'char b[20] = "hello";',
        'if (a == b) {',
        '    printf("一樣\\n");',
        '}'
      ],
      bugLines: [3],
      why: '在 C 裡字串是位址，<code>==</code> 比的是「兩個陣列在記憶體的位置」，永遠不相等。',
      fix: '用 <code>if (strcmp(a, b) == 0)</code>。',
      hint: 'C 的字串其實是什麼？== 在比什麼？',
      kind: '字串比較'
    },
    {
      title: 'loop.c — 印五次',
      code: [
        'for (int i = 0; i < 5; i++);',
        '{',
        '    printf("%d ", i);',
        '}'
      ],
      bugLines: [1],
      why: '第 1 行結尾多了一個分號，迴圈body變成「什麼都不做」，底下的大括號只是一個普通區塊，只會執行一次。',
      fix: '把行尾的 <code>;</code> 刪掉。',
      hint: '看看第 1 行的最後一個字元。',
      kind: '多餘的分號'
    },
    {
      title: 'divide.c — 算平均',
      code: [
        'int a = 7, b = 2;',
        'float avg = a / b;',
        'printf("%f\\n", avg);'
      ],
      bugLines: [2],
      why: '兩個 int 相除得到的還是 int（7/2 = 3），轉成 float 已經來不及，結果是 3.000000。',
      fix: '先轉型：<code>float avg = (float)a / b;</code>',
      hint: '除法在做的時候，兩邊是什麼型別？',
      kind: '整數除法'
    },
    {
      title: 'string.c — 複製字串',
      code: [
        'char dest[5];',
        'char *src = "HelloWorld";',
        'strcpy(dest, src);',
        'printf("%s\\n", dest);'
      ],
      bugLines: [3],
      why: 'dest 只有 5 格，卻要塞 10 個字加結尾字元，會蓋掉旁邊的記憶體 — 這就是緩衝區溢位。',
      fix: '把 dest 開大（至少 11），或改用 <code>strncpy</code> 並自己補結尾。',
      hint: '數一下要塞幾個字元，再看看位子夠不夠。',
      kind: '緩衝區溢位'
    },
    {
      title: 'pointer.c — 用指標回傳',
      code: [
        'int *get_number() {',
        '    int value = 42;',
        '    return &value;',
        '}'
      ],
      bugLines: [3],
      why: 'value 是區域變數，函式一結束就消失了，回傳它的位址等於給出一個已經無效的地址。',
      fix: '改成直接回傳值，或用 <code>malloc</code> 配置在堆積上。',
      hint: '函式結束之後，value 還活著嗎？',
      kind: '回傳區域變數位址'
    },
    {
      title: 'malloc.c — 配置記憶體',
      code: [
        'int *p = malloc(10 * sizeof(int));',
        'for (int i = 0; i < 10; i++) {',
        '    p[i] = i;',
        '}',
        'printf("%d\\n", p[0]);',
        'return 0;'
      ],
      bugLines: [6],
      why: '<code>malloc</code> 要來的記憶體沒有還回去，程式結束前少了 <code>free(p)</code> — 這叫記憶體洩漏。',
      fix: '在 return 之前加上 <code>free(p);</code>',
      hint: '跟系統借了東西，結束前要做什麼？',
      kind: '記憶體洩漏'
    },
    {
      title: 'equal.c — 檢查數值',
      code: [
        'int x = 5;',
        'if (x = 10) {',
        '    printf("x 是 10\\n");',
        '}'
      ],
      bugLines: [2],
      why: '<code>=</code> 把 10 指派給 x，整個式子的值是 10（非零 = 真），所以條件永遠成立，而且 x 被改掉了。',
      fix: '改成 <code>if (x == 10)</code>。',
      hint: 'C 裡面非零就是真，這個條件會有不成立的時候嗎？',
      kind: '= 與 == 混用'
    }
  ];

  var JS = [
    {
      title: 'compare.js — 比較使用者輸入',
      code: [
        'const input = "5";',
        'if (input == 5) {',
        '    console.log("數字正確");',
        '}'
      ],
      bugLines: [2],
      why: '<code>==</code> 會自動轉型，字串 "5" 和數字 5 被當成相等，型別錯誤就被藏起來了。',
      fix: '用 <code>===</code> 嚴格比較，或先 <code>Number(input)</code> 轉型。',
      hint: '這裡其實不會報錯，但它掩蓋了一個型別問題。',
      kind: '== 自動轉型'
    },
    {
      title: 'loop.js — 走訪陣列',
      code: [
        'const items = ["a", "b", "c"];',
        'for (let i = 0; i <= items.length; i++) {',
        '    console.log(items[i]);',
        '}'
      ],
      bugLines: [2],
      why: '長度是 3，合法編號 0~2。<code>i &lt;= length</code> 會多跑一次，印出 undefined。',
      fix: '改成 <code>i &lt; items.length</code>。',
      hint: 'length 是 3，但最後一個元素的編號是幾？',
      kind: '陣列越界 / off-by-one'
    },
    {
      title: 'total.js — 加總價格',
      code: [
        'const prices = [100, 250, 80];',
        'let total = 0;',
        'prices.forEach(p => {',
        '    return total + p;',
        '});',
        'console.log(total);'
      ],
      bugLines: [4],
      why: '<code>forEach</code> 不會收集回傳值，<code>return</code> 只是結束這一圈，total 從頭到尾都是 0。',
      fix: '改成 <code>total += p;</code>，或用 <code>reduce</code>。',
      hint: 'forEach 回傳的東西會被拿去做什麼嗎？',
      kind: 'forEach 的回傳值'
    },
    {
      title: 'async.js — 抓取資料',
      code: [
        'async function load() {',
        '    const res = fetch("/api/data");',
        '    const data = await res.json();',
        '    console.log(data);',
        '}'
      ],
      bugLines: [2],
      why: '<code>fetch</code> 回傳的是 Promise，少了 <code>await</code>，res 是個 Promise 而不是回應物件，下一行就錯了。',
      fix: '改成 <code>const res = await fetch("/api/data");</code>',
      hint: '這一行拿到的到底是「回應」還是「等一下才會有的回應」？',
      kind: '忘記 await'
    },
    {
      title: 'copy.js — 複製設定',
      code: [
        'const defaults = { theme: "dark", size: 14 };',
        'const user = defaults;',
        'user.theme = "light";',
        'console.log(defaults.theme);'
      ],
      bugLines: [2],
      why: '物件是傳參考，user 和 defaults 指向同一個物件，改 user 等於把 defaults 也改掉了。',
      fix: '複製一份：<code>const user = { ...defaults };</code>',
      hint: '這一行是「複製了一份」還是「取了個別名」？',
      kind: '淺層參考 / 沒有複製'
    },
    {
      title: 'scope.js — 延遲印出',
      code: [
        'for (var i = 0; i < 3; i++) {',
        '    setTimeout(() => console.log(i), 100);',
        '}'
      ],
      bugLines: [1],
      why: '<code>var</code> 沒有區塊作用域，三個 setTimeout 共用同一個 i，執行時 i 已經是 3，會印出三次 3。',
      fix: '改用 <code>let i = 0</code>，每一圈會有自己的 i。',
      hint: '等 100 毫秒之後才執行，那時候 i 變成多少了？',
      kind: 'var 的作用域'
    },
    {
      title: 'number.js — 檢查是不是數字',
      code: [
        'const n = Number("abc");',
        'if (n == NaN) {',
        '    console.log("不是數字");',
        '}'
      ],
      bugLines: [2],
      why: 'NaN 不等於任何東西，連自己都不等於，這個條件永遠是 false。',
      fix: '用 <code>Number.isNaN(n)</code>。',
      hint: 'NaN 有一個很特別的性質，跟比較有關。',
      kind: 'NaN 的比較'
    },
    {
      title: 'sort.js — 數字排序',
      code: [
        'const nums = [10, 9, 100, 1];',
        'nums.sort();',
        'console.log(nums);'
      ],
      bugLines: [2],
      why: '<code>sort()</code> 預設把元素當字串比，結果會變成 [1, 10, 100, 9]。',
      fix: '傳比較函式：<code>nums.sort((a, b) =&gt; a - b);</code>',
      hint: '不給參數的話，sort 是用什麼規則在比？',
      kind: 'sort 預設行為'
    },
    {
      title: 'find.js — 找出使用者',
      code: [
        'const users = [{ id: 1 }, { id: 2 }];',
        'const user = users.find(u => u.id === 5);',
        'console.log(user.id);'
      ],
      bugLines: [3],
      why: '找不到時 <code>find</code> 回傳 undefined，直接拿 <code>.id</code> 會直接報錯。',
      fix: '先檢查：<code>if (user) console.log(user.id);</code> 或用 <code>user?.id</code>。',
      hint: '如果陣列裡根本沒有 id 是 5 的人，第 2 行會得到什麼？',
      kind: '沒有檢查 undefined'
    }
  ];

  var LANGS = [
    {
      id: 'python', label: 'Python', icon: 'py', accent: 'var(--green)',
      note: '語法最接近英文，沒學過程式也看得懂', set: PY
    },
    {
      id: 'c', label: 'C', icon: 'C', accent: 'var(--cyan)',
      note: '系上必修的語言，指標與記憶體的經典陷阱', set: C
    },
    {
      id: 'js', label: 'JavaScript', icon: 'js', accent: 'var(--amber)',
      note: '網頁都靠它，型別轉換的坑特別多', set: JS
    }
  ];

  var ROUND = 8;          /* 每局題數 */
  var PER_Q = 26;         /* 每題秒數：要先讀懂程式碼，20 秒對新手太趕 */
  var LIVES = 3;

  /* ---------- 極簡語法上色（每種語言一套規則） ---------- */
  var KEYWORDS = {
    python: 'def|for|while|if|elif|else|in|range|return|not|and|or|None|True|False|import|from|lambda|break|continue|pass',
    c: 'int|char|float|double|void|for|while|if|else|return|struct|const|sizeof|unsigned|long|short|break|continue|NULL',
    js: 'const|let|var|function|for|while|if|else|return|async|await|new|class|null|undefined|true|false|break|continue|of|in'
  };
  var FUNCS = {
    python: 'print|input|len|int|str|float|abs|remove|append',
    c: 'printf|scanf|malloc|free|strcpy|strncpy|strcmp|strlen',
    js: 'console|log|fetch|json|forEach|find|sort|map|filter|reduce|Number|isNaN|setTimeout'
  };

  function tokenRe(lang) {
    var comment = lang === 'python' ? '(#[^\\n]*)' : '(\\/\\/[^\\n]*)';
    return new RegExp(
      comment +
      '|("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')' +
      '|\\b(\\d+\\.?\\d*(?:e-?\\d+)?)\\b' +
      '|\\b(' + KEYWORDS[lang] + ')\\b' +
      '|\\b(' + FUNCS[lang] + ')\\b',
      'g');
  }

  function highlight(line, lang) {
    var re = tokenRe(lang);
    var out = '', last = 0, m;
    while ((m = re.exec(line)) !== null) {
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
    level: '普通',
    blurb: '工程師一半的時間在抓 bug。自己挑語言，每段程式裡藏一個錯誤，點出是哪一行。不會寫程式也看得懂。',
    how: [
      '先選一種程式語言：Python、C 或 JavaScript。',
      '畫面顯示一小段該語言的程式，裡面藏著一個錯誤。',
      '直接點你覺得有問題的那一行。',
      '點對加分，點錯扣一條命（共 3 條）；每題限時 26 秒。',
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
        '不同語言有不同的經典陷阱：Python 的縮排、C 的指標與記憶體、JavaScript 的型別轉換。'
      ]
    },

    mount: function (stage, api) {
      var lang = null;         /* 選好的語言物件 */
      var queue = [];
      var qi = -1;
      var lives = LIVES;
      var right = 0, wrong = 0, hintUsed = 0;
      var locked = true;
      var qLeft = 0, hintOn = false;
      var lineEls = [];
      var started = false;

      var wrap = api.el('div', { class: 'bh-wrap' });
      stage.appendChild(wrap);

      /* ---------- 開場：選語言（此時先把倒數停住） ---------- */
      api.holdTimer(true);
      api.hint('先選一種程式語言');

      function showPicker() {
        CSE.ui.clear(wrap);
        var last = CSE.store.get('bughunt.lang', '');
        var cards = api.el('div', { class: 'lang-grid' });
        LANGS.forEach(function (L) {
          var btn = api.el('button', {
            type: 'button',
            class: 'langcard' + (L.id === last ? ' langcard--last' : ''),
            style: { '--accent': L.accent },
            onclick: function () { api.sfx.play('ok'); choose(L); }
          }, [
            api.el('div', { class: 'langcard-icon', text: L.icon }),
            api.el('div', { class: 'langcard-name', text: L.label }),
            api.el('div', { class: 'langcard-note', text: L.note }),
            api.el('div', { class: 'langcard-count', text: L.set.length + ' 題題庫' }),
            L.id === last ? api.el('span', { class: 'langcard-tag', text: '上次玩的' }) : null
          ]);
          cards.appendChild(btn);
        });

        wrap.appendChild(api.el('div', { class: 'lang-pick' }, [
          api.el('div', { class: 'kicker', text: 'SELECT LANGUAGE' }),
          api.el('h3', { style: { fontSize: '19px', color: '#fff' }, text: '要抓哪一種語言的 bug？' }),
          api.el('p', { class: 'faint', style: { fontSize: '12.5px', marginBottom: '4px' },
            text: '題目不會混在一起，選好之後整局都是同一種語言。計時從你選完才開始。' }),
          cards
        ]));
      }

      function choose(L) {
        lang = L;
        CSE.store.set('bughunt.lang', L.id);
        queue = CSE.util.shuffle(L.set).slice(0, Math.min(ROUND, L.set.length));
        started = true;
        buildBoard();
        api.holdTimer(false);        /* 選完才開始倒數 */
        nextQ();
      }

      /* ---------- 遊戲畫面 ---------- */
      var titleEl, codeBox, livesEl, qLeftEl, kindEl, fb, btnHint, nextBtn;

      function buildBoard() {
        CSE.ui.clear(wrap);
        titleEl = api.el('div', { class: 'code-title', text: '' });
        codeBox = api.el('div', { class: 'code' }, [titleEl]);
        livesEl = api.el('span', { class: 'lives', text: '♥♥♥' });
        qLeftEl = api.el('b', { text: String(PER_Q) });
        kindEl = api.el('span', { class: 'faint', text: '' });
        fb = api.el('div', { class: 'bh-fb', text: '點一行你覺得有問題的程式碼。' });

        btnHint = api.el('button', {
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
        nextBtn = api.el('button', {
          type: 'button', class: 'btn btn--sm btn--primary hidden', text: '下一題',
          onclick: function () { api.sfx.play('click'); nextQ(); }
        });

        wrap.appendChild(api.el('div', { class: 'bh-meta' }, [
          api.el('div', {}, [
            livesEl, ' ',
            api.el('span', { class: 'tag', style: { '--accent': lang.accent }, text: lang.label }),
            ' ', kindEl
          ]),
          api.el('div', { class: 'row' }, [
            api.el('span', { class: 'faint' }, ['本題剩 ', qLeftEl, ' 秒']),
            btnHint, nextBtn
          ])
        ]));
        wrap.appendChild(codeBox);
        wrap.appendChild(fb);
        paintLives();
      }

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
            api.el('span', { html: highlight(text, lang.id) || ' ' })
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
          var speed = Math.max(0, Math.round(qLeft * 5));
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
        api.hint('');
        renderSnippet(s);
      }

      function gameOver(reason) {
        api.finish({
          reason: reason === 'cleared' ? 'cleared' : 'timeout',
          stats: [
            { k: '語言', v: lang ? lang.label : '—' },
            { k: '答對', v: right + ' 題' },
            { k: '答錯', v: wrong + ' 題' },
            { k: '用提示', v: hintUsed + ' 次' },
            { k: '剩餘生命', v: Math.max(0, lives) }
          ]
        });
      }

      /* 鍵盤選行 */
      api.on(document, 'keydown', function (e) {
        if (!started) return;
        if (locked) {
          if (e.key === 'Enter' && nextBtn && !nextBtn.classList.contains('hidden')) {
            e.preventDefault(); nextQ();
          }
          return;
        }
        var n = parseInt(e.key, 10);
        if (!isNaN(n) && lineEls[n]) { e.preventDefault(); answer(n, lineEls[n]); }
      });

      api.onResult(function () {
        return {
          stats: [
            { k: '語言', v: lang ? lang.label : '（還沒選）' },
            { k: '答對', v: right + ' 題' },
            { k: '答錯', v: wrong + ' 題' },
            { k: '用提示', v: hintUsed + ' 次' }
          ]
        };
      });

      showPicker();

      /* 每題獨立倒數（用真實時鐘，視窗被蓋住也不會卡住） */
      return {
        onTick: function (dt) {
          if (!started || locked) return;
          qLeft -= dt;
          if (qLeft <= 0) { qLeft = 0; qLeftEl.textContent = '0'; timeUp(); return; }
          qLeftEl.textContent = String(Math.ceil(qLeft));
        }
      };
    }
  });
})();
