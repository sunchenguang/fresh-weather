# Proposal experience reboot — design spec

**Date:** 2026-03-30  
**Status:** Approved for implementation planning  
**Context:** WeChat mini-program `fresh-weather`. The prior proposal journey (cover → confession → gallery → proposal) and the `tips → letter` path have been seen; this spec replaces the surprise strategy with a new flow, new UI, and a concealed entry from the weather home page.

---

## 1. Goals

- Restore **surprise** by making the digital journey **unrecognizable** compared to the first version (new route structure, new visuals, new rhythm; no reliance on muscle memory).
- Keep the app **credible as a weather tool** on the home page; romance begins only after a **deliberate, guided easter egg**.
- **Ship without the long letter** in this release: short narrative, photos, one choice interaction, proposal climax. The existing `letter` page may remain in codebase for a future entry, not this flow.

---

## 2. Locked product decisions

| Topic | Decision |
|-------|----------|
| Entry context | User stays in the **weather mini-program**; partner is **verbally guided** to discover the gate herself. |
| Legacy `tips → letter` | **Remove** public navigation from `tips` to `/packageA/pages/letter/index`. `tips` behaves as normal weather copy only. |
| Legacy proposal chain | **Do not use** cover / confession / gallery / proposal as the primary path. Replace with **new pages** under a **new route prefix** (e.g. new subpackage root or new page paths). Old pages may remain unused or be removed in a later cleanup. |
| Long letter (`letter`) | **Out of scope** for this experience. Not shown after the easter egg. |
| Easter egg trigger | **Tap “今天” forecast card, then “明天” card** on the weather home (`two-days` block), within a **short time window** (recommended 8–15s). Order: **今天 → 明天**. Reset progress if window expires. |
| Mid-flow interaction | **Multiple choice**: 2–3 options (inside jokes / shared memories / dates). **Correct** option advances; **wrong** options: **unlimited retries**, each wrong tap shows **one short, gentle hint** (no mocking, no hard lockout). |
| Proposal primary screen | **No** “不愿意” runaway button. **Single affirmative path** (or equivalent solemn primary CTA) plus new celebration / peak motion. |

---

## 3. User journey (high level)

1. Open mini-program → **weather home** (unchanged credibility for casual use).
2. Partner follows spoken cue → taps **今天** card, then **明天** card within the time window.
3. **Navigate** to new flow entry page (custom navigation; not old packageA proposal entry order).
4. **Scene A — Short open**: One screen (or minimal sequence) with new visual language: title line / atmosphere; distinct from old cover + confession.
5. **Scene B — Photos**: Full-width or cinematic photo sequence (swipe or auto-advance — implementation choice). Uses configurable image URLs (reuse or replace assets independently of old gallery page).
6. **Scene C — Quiz**: 2–3 choices; correct answer unlocks Scene D. Wrong answers → toast or inline hint only; unlimited attempts.
7. **Scene D — Proposal**: Core question + **new** peak animation (not a clone of falling-hearts + old modal). No secondary “reject” joke button.
8. Optional **Scene E**: Short closing beat (still image, final line, or hand-off to real-world action) — optional for MVP.

---

## 4. Weather page — technical hooks

**File reference:** `client/pages/weather/index.wxml` (`two-days` section), `client/pages/weather/index.js`.

- Add **tap handlers** on the two day cards (or wrapper views) that:
  - Track state: `idle` → `firstTapToday` → `armed` after `明天` within deadline; on success call `wx.navigateTo` to **new first page URL**.
  - Clear partial progress when **timeout** or when user taps valid sequence out of order (define: first tap on 明天 clears or ignores per spec: recommend **reset** if 明天 is tapped before 今天).
- **Debouncing:** Ignore duplicate taps on the same card that do not advance state; optional minimum interval between taps to reduce accidental double-fire.
- **Remove** `goToLetter` binding from `tips` (wxml). Either remove `bindtap` or point `tips` to no-op / weather-only detail per product copy.

---

## 5. New package / routing

- **Requirement:** New URLs so bookmarks and memory of old paths do not apply.
- **Recommendation:** Add a dedicated subpackage, e.g. `packageProposal` (name TBD in implementation plan), with pages such as:
  - `pages/open/index` — short open
  - `pages/story/index` — photo run (or split `photos` + `quiz` if cleaner)
  - `pages/question/index` — multiple choice gate
  - `pages/moment/index` — proposal + celebration  
  Exact split can be 3 or 4 pages; fewer deep links simplify state and music continuity.

Register new roots in `client/app.json` `subPackages`; **do not** register duplicate user-facing entry from weather except the easter egg.

---

## 6. Content & configuration

- **Copy:** Short lines per scene; user-supplied Chinese text. Quiz options: one `correctId` or matching key; hints array per wrong option or generic rotating hints.
- **Media:** Background music — either continue from weather (optional) or start on easter egg success; avoid jarring autoplay policy issues (WeChat user gesture context: first tap on cards may count as gesture before navigate — verify in implementation).
- **Photos:** Data-driven list in page `data` or small config module for easy swaps without layout rewrites.

---

## 7. Non-goals (this release)

- Long-scroll `letter` integration.
- Reusing old proposal “不愿意” interaction.
- Spec-document-reviewer automation in CI (human review of this file suffices unless process extended later).

---

## 8. Acceptance criteria

- Tapping `tips` **never** opens `letter` in production behavior.
- **今天 → 明天** sequence within window **always** opens the **new** flow; other tap patterns **never** open it.
- Old primary proposal path is **not** linked from weather or from new flow unless explicitly for dev/test.
- Quiz allows **unlimited** wrong attempts with **only** gentle messaging.
- Proposal screen has **no** runaway negative button; primary action completes the story with **new** peak visuals.

---

## 9. Open points for implementation plan

- Exact time window (seconds) and copy for timeout reset (silent vs micro-toast for dev only).
- Peak animation technology: CSS-only vs Canvas 2d vs short video — choose per perf and bundle budget.
- Whether to **deprecate** old `packageA` pages from `app.json` to shrink confusion, or keep for archival.
- Analytics / logging: out of scope unless requested.

---

## 10. Approval

Product decisions in §2 and journey in §3 were confirmed by project owner on 2026-03-30. Next step: implementation plan (`writing-plans` workflow), then implementation.
