'use strict';
const { chromium } = require('playwright');
const { mkdir, readFile, writeFile, readdir } = require('node:fs/promises');
const { createHash } = require('node:crypto');
const path = require('node:path');
(async () => {
  const output = process.env.CAPTURE_OUTPUT || '/tmp/terrace-captures',
    site = process.env.CAPTURE_SITE || 'capture-site';
  await mkdir(output, { recursive: true });
  const inputs = {};
  for (const f of [
    'index.html',
    ...(await readdir(path.join(site, 'assets'))).map((x) => 'assets/' + x),
  ])
    inputs[f] = createHash('sha256')
      .update(await readFile(path.join(site, f)))
      .digest('hex');
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.LOCAL_CHROME ? { executablePath: process.env.LOCAL_CHROME } : {}),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
      deviceScaleFactor: 1,
      locale: 'en-US',
      reducedMotion: 'reduce',
    });
    await page.goto('http://127.0.0.1:4272/', { waitUntil: 'domcontentloaded' });
    const roads = [];
    for (let x = 3; x <= 12; x++) roads.push([x, 6]);
    for (const x of [6, 10]) for (const y of [5, 7, 8, 9, 10]) roads.push([x, y]);
    async function place(tool, points) {
      await page.locator(`[data-tool="${tool}"]`).click();
      for (const [x, y] of points) {
        await page.locator('#column').fill(String(x));
        await page.locator('#row').fill(String(y));
        await page.locator('#locate').click();
        await page.locator('#apply').click();
      }
    }
    for (const tool of ['road', 'wire', 'pipe']) await place(tool, roads);
    for (const [tool, points] of [
      ['water', [[3, 5]]],
      ['power', [[4, 5]]],
      ['clinic', [[7, 5]]],
      ['fire', [[8, 5]]],
      [
        'residential',
        [
          [5, 5],
          [6, 4],
          [7, 7],
          [8, 7],
          [9, 5],
          [9, 7],
        ],
      ],
      [
        'commercial',
        [
          [11, 5],
          [12, 5],
          [11, 7],
          [12, 7],
          [9, 8],
          [11, 8],
        ],
      ],
    ])
      await place(tool, points);
    await page.locator('[data-overlay="city"]').click();
    for (let i = 0; i < 2; i++) await page.locator('#step').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(output, 'terrace-01.png'), animations: 'disabled' });
    for (let i = 0; i < 4; i++) await page.locator('#step').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(output, 'terrace-02.png'), animations: 'disabled' });
    await writeFile(
      path.join(output, 'capture.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          workflowCommit: process.env.GITHUB_SHA || null,
          sourceCommit: process.env.GAME_SOURCE_COMMIT || null,
          runId: process.env.GITHUB_RUN_ID || null,
          url: 'http://127.0.0.1:4272/',
          inputs,
          browser: browser.version(),
          viewport: { width: 1280, height: 1000 },
          screenshots: ['terrace-01.png', 'terrace-02.png'],
        },
        null,
        2,
      ) + '\n',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
