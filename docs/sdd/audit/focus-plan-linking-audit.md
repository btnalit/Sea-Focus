# Focus Plan Linking Audit

Date: 2026-04-24

## Planned Review

- Data chain: `PlanPage` task creation/archive/delete -> `App` task state -> `seaFocusStorage` -> `FocusPage` selector.
- Save chain: `FocusPage` selected task -> focus completion payload -> `App.addFocusRecord` -> `seaFocusStorage.saveFocusRecords`.
- Statistics chain: linked focus records must remain compatible with existing category duration stats and task harvest stats.

## Findings

- Before this change, `FocusPage` only accepted `onFocusComplete`, so it had no access to unfinished plans and could only save category-based focus records.
- `App` now passes the persisted task state into `FocusPage`; `FocusPage` still writes records only through the existing `onFocusComplete` callback.
- `getSelectableFocusTasks` uses the same active/carryover rule as `PlanPage`, so today shows unfinished plans from today and earlier dates while excluding completed and future plans.
- Focus records can now carry an optional `task` snapshot with `taskId`, title, quadrant, date, and link status.
- The save path re-checks current task state before recording focus time:
  - active plans save with `taskLinkStatus: active`;
  - plans completed before save save with `taskLinkStatus: archived`;
  - plans deleted before save keep the captured snapshot and save with `taskLinkStatus: deleted`.
- Free focus remains supported and saves records without task snapshots.
- Completing focus time does not archive the plan; task completion remains explicit in the plan page.

## Verification

- TDD RED: `npm run test:unit -- src/features/focus/focusTaskLinking.test.ts` failed because `focusTaskLinking` did not exist.
- `npm run test:unit`: passed, 31/31 tests.
- `npm run lint`: passed.
- `npm run test:ci-config`: passed, 43 Android CI checks.
- `npm run build`: passed.
- `npx cap sync android`: passed.
- Android resource XML parse scan: passed, 12 XML files.
- `git diff --check`: passed.
- Focus-link static scan confirms `getSelectableFocusTasks`, `resolveFocusTaskSnapshot`, and `FocusTaskSnapshot` are wired through types, helper, `FocusPage`, and storage test.
- Commit: `7b1049a feat: link focus sessions to plans`.
