import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeaFocusStorage } from './seaFocusStorage';
import { FocusRecord, JournalEntry, Task } from '../types';

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
  assert.deepEqual(api.loadJournalEntries(), []);
});

test('saves and loads tasks, focus records, and journal entries through the frontend API layer', () => {
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
      task: {
        taskId: 'task-1',
        taskTitle: '整理计划',
        taskQuadrant: 'urgent-important',
        taskDate: '2026-04-24',
        taskLinkStatus: 'active',
      },
    },
  ];
  const entries: JournalEntry[] = [
    {
      id: 'entry-1',
      date: '2026-04-24',
      title: '整理灵感',
      content: '记录今天的安排。',
      createdAt: '2026-04-24T09:00:00.000Z',
      updatedAt: '2026-04-24T09:00:00.000Z',
      reminderEnabled: true,
      reminderAt: '2026-04-24T21:30:00',
      reminderNotificationId: 12345,
    },
  ];

  api.saveTasks(tasks);
  api.saveFocusRecords(records);
  api.saveJournalEntries(entries);

  assert.deepEqual(api.loadTasks(), tasks);
  assert.deepEqual(api.loadFocusRecords(), records);
  assert.deepEqual(api.loadJournalEntries(), entries);
});

test('falls back to empty arrays when stored JSON is invalid', () => {
  const storage = createMemoryStorage();
  storage.setItem('sea-focus-tasks', '{bad-json');
  storage.setItem('sea-focus-records', 'null');
  storage.setItem('sea-focus-journal-entries', '{}');
  const api = createSeaFocusStorage(storage);

  assert.deepEqual(api.loadTasks(), []);
  assert.deepEqual(api.loadFocusRecords(), []);
  assert.deepEqual(api.loadJournalEntries(), []);
});
