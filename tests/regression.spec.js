// @ts-check
const { test, expect } = require('@playwright/test');
const { openClean, startGame } = require('./helpers');

/* ============================================================
   回歸測試：修過的 bug 不要再犯。
   ============================================================ */

test.describe('回歸', () => {

  /* 遊戲結束後，遊戲自己的鍵盤監聽還活著，
     會把按鍵吃掉（preventDefault），害結算畫面的暱稱打不出來。 */
  const typingCases = [
    { id: 'binary', nick: '阿明123', why: '二進位用 1–8 切換位元' },
    { id: 'hanoi', nick: '小明12', why: '河內塔用 1–3 選柱子' },
    { id: 'color', nick: 'ABC34', why: '調色盤用 1–4 選答案' },
    { id: 'myth', nick: 'ox12 玩家', why: '迷思破解用 o / x / 1 / 2 作答' }
  ];

  for (const c of typingCases) {
    test(`結算畫面能正常輸入暱稱（${c.id}：${c.why}）`, async ({ page }) => {
      const errors = await openClean(page);
      await startGame(page, c.id);

      // 直接結束這一局
      await page.evaluate(() => CSE.host.current
        ? CSE.host.current.api.finish({ reason: 'timeout' })
        : null);
      await expect(page.locator('.namebox input')).toBeVisible({ timeout: 15000 });

      const input = page.locator('.namebox input');
      await input.click();
      await input.fill('');
      await input.pressSequentially(c.nick, { delay: 25 });
      await expect(input, `${c.id} 結束後打不出完整暱稱`).toHaveValue(c.nick);
      expect(errors).toEqual([]);
    });
  }

  test('終端機打字結束後，空白鍵不應該被吃掉', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'typing');
    await page.evaluate(() => CSE.host.current.api.finish({ reason: 'timeout' }));
    await expect(page.locator('.namebox input')).toBeVisible({ timeout: 15000 });

    const input = page.locator('.namebox input');
    await input.click();
    await input.fill('');
    await input.pressSequentially('小 明', { delay: 25 });
    await expect(input, '空白鍵被 preventDefault 吃掉了').toHaveValue('小 明');
    expect(errors).toEqual([]);
  });

  test('密碼破譯結束後，方向鍵仍能在輸入框裡移動游標', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'cipher');
    await page.evaluate(() => CSE.host.current.api.finish({ reason: 'timeout' }));
    await expect(page.locator('.namebox input')).toBeVisible({ timeout: 15000 });

    const input = page.locator('.namebox input');
    await input.click();
    await input.fill('AC');
    await input.press('ArrowLeft');
    await input.pressSequentially('B');
    await expect(input, '方向鍵被吃掉，游標移不動').toHaveValue('ABC');
    expect(errors).toEqual([]);
  });

  test('遊戲結束後，原本的遊戲畫面不該再因按鍵而改變', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'binary');
    await page.evaluate(() => CSE.host.current.api.finish({ reason: 'timeout' }));
    await expect(page.locator('.bigscore')).toBeVisible({ timeout: 15000 });

    const before = await page.evaluate(() =>
      [...document.querySelectorAll('.bit')].map(b => b.getAttribute('aria-pressed')).join(''));
    await page.keyboard.press('1');
    await page.keyboard.press('5');
    const after = await page.evaluate(() =>
      [...document.querySelectorAll('.bit')].map(b => b.getAttribute('aria-pressed')).join(''));
    expect(after, '結束後按鍵還是改動了遊戲狀態').toBe(before);
    expect(errors).toEqual([]);
  });
});
