# Archive Task Actions And Focus Link Dynamics Audit

Date: 2026-04-24

## Planned Review

- Archive chain: `PlanPage` archived task -> action panel -> restore/delete -> `App` task state -> `seaFocusStorage`.
- Harvest chain: deleted archived task -> removed from task list -> harvest aggregation updates.
- Future focus-link chain: selected task can change while a session runs, so focus records need snapshots and stale-link handling.

## Findings

- Archive task clicks previously called the same toggle handler as active tasks, so tapping an archived item immediately restored it without confirmation.
- Archive task clicks now open an action panel with explicit restore, delete, and cancel actions.
- Restore uses the existing lifecycle path and clears completion state.
- Delete removes the task from the persisted task list, so harvest counts and chart distribution update through existing task harvest aggregation.
- The state path remains `PlanPage` -> `App` task state -> `seaFocusStorage`; no backend or database layer exists.

## Focus-Link Dynamic Recommendation

- When focus-to-plan linking is implemented, a running session must not depend on the plan still being active at finish time.
- Store `taskId` plus a task snapshot on the focus record at session start.
- If the plan is completed while the timer runs, keep the link and snapshot; completion and focus investment remain separate facts.
- If the plan is deleted before the timer ends, save the focus record as an orphaned linked session with the snapshot still visible.
- If a linked plan is later deleted from archive, historical focus records should still render by snapshot instead of becoming unreadable.

## Verification

- `npm run test:unit`: passed, 28/28 tests.
- `npm run lint`: passed.
- `npm run test:ci-config`: passed, 43 Android CI checks.
- `npm run build`: passed.
- `npx cap sync android`: passed.
- Android resource XML parse scan: passed, no invalid XML files.
- Archive action scan: `deleteTaskById`, `onDeleteTask`, `恢复计划`, and `删除归档` are wired through the frontend chain.
- `git diff --check`: passed.
