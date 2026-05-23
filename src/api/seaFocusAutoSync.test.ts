import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeaFocusStorage } from './seaFocusStorage';
import {
  saveFocusRecordsAndUploadConfiguredSeaFocusClientEvents,
  saveTasksAndUploadConfiguredSeaFocusClientEvents,
  writeSeaFocusSyncConfig,
} from './seaFocusSync';
import { FocusRecord, Task } from '../types';

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test('saves changed tasks before auto-uploading completed task events', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);
  backend.setItem('sea-focus-sync-client-id', 'sf_auto_device');
  writeSeaFocusSyncConfig(backend, {
    endpoint: 'https://personal.opsevo.cn',
    readToken: 'read-token',
  });
  const completedTask: Task = {
    id: 'local-task-1',
    title: 'Auto sync archived task',
    quadrant: 'urgent-important',
    completed: true,
    completedAt: '2026-05-23',
    date: '2026-05-23',
  };
  let uploadedBody: {
    tasks_upserted: Array<Record<string, unknown>>;
    focus_records_completed: Array<Record<string, unknown>>;
  } | null = null;
  const fetcher: typeof fetch = async (_url, init) => {
    uploadedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ status: 'ok', accepted: 1, duplicates: 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const result = await saveTasksAndUploadConfiguredSeaFocusClientEvents({
    backend,
    storage,
    tasks: [completedTask],
    fetcher,
  });

  assert.equal(result.status, 'uploaded');
  assert.deepEqual(storage.loadTasks(), [completedTask]);
  assert.deepEqual(uploadedBody?.tasks_upserted.map((task) => task.title), [
    'Auto sync archived task',
  ]);
});

test('saves changed focus records before auto-uploading focus events', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);
  backend.setItem('sea-focus-sync-client-id', 'sf_auto_device');
  writeSeaFocusSyncConfig(backend, {
    endpoint: 'https://personal.opsevo.cn',
    readToken: 'read-token',
  });
  const focusRecord: FocusRecord = {
    id: 'focus-1',
    type: 'pomodoro',
    duration: 1500,
    category: '深度工作',
    timestamp: '2026-05-23T15:10:00.000Z',
  };
  let uploadedBody: {
    tasks_upserted: Array<Record<string, unknown>>;
    focus_records_completed: Array<Record<string, unknown>>;
  } | null = null;
  const fetcher: typeof fetch = async (_url, init) => {
    uploadedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ status: 'ok', accepted: 1, duplicates: 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const result = await saveFocusRecordsAndUploadConfiguredSeaFocusClientEvents({
    backend,
    storage,
    records: [focusRecord],
    fetcher,
  });

  assert.equal(result.status, 'uploaded');
  assert.deepEqual(storage.loadFocusRecords(), [focusRecord]);
  assert.deepEqual(uploadedBody?.focus_records_completed.map((record) => record.category), [
    '深度工作',
  ]);
});
