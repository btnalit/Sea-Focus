import { FocusRecord, Task } from '../../types';
import { buildTaskHarvestStats } from '../stats/taskHarvest';

export interface PlanHeaderStats {
  todayArchivedTasks: number;
}

/**
 * Builds compact metrics for the plan page header.
 *
 * @param tasks persisted tasks
 * @param _records persisted focus records, reserved for future header metrics
 * @param now date used for today's archive boundary
 * @returns plan header counters
 */
export function buildPlanHeaderStats(tasks: Task[], _records: FocusRecord[], now = new Date()): PlanHeaderStats {
  return {
    todayArchivedTasks: buildTaskHarvestStats(tasks, now).todayCompletedTasks,
  };
}
