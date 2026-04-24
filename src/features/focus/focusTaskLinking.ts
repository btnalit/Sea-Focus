import { FocusTaskLinkStatus, FocusTaskSnapshot, Task } from '../../types';
import { formatDateKey } from '../calendar/dateUtils';
import { getTasksForPlanDate, normalizeTaskDateKey } from '../plan/taskLifecycle';

/**
 * Returns unfinished plans that can receive focus time today.
 *
 * @param tasks persisted plans
 * @param now local date used for today's active/carryover boundary
 * @returns active and carried-forward plans visible to the focus page
 */
export function getSelectableFocusTasks(tasks: Task[], now = new Date()): Task[] {
  return getTasksForPlanDate(tasks, formatDateKey(now), 'active');
}

/**
 * Captures the task context that should remain readable on a focus record.
 *
 * @param task selected plan
 * @param status current relationship between the focus record and plan
 * @returns stable task snapshot for focus persistence
 */
export function buildFocusTaskSnapshot(
  task: Task,
  status: FocusTaskLinkStatus = 'active',
): FocusTaskSnapshot {
  return {
    taskId: task.id,
    taskTitle: task.title,
    taskQuadrant: task.quadrant,
    taskDate: normalizeTaskDateKey(task.date),
    taskLinkStatus: status,
  };
}

/**
 * Re-checks a selected plan before saving focus time.
 *
 * @param tasks current persisted plans
 * @param selectedTaskId selected plan id, if the session is linked
 * @param existingSnapshot snapshot captured when the plan was selected
 * @returns a focus task snapshot with active, archived, or deleted status
 */
export function resolveFocusTaskSnapshot(
  tasks: Task[],
  selectedTaskId: string | null,
  existingSnapshot?: FocusTaskSnapshot | null,
): FocusTaskSnapshot | undefined {
  if (!selectedTaskId) return undefined;

  const currentTask = tasks.find((task) => task.id === selectedTaskId);
  if (!currentTask) {
    return existingSnapshot ? { ...existingSnapshot, taskLinkStatus: 'deleted' } : undefined;
  }

  const baseSnapshot = existingSnapshot?.taskId === selectedTaskId
    ? existingSnapshot
    : buildFocusTaskSnapshot(currentTask);

  return {
    ...baseSnapshot,
    taskLinkStatus: currentTask.completed ? 'archived' : 'active',
  };
}
