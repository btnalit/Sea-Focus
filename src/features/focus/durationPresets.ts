export const MIN_FOCUS_MINUTES = 1;
export const MAX_FOCUS_MINUTES = 240;

export const FOCUS_DURATION_PRESETS = [
  { id: '25', label: '25', minutes: 25 },
  { id: '50', label: '50', minutes: 50 },
  { id: 'custom', label: '自定义', minutes: 25 },
] as const;

export type FocusDurationPresetId = (typeof FOCUS_DURATION_PRESETS)[number]['id'];

export interface CustomFocusMinutesDraft {
  inputValue: string;
  minutes: number;
  shouldUpdateTimer: boolean;
}

export interface CommittedCustomFocusMinutesDraft {
  inputValue: string;
  minutes: number;
}

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

/**
 * Normalizes a custom duration draft while the user is editing the input.
 *
 * Empty or invalid drafts are preserved so the field can be cleared before
 * typing a new value, while the active timer keeps the last valid duration.
 *
 * @param value raw input value from the custom duration field
 * @param currentMinutes last valid custom duration in minutes
 * @returns normalized draft state and whether the timer can be updated
 */
export function normalizeCustomFocusMinutesDraft(
  value: string,
  currentMinutes: number,
): CustomFocusMinutesDraft {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return {
      inputValue: '',
      minutes: currentMinutes,
      shouldUpdateTimer: false,
    };
  }

  const numericValue = Number(trimmedValue);
  if (!Number.isFinite(numericValue)) {
    return {
      inputValue: value,
      minutes: currentMinutes,
      shouldUpdateTimer: false,
    };
  }

  const minutes = clampFocusMinutes(numericValue);
  return {
    inputValue: trimmedValue,
    minutes,
    shouldUpdateTimer: true,
  };
}

/**
 * Commits a custom duration draft into a valid supported minute value.
 *
 * @param value raw input value from the custom duration field
 * @returns committed input text and numeric minutes
 */
export function commitCustomFocusMinutesDraft(value: string): CommittedCustomFocusMinutesDraft {
  const trimmedValue = value.trim();
  const numericValue = Number(trimmedValue);
  const minutes = trimmedValue && Number.isFinite(numericValue)
    ? clampFocusMinutes(numericValue)
    : MIN_FOCUS_MINUTES;

  return {
    inputValue: String(minutes),
    minutes,
  };
}
