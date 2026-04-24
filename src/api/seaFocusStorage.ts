import { FocusRecord, Task } from '../types';

const TASKS_KEY = 'sea-focus-tasks';
const RECORDS_KEY = 'sea-focus-records';

type SeaFocusStorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface SeaFocusStorageApi {
  loadTasks: () => Task[];
  saveTasks: (tasks: Task[]) => void;
  loadFocusRecords: () => FocusRecord[];
  saveFocusRecords: (records: FocusRecord[]) => void;
}

/**
 * Creates the frontend persistence API used by app components.
 *
 * @param backend browser-compatible key/value storage
 * @returns typed Sea Focus storage operations
 */
export function createSeaFocusStorage(backend: SeaFocusStorageBackend): SeaFocusStorageApi {
  return {
    loadTasks: () => readArray<Task>(backend, TASKS_KEY),
    saveTasks: (tasks) => backend.setItem(TASKS_KEY, JSON.stringify(tasks)),
    loadFocusRecords: () => readArray<FocusRecord>(backend, RECORDS_KEY),
    saveFocusRecords: (records) => backend.setItem(RECORDS_KEY, JSON.stringify(records)),
  };
}

/**
 * Browser-backed frontend persistence API.
 */
export const seaFocusStorage = createSeaFocusStorage(getBrowserStorage());

function readArray<T>(backend: SeaFocusStorageBackend, key: string): T[] {
  try {
    const parsed = JSON.parse(backend.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getBrowserStorage(): SeaFocusStorageBackend {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  const fallback = new Map<string, string>();
  return {
    getItem: (key) => fallback.get(key) ?? null,
    setItem: (key, value) => {
      fallback.set(key, value);
    },
    removeItem: (key) => {
      fallback.delete(key);
    },
  };
}
