/* ============================================================
   遊戲 9：密碼破譯 — 轉動位移盤，把加密訊息還原
   教的是：凱撒密碼、暴力破解、為什麼現代加密不能這樣做
   ============================================================ */
(function () {
  'use strict';
  var CSE = window.CSE;

  /* 都是常見的資工詞彙，不需要很好的英文也猜得出來 */
  var MESSAGES = [
    { t: 'HELLO WORLD', z: '每個程式設計師的第一支程式' },
    { t: 'OPEN SOURCE', z: '開放原始碼' },
    { t: 'BINARY CODE', z: '二進位碼' },
    { t: 'STACK OVERFLOW', z: '堆疊溢位，也是工程師最愛的問答網站' },
    { t: 'NULL POINTER', z: '空指標，C 語言的經典錯誤' },
    { t: 'COMPUTER SCIENCE', z: '計算機科學' },
    { t: 'INFINITE LOOP', z: '無限迴圈' },
    { t: 'PUBLIC KEY', z: '公開金鑰，現代加密的基礎' },
    { t: 'SOURCE CODE', z: '原始碼' },
    { t: 'DATA STRUCTURE', z: '資料結構' },
    { t: 'MACHINE LEARNING', z: '機器學習' },
    { t: 'FENG CHIA IECS', z: '逢甲資工' },
    { t: 'BUFFER OVERFLOW', z: '緩衝區溢位，經典的資安漏洞' },
    { t: 'HASH FUNCTION', z: '雜湊函式' },
    { t: 'DEEP LEARNING', z: '深度學習' },
    { t: 'OPERATING SYSTEM', z: '作業系統' }
  ];

  var A = 'A'.charCodeAt(0);

  function shiftText(text, k) {
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c >= 65 && c <= 90) out += String.fromCharCode((c - A + k + 26) % 26 + A);
      else out += text.charAt(i);
    }
    return out;
  }

  CSE.registerGame({
    id: 'cipher',
    name: '密碼破譯',
    tag: '資訊安全 · CIPHER',
    icon: '🔑',
    accent: 'var(--amber)',
    level: '普通',
    blurb: '兩千年前凱撒大帝用的加密法：每個字母往後移幾位。轉動位移盤，把訊息還原成看得懂的英文。',
    how: [
      '上方是被加密的訊息，每個字母都被往後移了固定位數。',
      '用 ◀ ▶ 或拖動滑桿改變位移量，下方的解密結果會即時變化。',
      '轉到變成看得懂的英文就自動過關 —— 不用按確認。',
      '限時 75 秒，解開越多分數越高。看不出來可以按提示。'
    ],
    controls: '點 ◀ ▶ 或拉滑桿；鍵盤左右方向鍵也可以',
    duration: 75,
    medals: { bronze: 500, silver: 1000, gold: 1600 },
    titles: ['體驗組', '密碼學徒', '破譯高手', '資安鬼才'],
    knowledge: {
      title: '為什麼凱撒密碼現在沒人用？',
      lines: [
        '英文只有 26 個字母，位移最多 25 種 —— 全部試一遍只要 25 次，這叫暴力破解。',
        '你剛剛轉盤的動作，就是電腦做暴力破解時在做的事，只是它一秒能試幾十億次。',
        '更快的方法是頻率分析：英文裡 E 最常出現，找出密文中最常見的字母就猜得到位移。',
        '現代加密（像 AES、RSA）的金鑰空間大到用全世界的電腦跑到宇宙終結也試不完。'
      ]
    },

    mount: function (stage, api) {
      var pool = CSE.util.shuffle(MESSAGES);
      var pi = 0;
      var plain = '', key = 0, shift = 0;
      var solved = 0, hintsUsed = 0, skipped = 0;
      var qStart = 0, locked = false;

      var cipherEl = api.el('div', { class: 'cp-cipher' });
      var plainEl = api.el('div', { class: 'cp-plain' });
      var dialNum = api.el('b', { text: '0' });
      var slider = api.el('input', {
        type: 'range', min: '0', max: '25', value: '0', step: '1',
        class: 'cp-slider', 'aria-label': '位移量'
      });
      var hintEl = api.el('div', { class: 'cp-hint faint' });

      function mk(label, delta) {
        return api.el('button', {
          type: 'button', class: 'btn cp-arrow', text: label,
          onclick: function () { setShift(shift + delta); api.sfx.play('click'); }
        });
      }

      var btnHint = api.el('button', {
        type: 'button', class: 'btn btn--sm', text: '提示（−60）',
        onclick: function () {
          if (locked) return;
          hintsUsed++;
          api.addScore(-60);
          api.sfx.play('click');
          hintEl.textContent = '提示：' + pool[(pi - 1 + pool.length) % pool.length].z +
            '　·　第一個字母是 ' + plain.charAt(0);
        }
      });
      var btnSkip = api.el('button', {
        type: 'button', class: 'btn btn--sm', text: '跳過（−30）',
        onclick: function () {
          if (locked) return;
          skipped++;
          api.addScore(-30);
          api.sfx.play('bad');
          api.hint('答案是「' + plain + '」', 'bad');
          nextMessage();
        }
      });

      stage.appendChild(api.el('div', { class: 'cp-wrap' }, [
        api.el('div', { class: 'cp-label', text: '加密訊息' }),
        cipherEl,
        api.el('div', { class: 'cp-dial' }, [
          mk('◀', -1),
          api.el('div', { class: 'cp-dialnum' }, ['位移 ', dialNum]),
          mk('▶', 1)
        ]),
        slider,
        api.el('div', { class: 'cp-label', text: '解密結果' }),
        plainEl,
        hintEl,
        api.el('div', { class: 'row', style: { justifyContent: 'center' } }, [btnHint, btnSkip])
      ]));

      slider.addEventListener('input', function () {
        setShift(parseInt(slider.value, 10) || 0);
      });

      function setShift(v) {
        if (locked) return;
        shift = ((v % 26) + 26) % 26;
        slider.value = String(shift);
        dialNum.textContent = String(shift);
        paint();
      }

      function paint() {
        var cipher = shiftText(plain, key);
        var decoded = shiftText(cipher, -shift);
        CSE.ui.clear(plainEl);
        for (var i = 0; i < decoded.length; i++) {
          var ch = decoded.charAt(i);
          plainEl.appendChild(api.el('span', {
            class: 'cp-ch' + (ch === ' ' ? ' sp' : '') + (decoded === plain ? ' hit' : ''),
            text: ch === ' ' ? ' ' : ch
          }));
        }
        if (decoded === plain) win();
      }

      function win() {
        if (locked) return;
        locked = true;
        solved++;
        var spent = (performance.now() - qStart) / 1000;
        var speed = Math.max(0, Math.round((18 - spent) * 10));
        var gain = 160 + speed;
        api.addScore(gain);
        api.setStat('破解', solved);
        api.sfx.play('great');
        api.hint('破解成功！位移 ' + key + '　+' + gain + ' 分　·　' +
          pool[(pi - 1 + pool.length) % pool.length].z, 'good');
        api.after(1400, nextMessage);
      }

      function nextMessage() {
        if (pi >= pool.length) { pool = CSE.util.shuffle(MESSAGES); pi = 0; }
        var item = pool[pi++];
        plain = item.t;
        key = CSE.util.randInt(3, 23);          /* 避開 0，不然一開始就是答案 */
        locked = false;
        hintEl.textContent = '';
        qStart = performance.now();

        var cipher = shiftText(plain, key);
        CSE.ui.clear(cipherEl);
        for (var i = 0; i < cipher.length; i++) {
          var ch = cipher.charAt(i);
          cipherEl.appendChild(api.el('span', {
            class: 'cp-ch' + (ch === ' ' ? ' sp' : ''),
            text: ch === ' ' ? ' ' : ch
          }));
        }
        /* 起始位移隨機，但不能剛好等於答案 */
        var start;
        do { start = CSE.util.randInt(0, 25); } while (start === key);
        setShift(start);
      }

      api.on(document, 'keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); setShift(shift - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); setShift(shift + 1); }
      });

      api.onResult(function () {
        return {
          stats: [
            { k: '破解', v: solved + ' 則' },
            { k: '跳過', v: skipped + ' 則' },
            { k: '用提示', v: hintsUsed + ' 次' }
          ]
        };
      });

      api.setStat('破解', 0);
      nextMessage();
    }
  });
})();
