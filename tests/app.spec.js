// @ts-check
const { test, expect } = require('@playwright/test');
const { openClean, startGame, noOverflow } = require('./helpers');

test.describe('網站整體', () => {

  test('首頁：標題、十張卡、難度標籤、挑戰進度', async ({ page }) => {
    const errors = await openClean(page);
    await expect(page.locator('.term-body h1')).toHaveText('IECS ARCADE');
    await expect(page.locator('.gcard')).toHaveCount(10);
    await expect(page.locator('.gcard-lv')).toHaveCount(10);

    // 第一次來的人要有明確起點
    await expect(page.locator('.gcard-pick')).toHaveCount(1);

    const notice = await page.locator('.notice').innerText();
    expect(notice).toContain('7,000');
    expect(notice).toContain('還差');

    // 打字機跑完才會長出統計
    await expect(page.locator('.hero-stat')).toHaveCount(3, { timeout: 12000 });
    await expect(page.locator('.hero-stat').nth(1)).toContainText('0 / 10');
    expect(errors).toEqual([]);
  });

  test('導覽列在任何寬度都不溢出，選單面板可開可關', async ({ page }) => {
    const errors = await openClean(page);
    for (const w of [1440, 1100, 900, 760, 600, 390]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(150);
      const bar = await page.evaluate(() => {
        const h = document.querySelector('.topbar');
        return { s: h.scrollWidth, c: h.clientWidth };
      });
      expect(bar.s, `${w}px 時頂列溢出`).toBeLessThanOrEqual(bar.c + 1);
      await noOverflow(page);
    }

    // 面板：開 → 裡面有全部十款 → Esc 關掉
    await page.setViewportSize({ width: 1280, height: 860 });
    const opener = page.locator('.navbtn');
    await opener.click();
    await expect(page.locator('.navpanel')).toBeVisible();
    await expect(page.locator('.navitem')).toHaveCount(10);
    await page.keyboard.press('Escape');
    await expect(page.locator('.navpanel')).toHaveCount(0);

    // 點面板裡的遊戲會跳轉並關閉
    await opener.click();
    await page.locator('.navitem').nth(2).click();
    await expect(page.locator('.navpanel')).toHaveCount(0);
    expect(page.url()).toContain('#/g/');
    expect(errors).toEqual([]);
  });

  test('路由：四個頁面都渲染得出來，未知遊戲會導回首頁', async ({ page }) => {
    const errors = await openClean(page);
    for (const [hash, sel] of [
      ['#/board', 'table.data, .empty'],
      ['#/about', '.about-grid'],
      ['#/settings', '.setrow'],
      ['#/', '.grid-games']
    ]) {
      await page.evaluate(h => { location.hash = h; }, hash);
      await expect(page.locator(sel).first()).toBeVisible();
    }
    await page.evaluate(() => { location.hash = '#/g/不存在的遊戲'; });
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/');
    expect(errors).toEqual([]);
  });

  test('排行榜：登錄、名次、暱稱驗證、CSV 匯出', async ({ page }) => {
    const errors = await openClean(page);

    const res = await page.evaluate(() => {
      const bad = CSE.scores.submit('binary', '   ', 100);
      const ok = CSE.scores.submit('binary', '小漁', 1234);
      const ok2 = CSE.scores.submit('binary', '阿明', 999);
      return { bad, ok, ok2, top: CSE.scores.top('binary', 5) };
    });
    expect(res.bad.ok).toBe(false);          // 空白暱稱要擋下
    expect(res.ok.rank).toBe(1);
    expect(res.ok2.rank).toBe(2);            // 分數低的排後面
    expect(res.top[0].n).toBe('小漁');

    await page.evaluate(() => { location.hash = '#/board?g=binary'; });
    await expect(page.locator('table.data').first()).toContainText('小漁');

    const csv = await page.evaluate(() => CSE.scores.exportCsv());
    expect(csv.charCodeAt(0)).toBe(0xFEFF);  // BOM，Excel 才不會亂碼
    expect(csv).toContain('game_id,game_name,rank,nickname,score,time_iso');
    expect(csv).toContain('小漁');
    expect(errors).toEqual([]);
  });

  test('總分 = 各款最佳分數加總，挑戰達標會換文案', async ({ page }) => {
    const errors = await openClean(page);
    const total = await page.evaluate(() => {
      CSE.scores.recordResult('binary', 500);
      CSE.scores.recordResult('binary', 300);   // 比較低的不該蓋掉最佳
      CSE.scores.recordResult('myth', 200);
      return { total: CSE.scores.total(), best: CSE.scores.best('binary') };
    });
    expect(total.best).toBe(500);
    expect(total.total).toBe(700);

    await page.evaluate(() => {
      CSE.games.forEach(g => CSE.scores.recordResult(g.id, 900));
      location.hash = '#/board';
    });
    await page.evaluate(() => { location.hash = '#/'; });
    await expect(page.locator('.notice')).toContainText('挑戰完成', { timeout: 12000 });
    expect(errors).toEqual([]);
  });

  test('設定：四個開關可切換並寫入儲存', async ({ page }) => {
    const errors = await openClean(page, '#/settings');
    const toggles = page.locator('.toggle');
    await expect(toggles).toHaveCount(4);

    const before = await page.evaluate(() => JSON.stringify(CSE.settings.all()));
    for (let i = 0; i < 4; i++) await toggles.nth(i).click();
    const after = await page.evaluate(() => JSON.stringify(CSE.settings.all()));
    expect(after).not.toBe(before);

    const stored = await page.evaluate(() => localStorage.getItem('cse.v1.settings'));
    expect(stored, '設定沒有寫進 localStorage').toBeTruthy();

    for (let i = 0; i < 4; i++) await toggles.nth(i).click();
    expect(await page.evaluate(() => JSON.stringify(CSE.settings.all()))).toBe(before);
    expect(errors).toEqual([]);
  });

  test('展示模式：閒置後會停掉遊戲並回首頁', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'sort');
    await page.evaluate(() => {
      CSE.settings.set('idle', 3);
      CSE.settings.set('kiosk', true);
    });
    await expect(page.locator('.attract')).toBeVisible({ timeout: 20000 });
    expect(await page.evaluate(() => location.hash)).toBe('#/');
    expect(await page.evaluate(() => CSE.host.busy)).toBe(false);

    await page.locator('.attract').click();
    await expect(page.locator('.attract')).toHaveCount(0);
    await page.evaluate(() => { CSE.settings.set('kiosk', false); CSE.settings.set('idle', 75); });
    expect(errors).toEqual([]);
  });

  test('儲存被擋住時不會整站壞掉', async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new DOMException('blocked', 'SecurityError'); }
      });
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/index.html');
    await page.waitForFunction(() => window.CSE && window.CSE.games.length === 10);
    await expect(page.locator('.gcard')).toHaveCount(10);

    // 退回記憶體後仍要能存取
    const roundTrip = await page.evaluate(() => {
      CSE.store.set('probe', { a: 1 });
      return JSON.stringify(CSE.store.get('probe'));
    });
    expect(roundTrip).toBe('{"a":1}');
    expect(await page.evaluate(() => CSE.store.ok)).toBe(false);

    await page.evaluate(() => { location.hash = '#/settings'; });
    await expect(page.locator('.notice')).toContainText('不允許存資料');
    expect(errors).toEqual([]);
  });

  test('遊戲時鐘不依賴 requestAnimationFrame', async ({ page }) => {
    const errors = await openClean(page);
    // 把 rAF 停掉，模擬視窗被蓋住 / 系統省電的情況
    await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
    await startGame(page, 'binary');
    const t0 = parseInt(await page.locator('.statbox.time b').innerText(), 10);
    await page.waitForTimeout(4000);
    const t1 = parseInt(await page.locator('.statbox.time b').innerText(), 10);
    expect(t0 - t1, 'rAF 停掉之後倒數就不動了').toBeGreaterThanOrEqual(3);
    expect(errors).toEqual([]);
  });

  test('結算畫面蓋上後，底下的遊戲不能再被操作', async ({ page }) => {
    const errors = await openClean(page);
    await startGame(page, 'myth');
    await page.evaluate(async () => {
      for (let i = 0; i < 16; i++) {
        if (document.querySelector('.bigscore')) return;
        const nx = document.querySelector('.my-wrap .btn--primary');
        if (nx && !nx.classList.contains('hidden')) { nx.click(); await new Promise(r => setTimeout(r, 110)); }
        const y = document.querySelector('.my-yes');
        if (y && !y.disabled) { y.click(); await new Promise(r => setTimeout(r, 110)); }
      }
    });
    await expect(page.locator('.bigscore')).toBeVisible({ timeout: 30000 });
    const inert = await page.evaluate(() =>
      document.querySelector('.gf-body').hasAttribute('inert'));
    expect(inert, '遊戲區沒有設成 inert').toBe(true);
    expect(errors).toEqual([]);
  });

  test('分享用的 meta 標籤齊全', async ({ page }) => {
    await page.goto('/index.html');
    const meta = await page.evaluate(() => {
      const get = s => (document.querySelector(s) || {}).content || '';
      return {
        title: document.title,
        ogTitle: get('meta[property="og:title"]'),
        ogImage: get('meta[property="og:image"]'),
        ogUrl: get('meta[property="og:url"]'),
        desc: get('meta[name="description"]'),
        build: document.documentElement.dataset.build
      };
    });
    expect(meta.title).toContain('IECS ARCADE');
    expect(meta.title).not.toContain('CSE');
    expect(meta.ogTitle).toContain('IECS');
    expect(meta.ogImage).toMatch(/^https:\/\/.+og\.png$/);
    expect(meta.ogUrl).toMatch(/^https:\/\//);
    expect(meta.desc.length).toBeGreaterThan(5);
    expect(meta.build, '缺少 data-build，自動更新偵測會失效').toBeTruthy();
  });

  test('資產版本章與 version.json 對得起來', async ({ page }) => {
    await page.goto('/index.html');
    const build = await page.evaluate(() => document.documentElement.dataset.build);
    const stamped = await page.evaluate(() =>
      [...document.querySelectorAll('script[src], link[href]')]
        .map(e => e.src || e.href)
        .filter(u => u.includes('/assets/'))
        .every(u => u.includes('?v=')));
    expect(stamped, '有資產沒有蓋版本章').toBe(true);

    const res = await page.request.get('/version.json');
    expect(res.ok()).toBe(true);
    expect((await res.json()).v).toBe(build);
  });
});
