export interface FocusCompletionToneStep {
  frequency: number;
  durationMs: number;
  gain: number;
}

type AudioContextWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

let sharedAudioContext: AudioContext | null = null;

/**
 * Builds the calm two-note completion tone used when a timed focus session ends.
 *
 * @returns ordered Web Audio tone steps
 */
export function buildFocusCompletionToneSteps(): FocusCompletionToneStep[] {
  return [
    { frequency: 660, durationMs: 180, gain: 0.055 },
    { frequency: 880, durationMs: 240, gain: 0.045 },
  ];
}

/**
 * Primes the browser audio context during a user gesture so the completion tone
 * can play later in Android WebView after the timer finishes.
 */
export function primeFocusCompletionTone(): void {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  resumeAudioContext(audioContext);
}

/**
 * Plays the focus completion tone as a best-effort local sound.
 */
export function playFocusCompletionTone(): void {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  resumeAudioContext(audioContext);

  try {
    let startAt = audioContext.currentTime + 0.02;
    buildFocusCompletionToneSteps().forEach((step) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const endAt = startAt + step.durationMs / 1000;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(step.frequency, startAt);
      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.linearRampToValueAtTime(step.gain, startAt + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);

      startAt = endAt + 0.05;
    });
  } catch {
    // Audio should never block saving the focus record.
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (sharedAudioContext) return sharedAudioContext;

  const browserWindow = window as AudioContextWindow;
  const AudioContextConstructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  try {
    sharedAudioContext = new AudioContextConstructor();
    return sharedAudioContext;
  } catch {
    return null;
  }
}

function resumeAudioContext(audioContext: AudioContext): void {
  if (audioContext.state !== 'suspended') return;

  void audioContext.resume().catch(() => undefined);
}
