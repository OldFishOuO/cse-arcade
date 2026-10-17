/* ============================================================
   遊戲 7：資工系大誤解 — 快問快答，破解對資工系的迷思
   這款才是真正「認識資工系」的主菜，放在首頁第一張卡
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  /* ans: true = 這句話是對的；false = 這句話是錯的 */
  var Q = [
    {
      q: '資工系主要是在學電腦硬體維修和重灌系統',
      ans: false,
      say: '維修和重灌不是資工系的課。核心是程式設計、資料結構、演算法、作業系統、計算機網路這些「怎麼讓機器解決問題」的學問。'
    },
    {
      q: '沒學過寫程式的人也可以念資工系',
      ans: true,
      say: '大一的程式設計就是從零開始教。有基礎當然輕鬆一點，但系上的課程設計本來就假設你沒寫過。'
    },
    {
      q: '資工系幾乎不用碰數學',
      ans: false,
      say: '離散數學、線性代數、機率統計通常都是必修。演算法的正確性證明、機器學習的原理，底層都是數學。'
    },
    {
      q: '「資料結構」是在教怎麼整理電腦裡的資料夾',
      ans: false,
      say: '它教的是陣列、鏈結串列、堆疊、佇列、樹、雜湊表這些「資料在記憶體裡怎麼擺」。擺法不同，同一個程式可以快上千倍。'
    },
    {
      q: '資料結構與演算法幾乎是所有資工系的必修課',
      ans: true,
      say: '這兩門是資工系的共同語言，也是絕大多數軟體工程職缺面試一定會考的內容。'
    },
    {
      q: '資工系畢業只能當程式設計師',
      ans: false,
      say: '出路包含資安、資料科學、AI、晶片與嵌入式、遊戲與圖學、產品經理、研究、創業。技術是鑰匙，不是終點。'
    },
    {
      q: '版本控制工具 Git 在軟體業界幾乎是標準配備',
      ans: true,
      say: 'Git 記錄程式的每一次修改，讓多人能同時改同一個專案。幾乎所有軟體團隊都在用，很多系上課程也會要求。'
    },
    {
      q: '寫程式大多是一個人關在房間裡做的事',
      ans: false,
      say: '真實專案是團隊運動：分工、開會、程式碼審查、交接文件。溝通能力常常比寫得快更重要。'
    },
    {
      q: '一台電腦裡的 1 KB，在電腦科學裡常被當成 1024 bytes',
      ans: true,
      say: '因為電腦用二進位，1024 = 2¹⁰ 比 1000 更自然。（嚴格講 1000 bytes 叫 kB、1024 bytes 叫 KiB，但習慣上常混用。）'
    },
    {
      q: 'HTTP 狀態碼 404 代表「找不到這個資源」',
      ans: true,
      say: '404 Not Found。順便記一下：200 成功、301 永久搬家、403 沒權限、500 伺服器自己爆了。'
    },
    {
      q: '「作業系統」這門課是在教怎麼安裝 Windows',
      ans: false,
      say: '它教的是行程排程、記憶體管理、檔案系統、同步與死鎖 — 也就是 Windows / Linux / macOS 底下在忙什麼。'
    },
    {
      q: '只要學會一種程式語言，學第二種會快很多',
      ans: true,
      say: '語法是表面，真正難的是邏輯、資料結構和問題拆解。這些會跟著你走，所以第二、第三種語言通常幾週就能上手。'
    },
    {
      q: '因為 AI 會寫程式了，所以不用再學程式設計',
      ans: false,
      say: 'AI 會產生程式碼，但誰來判斷它寫得對不對、安不安全、效能夠不夠？看得懂、改得動、知道哪裡會錯，反而更值錢。'
    },
    {
      q: '資訊安全就是當駭客攻擊別人',
      ans: false,
      say: '資安大部分時間在「防守」：找出自家系統的漏洞、設計安全架構、處理事故。攻擊技術是用來測試自己的系統，而且必須有授權。'
    },
    {
      q: '「演算法」是一堆數學公式，背起來就會了',
      ans: false,
      say: '演算法是解題策略。重點是理解「為什麼這樣做比較快」，然後在新問題上自己想得出來 — 背不起來的。'
    },
    {
      q: '電腦裡所有的資料，最底層都是用 0 和 1 存的',
      ans: true,
      say: '文字、圖片、音樂、影片，最後都是一串 0 和 1。差別只在「用什麼規則去解讀它」，這叫編碼。'
    },
    {
      q: '一個程式跑得快不快，只跟電腦好不好有關',
      ans: false,
      say: '演算法的影響常常遠大於硬體。O(n²) 換成 O(n log n)，在一百萬筆資料上大約差五萬倍 — 換電腦換不出來。'
    },
    {
      q: '資工系的課幾乎都有實作作業，不只是考試',
      ans: true,
      say: '程式設計、資料結構、作業系統、網路、資料庫、專題，大多都要動手做出會跑的東西，期末專題更是整學期的硬仗。'
    },
    {
      q: '念資工系一定要很會玩電腦遊戲',
      ans: false,
      say: '完全沒關係。做遊戲和玩遊戲是兩件事 — 做遊戲要碰的是圖學、物理模擬、引擎架構。'
    },
    {
      q: '「Debug」這個說法，和早期電腦裡找到一隻蛾的故事有關',
      ans: true,
      say: '1947 年 Grace Hopper 團隊在 Mark II 電腦裡找到一隻飛蛾並記錄下來，讓「抓蟲 = 修錯」這個說法廣為流傳。'
    }
  ];

  var ROUND = 10, PER_Q = 10;

  CSE.registerGame({
    id: 'myth',
    name: '資工系大誤解',
    tag: '認識資工系 · MYTH',
    icon: '?!',
    accent: 'var(--pink)',
    blurb: '「資工系是不是在修電腦？」十題快問快答，三秒內判斷對錯，順手破解對資工系的誤會。',
    how: [
      '畫面出現一句關於資工系的話。',
      '判斷它是「對」還是「錯」，直接按大按鈕。',
      '每題 10 秒，越快答對分數越高，連對有加成。',
      '每題都有解說 — 答錯沒關係，看懂才是重點。'
    ],
    controls: '點按鈕；鍵盤左右方向鍵或 O / X 也可以',
    duration: 0,
    medals: { bronze: 700, silver: 1300, gold: 1900 },
    titles: ['路過的訪客', '略懂略懂', '資工系通', '系學會榮譽會員'],
    knowledge: {
      title: '所以資工系到底在幹嘛？',
      lines: [
        '一句話：學「如何用計算解決問題」，從 0 和 1 一路到 AI。',
        '必修大致是：程式設計 → 資料結構 → 演算法 → 計算機組織 → 作業系統 → 網路 → 資料庫。',
        '不需要先會寫程式，但需要願意花時間把一個東西想清楚。',
        '想了解更多可以到「關於資工系」看課程地圖，或直接問攤位上的學長姐。'
      ]
    },

    mount: function (stage, api) {
      var queue = CSE.util.shuffle(Q).slice(0, ROUND);
      var qi = -1, right = 0, wrong = 0, streak = 0, bestStreak = 0;
      var locked = true, qLeft = 0;

      var qEl = api.el('div', { class: 'my-q' });
      var barIn = api.el('i', { style: { width: '0%' } });
      var fb = api.el('div', { class: 'my-fb', text: '看完這句話，判斷它是對還是錯。' });
      var btnYes = api.el('button', {
        type: 'button', class: 'btn my-yes', onclick: function () { answer(true); }
      }, [api.el('span', { text: '○ 對' }), api.el('small', { text: 'TRUE' })]);
      var btnNo = api.el('button', {
        type: 'button', class: 'btn my-no', onclick: function () { answer(false); }
      }, [api.el('span', { text: '✕ 錯' }), api.el('small', { text: 'FALSE' })]);
      var nextBtn = api.el('button', {
        type: 'button', class: 'btn btn--primary hidden', text: '下一題',
        onclick: function () { api.sfx.play('click'); nextQ(); }
      });
      var counter = api.el('div', { class: 'faint center', style: { fontSize: '12px' }, text: '' });

      stage.appendChild(api.el('div', { class: 'my-wrap' }, [
        counter,
        api.el('div', { class: 'my-bar' }, barIn),
        qEl,
        api.el('div', { class: 'my-btns' }, [btnYes, btnNo]),
        fb,
        api.el('div', { class: 'row', style: { justifyContent: 'center' } }, [nextBtn])
      ]));

      function answer(said) {
        if (locked) return;
        locked = true;
        var item = queue[qi];
        var ok = (said === item.ans);
        btnYes.disabled = true;
        btnNo.disabled = true;
        nextBtn.classList.remove('hidden');

        if (ok) {
          right++; streak++;
          bestStreak = Math.max(bestStreak, streak);
          var speed = Math.max(0, Math.round(qLeft * 9));
          var gain = 100 + speed + 15 * Math.min(streak - 1, 6);
          api.addScore(gain);
          api.sfx.play(streak >= 3 ? 'great' : 'ok');
          fb.className = 'my-fb right';
          fb.innerHTML = '<span class="verdict">✓ 答對了（+' + gain + '）' +
            (streak > 1 ? '　' + streak + ' 連對' : '') + '</span>' + CSE.ui.esc(item.say);
        } else {
          wrong++; streak = 0;
          api.sfx.play('bad');
          fb.className = 'my-fb wrong';
          fb.innerHTML = '<span class="verdict">✕ 這句話其實是「' + (item.ans ? '對' : '錯') + '」的</span>' +
            CSE.ui.esc(item.say);
        }
        api.setStat('連對', streak);
      }

      function timeUp() {
        if (locked) return;
        locked = true;
        wrong++; streak = 0;
        btnYes.disabled = true;
        btnNo.disabled = true;
        nextBtn.classList.remove('hidden');
        api.sfx.play('bad');
        var item = queue[qi];
        fb.className = 'my-fb wrong';
        fb.innerHTML = '<span class="verdict">⏱ 時間到 — 答案是「' + (item.ans ? '對' : '錯') + '」</span>' +
          CSE.ui.esc(item.say);
        api.setStat('連對', 0);
      }

      function nextQ() {
        qi++;
        if (qi >= queue.length) {
          api.finish({
            reason: 'cleared',
            stats: [
              { k: '答對', v: right + ' / ' + queue.length },
              { k: '最高連對', v: bestStreak },
              { k: '正確率', v: Math.round(right / queue.length * 100) + '%' }
            ]
          });
          return;
        }
        locked = false;
        qLeft = PER_Q;
        btnYes.disabled = false;
        btnNo.disabled = false;
        nextBtn.classList.add('hidden');
        counter.textContent = '第 ' + (qi + 1) + ' / ' + queue.length + ' 題';
        qEl.textContent = '「' + queue[qi].q + '」';
        fb.className = 'my-fb';
        fb.textContent = '看完這句話，判斷它是對還是錯。';
        api.hint('');
      }

      api.on(document, 'keydown', function (e) {
        if (locked) {
          if (e.key === 'Enter' && !nextBtn.classList.contains('hidden')) { e.preventDefault(); nextQ(); }
          return;
        }
        var k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'o' || k === '1') { e.preventDefault(); answer(true); }
        if (k === 'arrowright' || k === 'x' || k === '2') { e.preventDefault(); answer(false); }
      });

      api.onResult(function () {
        return {
          stats: [
            { k: '答對', v: right + ' 題' },
            { k: '答錯', v: wrong + ' 題' },
            { k: '最高連對', v: bestStreak }
          ]
        };
      });

      api.setStat('連對', 0);
      nextQ();

      /* 用 onTick（真實時鐘）而不是 onFrame（rAF）：
         視窗被蓋住時 rAF 可能完全不跑，每題倒數會卡住。 */
      return {
        onTick: function (dt) {
          if (locked) return;
          qLeft -= dt;
          barIn.style.width = Math.max(0, Math.min(100, (1 - qLeft / PER_Q) * 100)) + '%';
          if (qLeft <= 0) { qLeft = 0; timeUp(); }
        }
      };
    }
  });
})();
