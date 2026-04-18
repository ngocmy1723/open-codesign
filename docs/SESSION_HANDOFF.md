# Session Handoff — 2026-04-18 (continuing)

This session reached a working onboarding flow + 8 PRs merged + 1 baseUrl bug discovered live + 1 logging system added. The next session should pick up from here.

---

## What's on `main` right now (commit `3b1d0e6`)

✅ Working end-to-end:
- Onboarding wizard (3 steps), with **Advanced — custom base URL** for proxy / relay
- API key encrypted via Electron `safeStorage`, persisted to `~/.config/open-codesign/config.toml`
- Custom base URL persists per provider in `config.toml` `[baseUrls.<provider>]`
- Generation flow: prompt → `pi-ai` → artifact parser → iframe preview
- HTML export via `dialog.showSaveDialog`
- PDF / PPTX / ZIP exporters wired (need real testing)
- Settings overlay (4 tabs — only the structure exists, not real content)
- Command palette (Cmd+K), Theme toggle, keyboard shortcuts
- TopBar draggable on macOS hiddenInset
- Marketing site at `website/` (VitePress + en/zh)
- i18n infrastructure landed but **NOT wired into renderer strings yet**
- Reliability: ErrorBoundary, retry, AbortController, iframe error capture

✅ Tooling:
- Logger via `electron-log` — files at `~/Library/Logs/open-codesign/main.log` (macOS), 5MB rotation, scoped per module. `codesign:open-log-folder` IPC ready (UI button TBD).
- Lint / typecheck / test all green
- 9 docs/research reports archived

---

## Critical bugs discovered live (still open)

### 🔴 1. baseUrl override pushed but NOT verified
Last commit (`3b1d0e6`) overrides `pi-ai` Model.baseUrl directly. User had `https://www.duckcoding.ai` in config but pi-ai was still hitting OpenAI's official endpoint, returning 401. **Restart Electron and re-test** — the user's last screenshot was BEFORE this fix landed.

To verify:
```bash
pkill -9 -f "electron-vite\|node_modules/.pnpm/electron@33"
sleep 3
pnpm --filter @open-codesign/desktop dev
```
Open the app, finish onboarding (paste OpenAI key + add baseUrl `https://www.duckcoding.ai/v1`), pick a starter, Send. Check `~/Library/Logs/open-codesign/main.log` — you should see `[main:ipc] generate baseUrl=https://www.duckcoding.ai/v1`.

If still 401: the proxy may not actually serve OpenAI-compat routes, or expects a different path. Check the relay's docs.

### 🔴 2. UX issues the user explicitly called out

The user said "做得太垃圾" / "太丑" / "好好做一下" about three surfaces. Each needs a polish pass:

**Sidebar input area** (`apps/desktop/src/renderer/src/components/Sidebar.tsx`)
- Tiny single-line input + over-prominent send button
- "Enter send · ⌘↵ anywhere" hint line below looks like a placeholder
- Should be: multi-line autosize textarea, send button inside the field at bottom-right, hint inline (or removed)

**Settings overlay** (`apps/desktop/src/renderer/src/components/Settings.tsx`)
- Currently just stub copy ("Coming soon")
- Should expose:
  - **Models** tab: list saved providers from `config.toml`, edit key (re-validate), edit baseUrl, switch primary/fast model from a dropdown
  - **Appearance** tab: theme toggle + light/dark/system, language switcher (use the i18n locales now that they exist)
  - **Storage** tab: show config path + log path + design history path, "Open config folder", "Open log folder" (use `codesign:open-log-folder` IPC), "Reset onboarding" button
  - **Advanced** tab: toggle for opt-in update channel, dev tools toggle, generation timeout

**Error dedupe**
- The same error currently shows BOTH as `<ErrorState/>` in the preview pane AND as a Toast in the bottom-right. Pick one (recommend ErrorState for primary, Toast only for transient confirmations / non-blocking info).

### 🟡 3. Open follow-ups (less urgent)

- `i18n` package merged but App.tsx / onboarding / components still hardcode English. Migration table is in the PR #9 body. Wire `useT()` per the namespaces (common / preview / chat / settings / onboarding / commands / errors / demos).
- `apps/desktop/src/renderer/src/components/CanvasErrorBar.tsx` reads `iframeErrors` from the store — currently always `[]` because nothing populates it. Add a `useEffect` in App.tsx that listens for `IFRAME_ERROR` postMessages from the iframe (the message format is in `packages/runtime/src/iframe-errors.ts`).
- `BUILTIN_DEMOS` is still the English alias; `getDemos(locale)` exists but is unused.
- `wt/reliability` cancellation IPC is stubbed (renderer can't actually abort the in-flight call). Add `codesign:cancel-generation` IPC and have it `controller.abort()` on the in-flight `AbortController`.

---

## The pending UX worktrees (already dispatched at end of session)

These four worktrees were created earlier and may or may not have completed cleanly. Status as of merge wave end:

| PR | Branch | Status |
|---|---|---|
| #8 exporters-v2 | merged ✅ |
| #9 i18n-v2 | merged ✅ (renderer not wired yet) |
| #10 preview-ux-v2 | merged ✅ |
| #11 reliability-v2 | merged ✅ |

All clean PR branches were `wt/<slug>-v2` (the v1 ones got closed as superseded).

---

## How to start the new session

1. `git pull origin main`
2. `pnpm install`
3. `pnpm --filter @open-codesign/desktop dev`
4. Open app, finish onboarding once with a real key
5. Read this file + `docs/CONSENSUS.md` + `docs/HANDOFF.md`
6. Pick from "Critical bugs" above

If you want a clean Electron restart at any point:
```bash
pkill -9 -f "electron-vite\|node_modules/.pnpm/electron@33"
sleep 3
pnpm --filter @open-codesign/desktop dev > /tmp/codesign-dev.log 2>&1 &
```

Watch the actual log:
```bash
tail -f ~/Library/Logs/open-codesign/main.log
```

---

## What I would do first in the new session

In priority order:

1. **Verify baseUrl fix actually works** with the user's `duckcoding.ai` proxy — restart, send a prompt, tail the log
2. **Polish the Sidebar input** (probably 30 min — autosize textarea + inline send)
3. **Build out Settings → Models tab properly** (list providers from config, allow edit + re-validate; this is the second-most-asked-about UX gap)
4. **Wire i18n into the renderer** (PR #9 left a migration table; replace ~30 hardcoded strings)
5. **Dedupe error UI** (drop Toast for errors, keep ErrorState only)
6. **Open log folder button** in Settings → Storage

After those, the open-codesign demo is genuinely "ship-able" for an internal preview.

---

## Files most likely to need editing next

- `apps/desktop/src/renderer/src/components/Sidebar.tsx` — input polish
- `apps/desktop/src/renderer/src/components/Settings.tsx` — real content
- `apps/desktop/src/renderer/src/store.ts` — when wiring iframe errors / cancellation
- `apps/desktop/src/main/logger.ts` — tweak format / add renderer bridge if needed
- `packages/i18n/src/locales/{en,zh-CN}.json` — when adding strings missed in PR #9
- `apps/desktop/src/renderer/src/App.tsx` — when wiring i18n + iframe error listener

---

## Things NOT to break

- Don't change the preload format back to ESM (`.cjs` is required because `apps/desktop/package.json` is `"type": "module"` and `webPreferences.sandbox: true`)
- Don't change `apps/desktop/src/main/index.ts` `webPreferences` security settings (sandbox / contextIsolation / nodeIntegration)
- Don't import provider SDKs (`@anthropic-ai/sdk`, `openai`, …) in app code — go through `packages/providers`
- Don't add new prod deps without justification in PR body (≤30 cap, ~22 currently)
- Don't hardcode any color / px / font in renderer — use `var(--color-*)` etc.

---

## Useful one-liners

```bash
# inspect the live config
cat ~/.config/open-codesign/config.toml

# tail the structured log
tail -f ~/Library/Logs/open-codesign/main.log

# kill all electron + restart fresh
pkill -9 -f "electron-vite\|node_modules/.pnpm/electron@33" && sleep 3 && pnpm --filter @open-codesign/desktop dev > /tmp/codesign-dev.log 2>&1 &

# check baseUrl actually went through
grep "generate" ~/Library/Logs/open-codesign/main.log | tail -5

# verify all 4 checks before push
pnpm install && pnpm -r typecheck && pnpm lint && pnpm -r test
```

Good luck. The product is real now — pilot demo runs end-to-end if the baseUrl fix holds. Polish from here.
