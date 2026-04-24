# Archive Task Actions And Focus Link Dynamics Spec

Date: 2026-04-24

## Goal

Improve archived plan management by replacing one-tap restore with an explicit action choice, and document how future focus-plan links should behave when a plan is deleted or archived while a focus session exists.

## Scope

- Keep the app frontend-only.
- Add archived-task delete support through `App` state and `seaFocusStorage`.
- Keep active task tap behavior as complete/archive.
- Change archive task tap behavior to open an action panel with restore or delete.
- Do not implement full focus-plan binding in this change.

## Archive Action Rules

- Active view task tap marks the plan completed.
- Archive view task tap opens an action panel.
- The action panel must provide:
  - Restore plan: clears completion state and returns the task to active/carryover tracking.
  - Delete archive: removes the task from persisted tasks.
  - Cancel/close.
- Deleting an archived task removes it from future harvest counts and chart distribution.

## Future Focus-Link Dynamics

- A focus record linked to a plan should store `taskId` and a lightweight task snapshot (`taskTitle`, `taskQuadrant`, `taskDate`) at the time the session starts.
- If the linked plan is completed while a session is running, the focus record may still save with the original `taskId` and snapshot; completion remains explicit and separate.
- If the linked plan is deleted before the session ends, the focus record should still save with the snapshot and mark the link as orphaned/deleted rather than failing or dropping the session.
- If a completed plan is later deleted, historical focus records should remain readable through their snapshots.
- A plan selector should only show active/carryover tasks, but the save path must re-check current task state before writing the record.

## Acceptance Criteria

- Archived task click no longer directly restores the plan.
- Archived task action panel can restore the plan.
- Archived task action panel can delete the plan.
- Deleted archived tasks disappear from archive and harvest stats.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
