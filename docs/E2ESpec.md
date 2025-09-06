# Electron + Playwright E2E Testing Guide

A concise, step‑by‑step guide to implement reliable end‑to‑end tests that drive your Electron app like a user (clicking UI, typing, switching tabs) and fail tests on any console errors in the renderer.

---

## 1) Overview

* **Goal:** Automate user flows in your Electron app and automatically fail tests when the renderer logs errors or the app crashes.
* **Tooling:** \[Playwright Test] with its built‑in Electron launcher (`_electron`).
* **Works in:** Local dev (headed/headless) and CI (via Xvfb on Linux).

---

## 2) Prerequisites

* Node.js ≥ 18 (recommend 20 LTS)
* Your Electron app runs with `electron .` at the project root (where `main.js/ts` is).
* TypeScript is recommended (examples below use TS), but JS works too.

---

## 3) Install & Scaffold

```bash
npm i -D @playwright/test
# For Linux CI (installs OS deps for browsers & Electron sandbox)
npx playwright install-deps
# Install Playwright binaries (even though we launch Electron, artifacts & tools need this)
npx playwright install
```

Create Playwright config:

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
});
```

`package.json` scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 4) App Test Mode (Highly Recommended)

Run your app in a dedicated **E2E mode** to keep tests isolated and predictable. In `main.ts` (or `main.js`):

```ts
// main.ts (excerpt)
import path from 'node:path';
import { app, BrowserWindow } from 'electron';

const isE2E = process.env.E2E === '1';

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load your app URL or file
  await win.loadURL('file://' + path.join(__dirname, 'index.html'));

  if (isE2E) {
    // Optional: open devtools for debugging local runs
    // win.webContents.openDevTools();

    // Route logs to disk or IPC if desired
  }
}

app.whenReady().then(createWindow);
```

Also ensure your preload or renderer forwards critical errors if needed.

---

## 5) Stable Selectors Strategy

Prefer **semantic selectors** that survive refactors:

* `getByRole('button', { name: 'New File' })`
* `getByLabel('Username')`
* `getByPlaceholder('Search')`
* `getByTestId('…')` (add `data-testid` to elements that lack good roles/labels)

Example React snippet:

```tsx
<button aria-label="New File" data-testid="btn-new-file">New File</button>
```

---

## 6) A First Test: Launch Electron and Assert No Console Errors

Create `tests/app.e2e.spec.ts`:

```ts
import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';

let app: ElectronApplication;
let page: Page;
const consoleErrors: string[] = [];

test.beforeAll(async () => {
  app = await electron.launch({
    executablePath: process.platform === 'win32'
      ? 'node_modules/.bin/electron.cmd'
      : 'node_modules/.bin/electron',
    args: ['.'],
    env: { ...process.env, E2E: '1', NODE_ENV: 'test' }
  });

  page = await app.firstWindow();

  // Capture renderer console errors & page errors
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(String(err)));
});

test.afterAll(async () => {
  await app.close();
});

// Example happy-path user flow
test('user creates a new file and sees content; no console errors', async () => {
  await page.waitForLoadState('domcontentloaded');

  // Example user actions – replace selectors with your UI
  await page.getByRole('button', { name: 'New File' }).click();
  await page.getByPlaceholder('Untitled').fill('hello world');
  await expect(page.getByText('hello world')).toBeVisible();

  // Optional: query Electron main process values
  const version = await app.evaluate(({ app }) => app.getVersion());
  expect(version).toMatch(/\d+\.\d+\.\d+/);

  // Fail if any renderer console errors occurred
  expect(consoleErrors, `Renderer console errors:\n${consoleErrors.join('\n')}`)
    .toHaveLength(0);
});
```

---

## 7) Watching for Main‑Process Crashes

Playwright won’t automatically fail if the main process exits; add a guard:

```ts
// In beforeAll after launching `app`:
const proc = app.process();
proc.on('exit', code => {
  throw new Error(`Electron main process exited unexpectedly with code ${code}`);
});
```

For structured main‑process logs, write to a temp file in E2E mode and read/validate it in `afterAll`.

---

## 8) Useful Test Utilities (optional)

**helpers/e2e.ts**

```ts
import { ElectronApplication, Page } from '@playwright/test';

export async function launchElectronE2E(_electron: any) {
  const app: ElectronApplication = await _electron.launch({
    executablePath: process.platform === 'win32'
      ? 'node_modules/.bin/electron.cmd'
      : 'node_modules/.bin/electron',
    args: ['.'],
    env: { ...process.env, E2E: '1', NODE_ENV: 'test' },
  });
  const page: Page = await app.firstWindow();
  return { app, page };
}

export function captureRendererErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(String(err)));
  return errors;
}
```

Use in tests:

```ts
import { test, expect, _electron as electron } from '@playwright/test';
import { launchElectronE2E, captureRendererErrors } from '../helpers/e2e';

test('flow', async () => {
  const { app, page } = await launchElectronE2E(electron);
  const errors = captureRendererErrors(page);

  await page.getByRole('button', { name: 'Open' }).click();
  // ... assertions ...

  expect(errors).toHaveLength(0);
  await app.close();
});
```

---

## 9) Network & Data Isolation

* Use `E2E=1` to switch your app to test stubs: fake file paths, ephemeral storage, local fixtures.
* For renderer HTTP calls, stub within tests:

```ts
await page.route('**/api/*', route => {
  if (route.request().url().endsWith('/api/projects')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  }
  return route.continue();
});
```

---

## 10) CI: GitHub Actions (Linux via Xvfb)

```yaml
# .github/workflows/e2e.yml
name: e2e
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install-deps
      - run: npx playwright install
      - name: Run E2E
        run: xvfb-run -a npm run test:e2e
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
```

Notes:

* `xvfb-run -a` provides a virtual display; Electron can render headlessly.
* The HTML report, videos, and traces appear in `playwright-report/`.

---

## 11) Troubleshooting & Hardening

* **Flaky selectors:** prefer roles/labels; add `data-testid` where needed.
* **Race conditions:** `await expect(locator).toBeVisible()` before clicking.
* **Slow startups:** increase top‑level `timeout` or wait for a specific ready signal (e.g., element with `data-testid="app-ready"`).
* **State leakage:** ensure every test starts clean (temp userDataDir, mocked network, cleared localStorage/IndexedDB if your app uses them).
* **Debugging CI failures:** run with `--headed --debug`, inspect saved trace (`npx playwright show-trace …`).

---

## 12) Test Plan Template

Use this checklist to design your initial E2E coverage:

* **Launch & Smoke:** app opens, title & main menu render, no console errors.
* **Navigation:** open/close dialogs, switch tabs/panes, sidebar toggles.
* **Core flows:** create/edit/save entity, validation errors show, undo/redo.
* **Edge cases:** empty state, large payloads, offline (API mocked to 500/timeout).
* **Persistence:** reopen app and verify last session (if feature exists).
* **Crash guards:** simulate renderer exception & recovery path.

---

## 13) Frequently Asked Patterns

**Selecting tabs/panes by label:**

```ts
await page.getByRole('tab', { name: /Editor/i }).click();
await expect(page.getByRole('tabpanel', { name: /Editor/i })).toBeVisible();
```

**Typing into code editors (monaco/ace):** target the content area by role/label or `data-testid`, then use `press`/`type`:

```ts
const editor = page.getByTestId('monaco-editor');
await editor.click();
await page.keyboard.type('console.log("hello")');
```

**Waiting for background work to finish:** expose a `data-testid="idle"` element or an IPC ping in E2E mode; wait for it.

---

## 14) What “Done” Looks Like

* `npm run test:e2e` passes locally and in CI.
* Tests drive the primary user flows with robust selectors.
* Any renderer console error or main-process crash fails the suite.
* Artifacts (trace, screenshots, video) are uploaded on CI failures.

---

## 15) Quick Start Recap

1. `npm i -D @playwright/test && npx playwright install-deps && npx playwright install`
2. Add `playwright.config.ts` and scripts.
3. Implement `E2E` app mode.
4. Write your first `_electron` test and capture console errors.
5. Add CI with Xvfb and upload the Playwright report.

> With these pieces in place, you’ll have reliable, user‑level E2E coverage that catches regressions and surfacing console errors early.

