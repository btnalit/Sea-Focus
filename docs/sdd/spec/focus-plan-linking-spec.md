# Focus Plan Linking Spec

Date: 2026-04-24

## Goal

Let users start a focus session from an unfinished plan, and persist enough task context on the focus record so focus investment remains readable even when the related plan is later archived or deleted.

## Scope

- Keep the app frontend-only and use the existing `App` state plus `seaFocusStorage` API layer.
- Show today's active/carryover unfinished plans on the focus page.
- Allow either free focus or linking to one visible unfinished plan before starting the timer.
- Save an optional task snapshot on completed focus records.
- Keep plan completion explicit; finishing a focus timer must not archive or complete a plan automatically.
- Preserve existing category-based focus statistics.

## Data Rules

- Selectable focus plans come from `getTasksForPlanDate(tasks, todayKey, 'active')`.
- Completed plans and future plans are not selectable.
- A focus task snapshot contains:
  - `taskId`
  - `taskTitle`
  - `taskQuadrant`
  - `taskDate`
  - `taskLinkStatus`
- `taskLinkStatus` values:
  - `active`: plan is still unfinished when the record is saved.
  - `archived`: plan was completed before the record was saved.
  - `deleted`: plan no longer exists when the record is saved, but the session keeps the snapshot captured at selection/start.

## Interaction Rules

- Focus page shows a compact "关联计划" selector above focus presets.
- "自由专注" remains available for sessions unrelated to plans.
- While a timer is active, the linked plan selector is disabled so one session does not change meaning halfway through.
- If the selected plan is archived or deleted while the page is open, the session can still save using its snapshot and status.
- A focus record linked to a plan should not change the plan's completed state.

## Acceptance Criteria

- Focus page receives tasks from `App`.
- Focus page lists active/carryover unfinished plans for today.
- Selecting a plan before a timer finishes saves `task` snapshot data on the focus record.
- Free focus records still save without a task snapshot.
- Completed plans are not selectable, but a running linked session can save as `archived`.
- Deleted selected plans can save as `deleted` using the previously captured snapshot.
- Unit tests cover selection and stale-link snapshot rules.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
