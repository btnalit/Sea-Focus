export const MIN_FOCUS_MINUTES = 1;
export const MAX_FOCUS_MINUTES = 240;

export const FOCUS_DURATION_PRESETS = [
  { id: '25', label: '25', minutes: 25 },
  { id: '50', label: '50', minutes: 50 },
  { id: 'custom', label: '自定义', minutes: 25 },
] as const;

export type FocusDurationPresetId = (typeof FOCUS_DURATION_PRESETS)[number]['id'];

/**
 * Clamps a custom focus duration to the supported app range.
 *
 * @param minutes custom duration in minutes
 * @returns a whole minute value from 1 to 240
 */
export function clampFocusMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return 25;
  return Math.min(MAX_FOCUS_MINUTES, Math.max(MIN_FOCUS_MINUTES, Math.round(minutes)));
}

/**
 * Converts focus minutes into timer seconds.
 *
 * @param minutes duration in minutes
 * @returns duration in seconds
 */
export function toFocusDurationSeconds(minutes: number): number {
  return clampFocusMinutes(minutes) * 60;
}
