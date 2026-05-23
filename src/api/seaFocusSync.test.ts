import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeaFocusStorage } from './seaFocusStorage';
import {
  createSeaFocusSync,
  pullConfiguredSeaFocusSnapshot,
  readSeaFocusSyncConfig,
  readSyncTaskMap,
  writeSeaFocusSyncConfig,
  type SeaFocusSyncSnapshotResponse,
} from './seaFocusSync';
import { Task } from '../types';

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

function snapshotResponse(overrides: Partial<SeaFocusSyncSnapshotResponse['snapshot']> = {}): SeaFocusSyncSnapshotResponse {
  return {
    status: 'ok',
    server_time: '2026-05-23T21:31:00+08:00',
    revision: 'rev_20260523_213000_ab12',
    stale: false,
    snapshot: {
      schema_version: 1,
      revision: 'rev_20260523_213000_ab12',
      generated_at: '2026-05-23T21:30:00+08:00',
      plan_date: '2026-05-24',
      scope: 'today',
      tasks: [
        {
          id: 'task-server-1',
          client_task_id: null,
          origin: 'server',
          title: 'Review Personal Ops design',
          quadrant: 'urgent-important',
          completed: false,
          completedAt: null,
          date: '2026-05-24',
        },
      ],
      focus_blocks: [],
      tombstones: [],
      source: 'hermes',
      expires_at: '2026-05-25T00:00:00+08:00',
      ...overrides,
    },
  };
}

function okFetch(body: unknown): typeof fetch {
  return async () => new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

test('pulls a server snapshot into tasks and stores the server task map without duplicating repeats', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);
  const sync = createSeaFocusSync({ backend, storage, fetcher: okFetch(snapshotResponse()) });

  const first = await sync.pullSnapshot({ endpoint: 'https://personal.opsevo.cn', readToken: 'read-token' });
  const second = await sync.pullSnapshot({ endpoint: 'https://personal.opsevo.cn', readToken: 'read-token' });

  assert.equal(first.status, 'merged');
  assert.equal(second.status, 'unchanged');
  assert.deepEqual(storage.loadTasks().map((task) => task.title), ['Review Personal Ops design']);
  assert.deepEqual(readSyncTaskMap(backend).map((entry) => ({
    server_task_id: entry.server_task_id,
    local_task_id: entry.local_task_id,
    mapping_status: entry.mapping_status,
  })), [
    {
      server_task_id: 'task-server-1',
      local_task_id: 'server:task-server-1',
      mapping_status: 'active',
    },
  ]);
});

test('preserves local completion for the same server task across later snapshots', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);
  storage.saveTasks([
    {
      id: 'server:task-server-1',
      title: 'Old title',
      quadrant: 'not-urgent-important',
      completed: true,
      completedAt: '2026-05-24',
      date: '2026-05-24',
    },
  ]);
  backend.setItem('sea-focus-sync-task-map', JSON.stringify([
    {
      local_task_id: 'server:task-server-1',
      server_task_id: 'task-server-1',
      origin: 'server',
      plan_date: '2026-05-24',
      plan_scope: 'today',
      last_seen_revision: 'old-rev',
      local_completed_pending_upload: true,
      mapping_status: 'active',
    },
  ]));

  const sync = createSeaFocusSync({
    backend,
    storage,
    fetcher: okFetch(snapshotResponse({
      revision: 'rev_20260524_090000_cd34',
      tasks: [
        {
          id: 'task-server-1',
          client_task_id: null,
          origin: 'server',
          title: 'New title from Hermes',
          quadrant: 'urgent-important',
          completed: false,
          completedAt: null,
          date: '2026-05-24',
        },
      ],
    })),
  });

  await sync.pullSnapshot({ endpoint: 'https://personal.opsevo.cn', readToken: 'read-token' });

  assert.deepEqual(storage.loadTasks(), [
    {
      id: 'server:task-server-1',
      title: 'Old title',
      quadrant: 'not-urgent-important',
      completed: true,
      completedAt: '2026-05-24',
      date: '2026-05-24',
    },
  ]);
});

test('archives older server-origin tasks on a later plan date while keeping client-origin tasks', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);
  const clientTask: Task = {
    id: 'local-client-task',
    title: 'User-created task',
    quadrant: 'not-urgent-important',
    completed: false,
    date: '2026-05-24',
  };
  storage.saveTasks([
    {
      id: 'server:old-server-task',
      title: 'Old server task',
      quadrant: 'urgent-important',
      completed: false,
      date: '2026-05-23',
    },
    clientTask,
  ]);
  backend.setItem('sea-focus-sync-task-map', JSON.stringify([
    {
      local_task_id: 'server:old-server-task',
      server_task_id: 'old-server-task',
      origin: 'server',
      plan_date: '2026-05-23',
      plan_scope: 'today',
      last_seen_revision: 'old-rev',
      local_completed_pending_upload: false,
      mapping_status: 'active',
    },
  ]));

  const sync = createSeaFocusSync({ backend, storage, fetcher: okFetch(snapshotResponse()) });

  await sync.pullSnapshot({ endpoint: 'https://personal.opsevo.cn', readToken: 'read-token' });

  assert.deepEqual(storage.loadTasks().map((task) => task.id), [
    'server:task-server-1',
    'local-client-task',
  ]);
  assert.equal(
    readSyncTaskMap(backend).find((entry) => entry.server_task_id === 'old-server-task')?.mapping_status,
    'archived',
  );
});

test('does not merge a stale snapshot over local tasks', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);
  const localTask: Task = {
    id: 'local-client-task',
    title: 'Keep local',
    quadrant: 'not-urgent-important',
    completed: false,
    date: '2026-05-24',
  };
  storage.saveTasks([localTask]);
  const sync = createSeaFocusSync({
    backend,
    storage,
    fetcher: okFetch({ ...snapshotResponse(), stale: true }),
  });

  const result = await sync.pullSnapshot({ endpoint: 'https://personal.opsevo.cn', readToken: 'read-token' });

  assert.equal(result.status, 'stale');
  assert.deepEqual(storage.loadTasks(), [localTask]);
});

test('reads sync config only when endpoint and read token are both present', () => {
  const backend = createMemoryStorage();

  assert.equal(readSeaFocusSyncConfig(backend), null);

  backend.setItem('sea-focus-sync-endpoint', 'https://personal.opsevo.cn');
  assert.equal(readSeaFocusSyncConfig(backend), null);

  backend.setItem('sea-focus-sync-read-token', 'read-token');
  assert.deepEqual(readSeaFocusSyncConfig(backend), {
    endpoint: 'https://personal.opsevo.cn',
    readToken: 'read-token',
  });
});

test('writes trimmed sync config for later automatic pulls', () => {
  const backend = createMemoryStorage();

  writeSeaFocusSyncConfig(backend, {
    endpoint: '  https://seafocus.opsevo.cn/  ',
    readToken: '  read-token  ',
  });

  assert.deepEqual(readSeaFocusSyncConfig(backend), {
    endpoint: 'https://seafocus.opsevo.cn/',
    readToken: 'read-token',
  });
});

test('configured pull is a no-op when sync settings are absent', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);

  const result = await pullConfiguredSeaFocusSnapshot({ backend, storage, fetcher: okFetch(snapshotResponse()) });

  assert.equal(result.status, 'not_configured');
  assert.deepEqual(storage.loadTasks(), []);
});
