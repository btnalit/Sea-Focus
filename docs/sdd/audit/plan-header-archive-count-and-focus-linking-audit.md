# Plan Header Archive Count And Focus Linking Audit

Date: 2026-04-24

## Planned Review

- Plan header chain: `Task.completedAt` -> `buildTaskHarvestStats` -> `App` -> `PlanPage`.
- Ensure focus pomodoro stats no longer drive plan header harvest copy.
- Document focus-to-plan linking design without changing timer behavior in this small patch.

## Findings

- Plan header previously displayed `今日收获 X 番茄`, which came from focus pomodoro records rather than completed plans.
- The header now displays `今日归档 X 项`, derived from `buildTaskHarvestStats(tasks).todayCompletedTasks` through `buildPlanHeaderStats`.
- This aligns plan page header copy with the harvest page's completed-plan source of truth.
- Focus records are intentionally not consumed by this header metric anymore.

## Focus-Plan Linking Recommendation

- Add optional `taskId` to `FocusRecord` in a separate feature.
- Let users select an active/carryover plan before starting a focus session. Keep category-only focus as a fallback for free-form sessions.
- Save focus records with `taskId` when a linked plan is selected, but do not auto-complete the task when a focus session ends.
- Completion should remain explicit because spending 25 minutes on a plan is not the same as finishing it.
- After linking exists, stats can separate:
  - `收获`: completed plans by quadrant and date.
  - `投入`: actual focus time by linked plan/quadrant/category.
  - `效率`: completed plans compared with linked focus time.

## Verification

- `npm run test:unit`: passed, 27/27 tests.
- `npm run lint`: passed.
- `npm run test:ci-config`: passed, 43 Android CI checks.
- `npm run build`: passed.
- `npx cap sync android`: passed.
- Android resource XML parse scan: passed, no invalid XML files.
- Header metric scan: plan page now uses `今日归档`; focus pomodoro count remains only in focus stats helpers/tests.
- `git diff --check`: passed.
