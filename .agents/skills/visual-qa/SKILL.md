---
name: visual-qa
description: Use when building, testing or reviewing the futuristic JARVIS Presence, briefing, dashboard, approvals or responsive UI. Provides objective browser screenshot and behavior gates.
---
# Visual QA

1. Read `docs/03_UI_SPEC.md`; consult the video frame only for mood, not exact UI implementation.
2. Take real browser screenshots at 1440×900 and 390×844 (also 1920×1080 where possible). Compare to design tokens and prototype.
3. Simulate `IDLE`, `BRIEFING`, `AWAITING_APPROVAL`, `OFFLINE`, `reduced-motion`. Verify status indicator truth/DEMO.
4. Verify keyboard navigation, text labels, legible content, no blocking 3D/render errors, no horizontal overflow.
5. Report observed issues in priority order, fix and capture after screenshots. Record paths and tests in `docs/WORK_LOG.md`. If unable to run browser, say 'not verified', never fabricate screenshot results.
