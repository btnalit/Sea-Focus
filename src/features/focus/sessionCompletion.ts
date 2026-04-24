/**
 * Decides whether a stopped stopwatch session should become a focus record.
 *
 * @param elapsedSeconds stopwatch elapsed seconds
 * @returns true when the session has measurable focus time
 */
export function shouldSaveStopwatchSession(elapsedSeconds: number): boolean {
  return Number.isFinite(elapsedSeconds) && elapsedSeconds > 0;
}
