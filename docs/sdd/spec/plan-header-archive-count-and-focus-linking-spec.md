# Plan Header Archive Count And Focus Linking Spec

Date: 2026-04-24

## Goal

Align the plan page header with the harvest page by showing today's archived plan count, and document the recommended next-step design for linking focus sessions to plans.

## Scope

- Keep the app frontend-only.
- Use existing task harvest aggregation for the plan header.
- Do not implement full focus-to-plan binding in this small change.
- Preserve the current focus timer interaction until the linking workflow is designed and tested.

## Plan Header Rule

- Plan page header label must be `今日归档`.
- Plan page header value must be today's completed plan count.
- The count comes from `buildTaskHarvestStats(tasks).todayCompletedTasks`.
- It must not use focus pomodoro count.

## Recommended Focus-Plan Linking Design

- Add optional `taskId` to `FocusRecord`.
- In `FocusPage`, allow selecting an active/carryover plan before starting a timer.
- Keep the current category selector as a fallback for sessions that are not tied to a plan.
- When a timer finishes with a selected plan, save the focus record with `taskId` and category copied from the plan's quadrant label or user-selected category.
- Do not auto-complete the plan after one focus session. A focus session means "投入过时间"; completion remains an explicit user action.
- Stats can then show two dimensions:
  - Plan harvest: completed plans by quadrant.
  - Focus investment: actual focus time by linked plan/quadrant/category.

## Acceptance Criteria

- Plan header shows `今日归档 X 项`.
- Header count updates from completed plan state.
- SDD audit documents the focus-plan linking recommendation.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
