import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeaFocusStorage } from './seaFocusStorage';
import {
  createSeaFocusSync,
  getOrCreateSeaFocusSyncClientId,
  pullConfiguredSeaFocusSnapshot,
  readSeaFocusSyncConfig,
  readSyncTaskMap,
  uploadConfiguredSeaFocusClientEvents,
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

test('creates one stable Sea Focus sync client id for audit headers', () => {
  const backend = createMemoryStorage();

  const first = getOrCreateSeaFocusSyncClientId(backend, () => 'sf_test_device');
  const second = getOrCreateSeaFocusSyncClientId(backend, () => 'sf_other_device');

  assert.equal(first, 'sf_test_device');
  assert.equal(second, 'sf_test_device');
});

test('sends Sea Focus sync client metadata headers on snapshot pulls', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);
  backend.setItem('sea-focus-sync-client-id', 'sf_test_device');
  const seenHeaders: Record<string, string | null> = {};
  const fetcher: typeof fetch = async (_url, init) => {
    const headers = new Headers(init?.headers);
    seenHeaders.authorization = headers.get('authorization');
    seenHeaders.clientId = headers.get('x-sea-focus-client-id');
    seenHeaders.platform = headers.get('x-sea-focus-platform');
    return new Response(JSON.stringify(snapshotResponse()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const sync = createSeaFocusSync({ backend, storage, fetcher });

  await sync.pullSnapshot({ endpoint: 'https://personal.opsevo.cn', readToken: 'read-token' });

  assert.deepEqual(seenHeaders, {
    authorization: 'Bearer read-token',
    clientId: 'sf_test_device',
    platform: 'android',
  });
});

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

test('uploads completed tasks and focus records once with stable client event ids', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);
  backend.setItem('sea-focus-sync-client-id', 'sf_test_device');
  writeSeaFocusSyncConfig(backend, {
    endpoint: 'https://personal.opsevo.cn',
    readToken: 'read-token',
  });
  storage.saveTasks([
    {
      id: 'server:task-server-1',
      title: 'Review Personal Ops design',
      quadrant: 'urgent-important',
      completed: true,
      completedAt: '2026-05-24',
      date: '2026-05-24',
    },
    {
      id: 'local-active-task',
      title: 'Still active',
      quadrant: 'not-urgent-important',
      completed: false,
      date: '2026-05-24',
    },
  ]);
  storage.saveFocusRecords([
    {
      id: 'focus-1',
      type: 'pomodoro',
      duration: 1500,
      category: '深度工作',
      timestamp: '2026-05-24T09:30:00.000Z',
      task: {
        taskId: 'server:task-server-1',
        taskTitle: 'Review Personal Ops design',
        taskQuadrant: 'urgent-important',
        taskDate: '2026-05-24',
        taskLinkStatus: 'active',
      },
    },
  ]);
  backend.setItem('sea-focus-sync-task-map', JSON.stringify([
    {
      local_task_id: 'server:task-server-1',
      server_task_id: 'task-server-1',
      origin: 'server',
      plan_date: '2026-05-24',
      plan_scope: 'today',
      last_seen_revision: 'rev_20260523_213000_ab12',
      local_completed_pending_upload: true,
      mapping_status: 'active',
    },
  ]));
  const requests: Array<{
    url: string;
    method?: string;
    headers: Record<string, string | null>;
    body: {
      client_id: string;
      client_time: string;
      tasks_upserted: Array<Record<string, unknown>>;
      task_tombstones: Array<Record<string, unknown>>;
      focus_records_completed: Array<Record<string, unknown>>;
    };
  }> = [];
  const fetcher: typeof fetch = async (url, init) => {
    const headers = new Headers(init?.headers);
    const body = JSON.parse(String(init?.body));
    requests.push({
      url: String(url),
      method: init?.method,
      headers: {
        authorization: headers.get('authorization'),
        clientId: headers.get('x-sea-focus-client-id'),
        platform: headers.get('x-sea-focus-platform'),
      },
      body,
    });
    return new Response(JSON.stringify({ status: 'ok', accepted: 2, duplicates: 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const first = await uploadConfiguredSeaFocusClientEvents({ backend, storage, fetcher });
  const second = await uploadConfiguredSeaFocusClientEvents({ backend, storage, fetcher });

  assert.deepEqual(first, { status: 'uploaded', sent: 2, accepted: 2, duplicates: 0 });
  assert.deepEqual(second, { status: 'empty', sent: 0 });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://personal.opsevo.cn/v1/client-events');
  assert.deepEqual(requests[0].headers, {
    authorization: 'Bearer read-token',
    clientId: 'sf_test_device',
    platform: 'android',
  });
  assert.equal(requests[0].body.client_id, 'sf_test_device');
  assert.match(requests[0].body.client_time, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(requests[0].body.tasks_upserted, [
    {
      event_id: 'task_completed:task-server-1:2026-05-24',
      id: 'server:task-server-1',
      server_task_id: 'task-server-1',
      origin: 'server',
      title: 'Review Personal Ops design',
      quadrant: 'urgent-important',
      completed: true,
      completedAt: '2026-05-24',
      date: '2026-05-24',
    },
  ]);
  assert.deepEqual(requests[0].body.task_tombstones, []);
  assert.deepEqual(requests[0].body.focus_records_completed, [
    {
      event_id: 'focus_completed:focus-1:2026-05-24T09:30:00.000Z',
      id: 'focus-1',
      type: 'pomodoro',
      duration: 1500,
      category: '深度工作',
      timestamp: '2026-05-24T09:30:00.000Z',
      task: {
        taskId: 'server:task-server-1',
        taskTitle: 'Review Personal Ops design',
        taskQuadrant: 'urgent-important',
        taskDate: '2026-05-24',
        taskLinkStatus: 'active',
      },
    },
  ]);
});

test('configured client event upload is a no-op when sync settings are absent', async () => {
  const backend = createMemoryStorage();
  const storage = createSeaFocusStorage(backend);
  let fetchCalls = 0;
  const fetcher: typeof fetch = async () => {
    fetchCalls += 1;
    return new Response('{}');
  };

  const result = await uploadConfiguredSeaFocusClientEvents({ backend, storage, fetcher });

  assert.deepEqual(result, { status: 'not_configured', sent: 0 });
  assert.equal(fetchCalls, 0);
});
