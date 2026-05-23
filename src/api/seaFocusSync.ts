import { Task, TaskQuadrant } from '../types';
import { SeaFocusStorageApi } from './seaFocusStorage';

const SYNC_CURSOR_KEY = 'sea-focus-sync-cursor';
const SYNC_TASK_MAP_KEY = 'sea-focus-sync-task-map';
const SYNC_ENDPOINT_KEY = 'sea-focus-sync-endpoint';
const SYNC_READ_TOKEN_KEY = 'sea-focus-sync-read-token';

export const DEFAULT_SEA_FOCUS_SYNC_ENDPOINT = 'https://seafocus.opsevo.cn';

type SeaFocusSyncBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Fetcher = typeof fetch;

export interface SeaFocusSyncSnapshotTask {
  id: string;
  client_task_id: string | null;
  origin: 'server' | 'client';
  title: string;
  quadrant: TaskQuadrant;
  completed: boolean;
  completedAt: string | null;
  date: string;
}

export interface SeaFocusSyncTombstone {
  entity_type: 'task' | string;
  id: string;
  client_task_id: string | null;
  deleted_at: string;
  reason: string;
}

export interface SeaFocusSyncSnapshot {
  schema_version: 1;
  revision: string;
  generated_at: string;
  plan_date: string;
  scope: string;
  tasks: SeaFocusSyncSnapshotTask[];
  focus_blocks: unknown[];
  tombstones: SeaFocusSyncTombstone[];
  source: string;
  expires_at: string;
  message?: string;
}

export interface SeaFocusSyncSnapshotResponse {
  status: 'ok';
  server_time: string;
  revision: string;
  stale: boolean;
  snapshot: SeaFocusSyncSnapshot;
}

export interface SyncTaskMapEntry {
  local_task_id: string;
  server_task_id: string;
  origin: 'server' | 'client';
  plan_date: string;
  plan_scope: string;
  last_seen_revision: string;
  local_completed_pending_upload: boolean;
  mapping_status: 'active' | 'archived' | 'tombstoned';
}

export interface SeaFocusSyncConfig {
  endpoint: string;
  readToken: string;
}

export type SeaFocusPullResult =
  | { status: 'merged'; revision: string; tasks: Task[] }
  | { status: 'unchanged'; revision: string; tasks: Task[] }
  | { status: 'stale'; revision: string; tasks: Task[] }
  | { status: 'empty'; tasks: Task[] }
  | { status: 'not_configured'; tasks: Task[] };

export interface SeaFocusSyncApi {
  pullSnapshot: (config: SeaFocusSyncConfig) => Promise<SeaFocusPullResult>;
}

export function createSeaFocusSync({
  backend,
  storage,
  fetcher = fetch,
}: {
  backend: SeaFocusSyncBackend;
  storage: SeaFocusStorageApi;
  fetcher?: Fetcher;
}): SeaFocusSyncApi {
  return {
    async pullSnapshot(config) {
      const endpoint = new URL('/v1/snapshot', normalizeEndpoint(config.endpoint)).toString();
      const response = await fetcher(endpoint, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${config.readToken}`,
        },
      });

      if (response.status === 404) {
        return { status: 'empty', tasks: storage.loadTasks() };
      }

      if (!response.ok) {
        throw new Error(`Snapshot sync failed with HTTP ${response.status}`);
      }

      const body = await response.json() as SeaFocusSyncSnapshotResponse;
      const currentTasks = storage.loadTasks();
      if (body.stale) {
        return { status: 'stale', revision: body.revision, tasks: currentTasks };
      }

      const currentCursor = readSyncCursor(backend);
      if (currentCursor?.revision === body.revision) {
        return { status: 'unchanged', revision: body.revision, tasks: currentTasks };
      }

      const mergeResult = mergeSnapshotIntoTasks({
        currentTasks,
        currentTaskMap: readSyncTaskMap(backend),
        response: body,
      });

      storage.saveTasks(mergeResult.tasks);
      writeSyncTaskMap(backend, mergeResult.taskMap);
      writeSyncCursor(backend, {
        revision: body.revision,
        server_time: body.server_time,
        synced_at: new Date().toISOString(),
      });

      return { status: 'merged', revision: body.revision, tasks: mergeResult.tasks };
    },
  };
}

export function readSyncTaskMap(backend: SeaFocusSyncBackend): SyncTaskMapEntry[] {
  try {
    const parsed = JSON.parse(backend.getItem(SYNC_TASK_MAP_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isSyncTaskMapEntry) : [];
  } catch {
    return [];
  }
}

export function readSeaFocusSyncConfig(backend: SeaFocusSyncBackend): SeaFocusSyncConfig | null {
  const endpoint = backend.getItem(SYNC_ENDPOINT_KEY)?.trim();
  const readToken = backend.getItem(SYNC_READ_TOKEN_KEY)?.trim();
  if (!endpoint || !readToken) {
    return null;
  }

  return { endpoint, readToken };
}

export function writeSeaFocusSyncConfig(
  backend: SeaFocusSyncBackend,
  config: SeaFocusSyncConfig,
): SeaFocusSyncConfig | null {
  const endpoint = config.endpoint.trim();
  const readToken = config.readToken.trim();

  if (!endpoint || !readToken) {
    backend.removeItem(SYNC_ENDPOINT_KEY);
    backend.removeItem(SYNC_READ_TOKEN_KEY);
    return null;
  }

  backend.setItem(SYNC_ENDPOINT_KEY, endpoint);
  backend.setItem(SYNC_READ_TOKEN_KEY, readToken);
  return { endpoint, readToken };
}

export async function pullConfiguredSeaFocusSnapshot({
  backend,
  storage,
  fetcher = fetch,
}: {
  backend: SeaFocusSyncBackend;
  storage: SeaFocusStorageApi;
  fetcher?: Fetcher;
}): Promise<SeaFocusPullResult> {
  const config = readSeaFocusSyncConfig(backend);
  if (!config) {
    return { status: 'not_configured', tasks: storage.loadTasks() };
  }

  return createSeaFocusSync({ backend, storage, fetcher }).pullSnapshot(config);
}

function mergeSnapshotIntoTasks({
  currentTasks,
  currentTaskMap,
  response,
}: {
  currentTasks: Task[];
  currentTaskMap: SyncTaskMapEntry[];
  response: SeaFocusSyncSnapshotResponse;
}): { tasks: Task[]; taskMap: SyncTaskMapEntry[] } {
  const snapshot = response.snapshot;
  const mapByServerId = new Map(currentTaskMap.map((entry) => [entry.server_task_id, entry]));
  const mapByClientId = new Map(currentTaskMap.map((entry) => [entry.local_task_id, entry]));
  const currentById = new Map(currentTasks.map((task) => [task.id, task]));
  const nextTaskIds = new Set<string>();
  const seenServerIds = new Set<string>();
  const nextMap = new Map<string, SyncTaskMapEntry>();
  const nextTasks: Task[] = [];

  for (const snapshotTask of snapshot.tasks) {
    const existingMap = mapByServerId.get(snapshotTask.id)
      ?? (snapshotTask.client_task_id ? mapByClientId.get(snapshotTask.client_task_id) : undefined);
    const localTaskId = existingMap?.local_task_id
      ?? snapshotTask.client_task_id
      ?? buildServerLocalTaskId(snapshotTask.id);
    const currentTask = currentById.get(localTaskId);
    const localCompletedPendingUpload = Boolean(
      currentTask?.completed && !snapshotTask.completed,
    );
    const nextTask = localCompletedPendingUpload && currentTask
      ? currentTask
      : projectSnapshotTask(snapshotTask, localTaskId);

    nextTasks.push(nextTask);
    nextTaskIds.add(localTaskId);
    seenServerIds.add(snapshotTask.id);
    nextMap.set(snapshotTask.id, {
      local_task_id: localTaskId,
      server_task_id: snapshotTask.id,
      origin: snapshotTask.origin,
      plan_date: snapshot.plan_date,
      plan_scope: snapshot.scope,
      last_seen_revision: response.revision,
      local_completed_pending_upload: localCompletedPendingUpload,
      mapping_status: 'active',
    });
  }

  const tombstonedServerIds = new Set<string>();
  const tombstonedLocalIds = new Set<string>();
  for (const tombstone of snapshot.tombstones) {
    if (tombstone.entity_type !== 'task') {
      continue;
    }
    tombstonedServerIds.add(tombstone.id);
    const existingMap = mapByServerId.get(tombstone.id);
    if (existingMap) {
      tombstonedLocalIds.add(existingMap.local_task_id);
      nextMap.set(tombstone.id, { ...existingMap, mapping_status: 'tombstoned' });
    }
    if (tombstone.client_task_id) {
      tombstonedLocalIds.add(tombstone.client_task_id);
    }
  }

  for (const task of currentTasks) {
    if (nextTaskIds.has(task.id) || tombstonedLocalIds.has(task.id)) {
      continue;
    }

    const mapEntry = currentTaskMap.find((entry) => entry.local_task_id === task.id);
    if (!mapEntry || mapEntry.origin === 'client') {
      nextTasks.push(task);
      continue;
    }

    if (tombstonedServerIds.has(mapEntry.server_task_id)) {
      nextMap.set(mapEntry.server_task_id, { ...mapEntry, mapping_status: 'tombstoned' });
      continue;
    }

    if (
      mapEntry.origin === 'server'
      && mapEntry.mapping_status === 'active'
      && mapEntry.plan_date < snapshot.plan_date
      && !task.completed
      && !mapEntry.local_completed_pending_upload
      && !seenServerIds.has(mapEntry.server_task_id)
    ) {
      nextMap.set(mapEntry.server_task_id, { ...mapEntry, mapping_status: 'archived' });
      continue;
    }

    nextTasks.push(task);
    nextMap.set(mapEntry.server_task_id, mapEntry);
  }

  return {
    tasks: nextTasks,
    taskMap: mergeUnseenMapEntries(currentTaskMap, [...nextMap.values()]),
  };
}

function projectSnapshotTask(snapshotTask: SeaFocusSyncSnapshotTask, localTaskId: string): Task {
  return {
    id: localTaskId,
    title: snapshotTask.title,
    quadrant: snapshotTask.quadrant,
    completed: snapshotTask.completed,
    completedAt: snapshotTask.completedAt ?? undefined,
    date: snapshotTask.date,
  };
}

function mergeUnseenMapEntries(current: SyncTaskMapEntry[], next: SyncTaskMapEntry[]): SyncTaskMapEntry[] {
  const byServerId = new Map(next.map((entry) => [entry.server_task_id, entry]));
  for (const entry of current) {
    if (!byServerId.has(entry.server_task_id)) {
      byServerId.set(entry.server_task_id, entry);
    }
  }
  return [...byServerId.values()];
}

function writeSyncTaskMap(backend: SeaFocusSyncBackend, taskMap: SyncTaskMapEntry[]) {
  backend.setItem(SYNC_TASK_MAP_KEY, JSON.stringify(taskMap));
}

function readSyncCursor(backend: SeaFocusSyncBackend): { revision: string } | null {
  try {
    const parsed = JSON.parse(backend.getItem(SYNC_CURSOR_KEY) ?? 'null');
    return parsed && typeof parsed.revision === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function writeSyncCursor(backend: SeaFocusSyncBackend, cursor: {
  revision: string;
  server_time: string;
  synced_at: string;
}) {
  backend.setItem(SYNC_CURSOR_KEY, JSON.stringify(cursor));
}

function buildServerLocalTaskId(serverTaskId: string): string {
  return `server:${serverTaskId}`;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
}

function isSyncTaskMapEntry(value: unknown): value is SyncTaskMapEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const entry = value as Partial<SyncTaskMapEntry>;
  return typeof entry.local_task_id === 'string'
    && typeof entry.server_task_id === 'string'
    && (entry.origin === 'server' || entry.origin === 'client')
    && typeof entry.plan_date === 'string'
    && typeof entry.plan_scope === 'string'
    && typeof entry.last_seen_revision === 'string'
    && typeof entry.local_completed_pending_upload === 'boolean'
    && (
      entry.mapping_status === 'active'
      || entry.mapping_status === 'archived'
      || entry.mapping_status === 'tombstoned'
    );
}
