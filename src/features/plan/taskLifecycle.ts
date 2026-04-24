import { Task } from '../../types';
import { formatDateKey } from '../calendar/dateUtils';

export type PlanTaskViewMode = 'active' | 'archive';

/**
 * Toggles a task between active tracking and archived completion.
 *
 * @param task task to update
 * @param now local completion timestamp
 * @returns updated task with completion metadata adjusted
 */
export function toggleTaskCompletion(task: Task, now = new Date()): Task {
  if (task.completed) {
    const { completedAt, ...activeTask } = task;
    return { ...activeTask, completed: false };
  }

  return {
    ...task,
    completed: true,
    completedAt: formatDateKey(now),
  };
}

/**
 * Removes a task from the persisted task list.
 *
 * @param tasks all persisted tasks
 * @param id task id to delete
 * @returns task list without the deleted task
 */
export function deleteTaskById(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id);
}

/**
 * Returns tasks visible for a plan date and mode.
 *
 * @param tasks all persisted tasks
 * @param selectedDateKey selected local YYYY-MM-DD date
 * @param mode active tracking or archive view
 * @returns tasks visible in the selected view
 */
export function getTasksForPlanDate(tasks: Task[], selectedDateKey: string, mode: PlanTaskViewMode): Task[] {
  return tasks.filter((task) => {
    const taskDateKey = normalizeTaskDateKey(task.date);

    if (mode === 'archive') {
      return task.completed && taskDateKey === selectedDateKey;
    }

    return !task.completed && taskDateKey <= selectedDateKey;
  });
}

/**
 * Returns true when an unfinished task is carried from an earlier date.
 *
 * @param task task to inspect
 * @param selectedDateKey selected local YYYY-MM-DD date
 * @returns whether the task is overdue and still active
 */
export function isTaskCarriedForward(task: Task, selectedDateKey: string): boolean {
  return !task.completed && normalizeTaskDateKey(task.date) < selectedDateKey;
}

/**
 * Formats a task date into a local YYYY-MM-DD key, including legacy ISO values.
 *
 * @param date task date string
 * @returns normalized local date key
 */
export function normalizeTaskDateKey(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return formatDateKey(new Date(date));
}
