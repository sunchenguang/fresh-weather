# Proposal reboot — implementation plan (executed)

**Spec:** [2026-03-30-proposal-reboot-design.md](./2026-03-30-proposal-reboot-design.md)

## Done

1. **`client/app.json`** — Subpackage `packageProposal` with `open` → `story` → `question` → `moment`.
2. **`client/packageProposal/config.js`** — Photos, BGM URLs, copy for open / quiz / moment (editable).
3. **Weather home** — `tips` no longer navigates to letter; `两日主卡片` use `onEasterEggDayTap`: **今天** then **明天** within **12s** opens `/packageProposal/pages/open/index`; `onUnload` clears timer; duplicate **今天** while armed ignored.
4. **Pages** — New visual language (night / gold, stars, swiper, quiz buttons, single CTA + modal + spark burst + climax audio); no “不愿意” button.
5. **Legacy** — `packageA` routes unchanged for archival; no link from weather to old flow.

## Follow-up (optional)

- Tune `EASTER_EGG_WINDOW_MS` and hint copy in `config.js`.
- Replace placeholder quiz options and open lines with your final wording.
- Remove or repoint unused `packageA` proposal pages when ready.
