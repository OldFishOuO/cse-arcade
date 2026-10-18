// @ts-check
const { expect } = require('@playwright/test');

/** 乾淨地開一個頁面：清掉本機紀錄，並攔截所有 console 錯誤 */
async function openClean(page, hash = '#/') {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  await page.goto('/index.html');
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
  await page.goto('/index.html' + hash);
  await page.waitForFunction(() => window.CSE && window.CSE.games && window.CSE.games.length > 0);
  return errors;
}

/** 進到某款遊戲並按下開始；Bug 獵人會多一步選語言 */
async function startGame(page, id, lang = 0) {
  await page.evaluate(g => { location.hash = '#/g/' + g; }, id);
  await page.locator('.overlay .btn--primary').waitFor({ state: 'visible' });
  await page.locator('.overlay .btn--primary').click();
  await page.locator('.overlay').waitFor({ state: 'detached' });
  if (id === 'bughunt') {
    await page.locator('.langcard').first().waitFor({ state: 'visible' });
    await page.locator('.langcard').nth(lang).click();
    await page.locator('.code').waitFor({ state: 'visible' });
  }
}

/** 等結算畫面出現（代表這一局真的跑到結束） */
async function waitResult(page, timeout = 60000) {
  await page.locator('.bigscore').waitFor({ state: 'visible', timeout });
  return {
    score: await page.locator('.bigscore').innerText(),
    rank: await page.locator('.rank-title').innerText(),
    kicker: await page.locator('.overlay .kicker').first().innerText()
  };
}

/** 讀目前分數 */
function score(page) {
  return page.locator('.statbox.score b').innerText().then(t => parseInt(t.replace(/,/g, ''), 10));
}

/** 檢查頁面沒有橫向溢出 */
async function noOverflow(page) {
  const o = await page.evaluate(() => {
    const d = document.documentElement;
    return { scroll: d.scrollWidth, client: d.clientWidth };
  });
  expect(o.scroll, `橫向溢出：${o.scroll} > ${o.client}`).toBeLessThanOrEqual(o.client + 1);
}

module.exports = { openClean, startGame, waitResult, score, noOverflow };
