import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeaFocusStorage } from './seaFocusStorage';
import { FocusRecord, Task } from '../types';

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test('loads empty arrays when storage has no data', () => {
  const api = createSeaFocusStorage(createMemoryStorage());

  assert.deepEqual(api.loadTasks(), []);
  assert.deepEqual(api.loadFocusRecords(), []);
});

test('saves and loads tasks and focus records through the frontend API layer', () => {
  const api = createSeaFocusStorage(createMemoryStorage());
  const tasks: Task[] = [
    {
      id: 'task-1',
      title: '整理计划',
      quadrant: 'urgent-important',
      completed: false,
      date: '2026-04-24T08:00:00.000Z',
    },
  ];
  const records: FocusRecord[] = [
    {
      id: 'record-1',
      type: 'pomodoro',
      duration: 1500,
      category: '深度工作',
      timestamp: '2026-04-24T09:00:00.000Z',
    },
  ];

  api.saveTasks(tasks);
  api.saveFocusRecords(records);

  assert.deepEqual(api.loadTasks(), tasks);
  assert.deepEqual(api.loadFocusRecords(), records);
});

test('falls back to empty arrays when stored JSON is invalid', () => {
  const storage = createMemoryStorage();
  storage.setItem('sea-focus-tasks', '{bad-json');
  storage.setItem('sea-focus-records', 'null');
  const api = createSeaFocusStorage(storage);

  assert.deepEqual(api.loadTasks(), []);
  assert.deepEqual(api.loadFocusRecords(), []);
});
