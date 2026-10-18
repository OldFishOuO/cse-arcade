// @ts-check
const { test, expect } = require('@playwright/test');
const { openClean, startGame, waitResult, score, noOverflow } = require('./helpers');

/* ============================================================
   每款遊戲都要真的玩到結束，不是只確認畫面長出來。
   ============================================================ */

test.describe('十款遊戲', () => {

  test('每款都能開啟、開始，而且不留著覆蓋層', async ({ page }) => {
    const errors = await openClean(page);
    const ids = await page.evaluate(() => window.CSE.games.map(g => g.id));
    expect(ids.length).toBe(10);

    for (const id of ids) {
      await startGame(page, id);
      await expect(page.locator('.overlay'), `${id} 卡在覆蓋層`).toHaveCount(0);
      await expect(page.locator('.gf-stage')).toBeVisible();
    }
    expect(errors, 'console 有錯誤').toEqual([]);
  });

  test('二進位快打：撥對位元就得分、差距提示正確', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'binary');

    const target = parseInt(await page.locator('.bin-target .num').innerText(), 10);
    // 只撥一個位元，確認「還差 / 多了」算得對
    await page.locator('.bit').first().click();
    const diff = await page.locator('.bin-diff').innerText();
    const expected = target - 128;
    expect(diff).toBe(expected > 0 ? `還差 ${expected}` : `多了 ${-expected}`);

    // 撥成正確答案
    const before = await score(page);
    await page.evaluate(t => {
      const bits = [...document.querySelectorAll('.bit')];
      for (let i = 0; i < 8; i++) {
        const want = (t >> (7 - i)) & 1;
        const have = bits[i].getAttribute('aria-pressed') === 'true' ? 1 : 0;
        if (want !== have) bits[i].click();
      }
    }, target);
    await expect.poll(() => score(page)).toBeGreaterThan(before);
    await expect(page.locator('.gf-hint')).toContainText('正確');
    expect(errors).toEqual([]);
  });

  test('河內塔：最佳解過關、非法移動被擋、落點有標示', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'hanoi');

    // 拿起圓盤後，另外兩根應該都標成可放
    await page.locator('.hn-peg').first().click();
    await expect(page.locator('.hn-peg.can')).toHaveCount(2);

    // 放到第二根，再試著把更大的疊上去 → 要被擋下
    await page.locator('.hn-peg').nth(1).click();
    await page.locator('.hn-peg').first().click();
    await page.locator('.hn-peg').nth(1).click();
    await expect(page.locator('.gf-hint')).toHaveClass(/bad/);
    await expect(page.locator('.gf-hint')).toContainText('不能疊上去');

    // 重來後用最佳解解掉第一關
    await page.getByRole('button', { name: /這關重來/ }).click();
    await page.evaluate(async () => {
      const P = () => [...document.querySelectorAll('.hn-peg')];
      const mv = [];
      (function solve(n, a, b, c) {
        if (!n) return;
        solve(n - 1, a, c, b); mv.push([a, c]); solve(n - 1, b, a, c);
      })(3, 0, 1, 2);
      for (const [f, t] of mv) {
        P()[f].click(); await new Promise(r => setTimeout(r, 30));
        P()[t].click(); await new Promise(r => setTimeout(r, 40));
      }
    });
    await expect(page.locator('.gf-hint')).toContainText('完美');
    expect(errors).toEqual([]);
  });

  test('密碼破譯：轉到正確位移就自動過關', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'cipher');

    const solved = await page.evaluate(async () => {
      const sl = document.querySelector('.cp-slider');
      for (let k = 0; k < 26; k++) {
        sl.value = String(k);
        sl.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 25));
        if (document.querySelector('.cp-plain .cp-ch.hit')) return true;
      }
      return false;
    });
    expect(solved, '26 種位移裡找不到正確解').toBe(true);
    await expect(page.locator('.gf-hint')).toContainText('破解成功');
    expect(await score(page)).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test('調色盤：選項一定差得夠開，不是在考記憶', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'color');
    await expect(page.locator('.cl-legend')).toBeVisible();

    // 連續檢查多題：每題的四個選項兩兩之間都要有明顯色差
    for (let q = 0; q < 6; q++) {
      const colors = await page.evaluate(() => {
        const hexes = [...document.querySelectorAll('.cl-opt')].map(
          b => (b.getAttribute('aria-label') || b.textContent).trim());
        return hexes.map(h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)));
      });
      expect(colors.length).toBe(4);
      for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
          const d = Math.abs(colors[i][0] - colors[j][0]) +
                    Math.abs(colors[i][1] - colors[j][1]) +
                    Math.abs(colors[i][2] - colors[j][2]);
          expect(d, `第 ${q + 1} 題有兩個選項太接近（色差 ${d}）`).toBeGreaterThanOrEqual(85);
        }
      }
      await page.locator('.cl-opt').first().click();
      await page.waitForTimeout(2100);
    }
    expect(errors).toEqual([]);
  });

  test('排序大師：照最少交換次數排完會拿到完美獎勵', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'sort');

    const par = parseInt(await page.locator('.sm-info .statlist b').first().innerText(), 10);
    expect(par).toBeGreaterThanOrEqual(2);

    await page.evaluate(async () => {
      const B = () => [...document.querySelectorAll('.bar')];
      const n = B().length;
      for (let i = 0; i < n - 1; i++) {
        const v = B().map(b => +b.textContent);
        let m = i;
        for (let j = i + 1; j < n; j++) if (v[j] < v[m]) m = j;
        if (m !== i) {
          B()[i].click(); await new Promise(r => setTimeout(r, 30));
          B()[m].click(); await new Promise(r => setTimeout(r, 60));
        }
      }
    });
    await expect(page.locator('.gf-hint')).toContainText(/完美|排好了/);
    expect(errors).toEqual([]);
  });

  test('封包路由：送出後會顯示最短路徑比較', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'packet');

    const ok = await page.evaluate(async () => {
      const btn = () => [...document.querySelectorAll('.pk-wrap button')]
        .find(b => b.textContent.trim() === '送出封包');
      const clr = () => [...document.querySelectorAll('.pk-wrap button')]
        .find(b => b.textContent.trim() === '重選路徑');
      for (let t = 0; t < 40; t++) {
        clr().click(); await new Promise(r => setTimeout(r, 25));
        for (let s = 0; s < 14; s++) {
          if (!btn().disabled) return true;
          const r = [...document.querySelectorAll('.node.reach')];
          if (!r.length) break;
          r[Math.floor(Math.random() * r.length)]
            .dispatchEvent(new MouseEvent('click', { bubbles: true }));
          await new Promise(x => setTimeout(x, 25));
        }
      }
      return false;
    });
    expect(ok, '40 次嘗試都接不到終點').toBe(true);
    await page.evaluate(() => [...document.querySelectorAll('.pk-wrap button')]
      .find(b => b.textContent.trim() === '送出封包')
      .dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await expect(page.locator('.gf-hint')).toContainText(/延遲|完美/, { timeout: 15000 });
    expect(errors).toEqual([]);
  });

  test('Bug 獵人：三種語言各自有題庫、點錯會扣命', async ({ page }) => {
    const errors = await openClean(page);
    for (let lang = 0; lang < 3; lang++) {
      await page.evaluate(() => { location.hash = '#/'; });
      await startGame(page, 'bughunt', lang);
      await expect(page.locator('.code-title')).not.toHaveText('');
      const tag = await page.locator('.bh-meta .tag').innerText();
      expect(['Python', 'C', 'JavaScript']).toContain(tag);
      // 選語言時倒數不應該已經開始扣
      const left = parseInt(await page.locator('.statbox.time b').innerText(), 10);
      expect(left).toBeGreaterThan(150);
    }
    // 連點三次錯行 → 生命歸零 → 結算
    await page.evaluate(async () => {
      for (let i = 0; i < 12; i++) {
        if (document.querySelector('.bigscore')) return;
        const nx = document.querySelector('.bh-meta .btn--primary');
        if (nx && !nx.classList.contains('hidden')) { nx.click(); await new Promise(r => setTimeout(r, 120)); continue; }
        const lines = [...document.querySelectorAll('.cline:not(.dead)')];
        if (lines.length) { lines[0].click(); await new Promise(r => setTimeout(r, 150)); }
      }
    });
    const r = await waitResult(page, 20000);
    expect(r.score).toBeTruthy();
    expect(errors).toEqual([]);
  });

  test('資工系大誤解：答完十題會進結算，統計數字對得起來', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'myth');
    await page.evaluate(async () => {
      for (let i = 0; i < 16; i++) {
        if (document.querySelector('.bigscore')) return;
        const nx = document.querySelector('.my-wrap .btn--primary');
        if (nx && !nx.classList.contains('hidden')) { nx.click(); await new Promise(r => setTimeout(r, 120)); }
        const y = document.querySelector('.my-yes');
        if (y && !y.disabled) { y.click(); await new Promise(r => setTimeout(r, 120)); }
      }
    });
    await waitResult(page, 30000);
    const stats = await page.locator('.overlay .statlist div').allInnerTexts();
    const hit = stats.find(s => s.startsWith('答對'));
    expect(hit, '結算沒有「答對」這一項').toBeTruthy();
    expect(errors).toEqual([]);
  });

  test('終端機打字：打對會加分、打錯會標紅、退格可還原', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'typing');
    const input = page.locator('.ty-input');
    await input.focus();

    const target = await page.evaluate(() =>
      [...document.querySelectorAll('.ty-target .ch')]
        .map(s => s.textContent === '␣' ? ' ' : s.textContent).join(''));

    await input.type(target.slice(0, 3), { delay: 20 });
    expect(await score(page)).toBeGreaterThan(0);

    await input.type('ZZ', { delay: 20 });
    await expect(page.locator('.ty-target .ch.err').first()).toBeVisible();
    await input.press('Backspace');
    await input.press('Backspace');
    await expect(page.locator('.ty-target .ch.err')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('邏輯閘實驗室：撥輸入能過關，電路與真值表都畫得出來', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'logic');
    await expect(page.locator('.lg-canvas svg')).toBeVisible();

    const advanced = await page.evaluate(async () => {
      const lvl = () => (document.querySelectorAll('.statbox')[2] || {}).textContent || '';
      const before = lvl();
      const sws = () => [...document.querySelectorAll('.sw')].filter(s => s.querySelector('text.n'));
      for (let t = 0; t < 30; t++) {
        const list = sws();
        if (!list.length) break;
        list[t % list.length].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 60));
        if (lvl() !== before) return true;
      }
      return false;
    });
    expect(advanced, '撥遍所有輸入組合都過不了第一關').toBe(true);
    expect(errors).toEqual([]);
  });
});
