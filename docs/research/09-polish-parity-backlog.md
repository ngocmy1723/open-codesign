# Research 09 — Comprehensive Polish + Parity Gap Backlog

**Date**: 2026-04-18 · **Status**: Decision recorded — top 10 promoted to v0.1 must-do

## Top 10 must-do for v0.1 ship (locked)

In merge-priority order, with owner:

1. **OS keychain storage** for API keys — `wt/onboarding` (in flight, PR #1)
2. **Streaming generation** with ≤ 200 ms skeleton — `wt/first-demo` (in flight, PR #4)
3. **React error boundaries** (app shell + per-pane) — `wt/reliability` (queued)
4. **Generation cancellation** via `AbortController` — `wt/reliability` (queued)
5. **pi-ai singleton cache** (don't re-import every call) — `wt/sandbox-hardening` (queued)
6. **Preview iframe CSP** injection — `wt/sandbox-hardening` (queued)
7. **Sandbox iframe error reporting** — `wt/reliability` (queued)
8. **Empty-state illustration + loading skeleton** — `wt/preview-ux` (in flight, PR #3)
9. **IPC + Artifact schema versioning** — `wt/compat` (queued)
10. **Ollama auto-detect preset** — `wt/onboarding` (in flight; extension)

## Top 10 nice-to-have for v0.2 — v1.0

1. Inline comment loop — `wt/inline-comment`
2. AI-generated custom sliders — `wt/sliders`
3. Three-column model A/B race — `wt/ab-race`
4. Codebase → design system extraction — `wt/codebase-ds`
5. Web Capture + URL Style Steal — `wt/web-capture`
6. Mac/Windows code signing — `wt/release-eng`
7. Homebrew Cask formula — `wt/release-eng`
8. PDF + PPTX export — `wt/exporters`
9. Storybook for `packages/ui` — `wt/storybook`
10. WCAG audit + VoiceOver smoke test — `wt/a11y`

## Deferred past 1.0

- Delta updates
- Mutation testing
- Multi-user real-time collaboration (anti-goal)
- Linux Flatpak + Snap
- Sound effects, Touch Bar, haptic feedback

## Recommended next 5 worktrees (file-disjoint, ≤ 5 days each)

| # | Branch | Scope | Files owned | Days |
|---|---|---|---|---|
| 1 | `wt/reliability` | C1 C2 C5 C6 C7 C10 C11 (boundaries, retry, cancellation, error reporting) | App.tsx, providers/index.ts, runtime/overlay.ts, core/index.ts | 3-4 |
| 2 | `wt/sandbox-hardening` | D4 D5 E1 E3 (CSP, Electron audit, singletons, partial srcdoc update) | runtime/index.ts, main/index.ts (security opts), providers/index.ts (singleton) | 2-3 |
| 3 | `wt/exporters` | A7 A8 A9 A10 (PDF, PPTX, ZIP, export menu) | packages/exporters/src/, main/index.ts (IPC), App.tsx (toolbar) | 4-5 |
| 4 | `wt/inline-comment` | A2 A13 F10 (full comment loop, direct text edit, right-click) | runtime/overlay.ts, core/index.ts, renderer comment popup | 4-5 |
| 5 | `wt/compat` | M1 M2 M4 M6 (IPC versioning, config schema, artifact schemaVersion) | main/index.ts, shared/index.ts, main/migrations/ | 1-2 |

**File-conflict notes**:
- `wt/reliability` + `wt/sandbox-hardening` both touch `providers/index.ts` — sequence: reliability lands first, sandbox-hardening rebases.
- `wt/exporters` + `wt/compat` both touch `main/index.ts` (different sections; trivial rebase).
- `wt/inline-comment` + `wt/reliability` both touch `runtime/overlay.ts` (overlapping); sequence: reliability lands first.

## Full backlog

The exhaustive 13-section backlog (A. parity / B. differentiation / C. reliability / D. security / E. performance / F. UX polish / G. accessibility / H. i18n / I. dev experience / J. release engineering / K. docs / L. telemetry / M. compatibility) is archived in conversation log on 2026-04-18. Each item carries impact (H/M/L) + effort (xs/s/m/l/xl) + proposed owner. Will be re-imported into GitHub Issues after v0.1 ships.

## Critical research gap (carried forward)

**No exported HTML sample from Claude Design has been obtained yet.** Until we acquire one and reverse-engineer the artifact format, our schemas are tentative. Block on PRs that lock new persisted shapes.
