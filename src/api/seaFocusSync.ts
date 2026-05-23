import { FocusRecord, Task, TaskQuadrant } from '../types';
import { SeaFocusStorageApi } from './seaFocusStorage';

const SYNC_CURSOR_KEY = 'sea-focus-sync-cursor';
const SYNC_TASK_MAP_KEY = 'sea-focus-sync-task-map';
const SYNC_ENDPOINT_KEY = 'sea-focus-sync-endpoint';
const SYNC_READ_TOKEN_KEY = 'sea-focus-sync-read-token';
const SYNC_CLIENT_ID_KEY = 'sea-focus-sync-client-id';
const SYNC_OUTBOX_KEY = 'sea-focus-sync-outbox';

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

export type SeaFocusUploadResult =
  | { status: 'uploaded'; sent: number; accepted: number; duplicates: number }
  | { status: 'empty'; sent: 0 }
  | { status: 'not_configured'; sent: 0 };

export interface SeaFocusSyncApi {
  pullSnapshot: (config: SeaFocusSyncConfig) => Promise<SeaFocusPullResult>;
  uploadClientEvents: (config: SeaFocusSyncConfig) => Promise<SeaFocusUploadResult>;
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
          'x-sea-focus-client-id': getOrCreateSeaFocusSyncClientId(backend),
          'x-sea-focus-platform': 'android',
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

    async uploadClientEvents(config) {
      const outbox = readClientEventOutbox(backend);
      const batch = buildClientEventBatch({
        backend,
        storage,
        uploadedEventIds: outbox.uploadedEventIds,
      });
      const sent = countClientEvents(batch);
      if (sent === 0) {
        return { status: 'empty', sent: 0 };
      }

      const endpoint = new URL('/v1/client-events', normalizeEndpoint(config.endpoint)).toString();
      const response = await fetcher(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.readToken}`,
          'content-type': 'application/json',
          'x-sea-focus-client-id': batch.client_id,
          'x-sea-focus-platform': 'android',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error(`Client event upload failed with HTTP ${response.status}`);
      }

      const body = await response.json() as Partial<{ accepted: number; duplicates: number }>;
      const eventIds = collectClientEventIds(batch);
      writeClientEventOutbox(backend, {
        uploadedEventIds: new Set([...outbox.uploadedEventIds, ...eventIds]),
      });

      return {
        status: 'uploaded',
        sent,
        accepted: Number(body.accepted ?? 0),
        duplicates: Number(body.duplicates ?? 0),
      };
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

export function getOrCreateSeaFocusSyncClientId(
  backend: SeaFocusSyncBackend,
  createClientId = createDefaultSeaFocusSyncClientId,
): string {
  const currentClientId = backend.getItem(SYNC_CLIENT_ID_KEY)?.trim();
  if (currentClientId) {
    return currentClientId;
  }

  const nextClientId = createClientId();
  backend.setItem(SYNC_CLIENT_ID_KEY, nextClientId);
  return nextClientId;
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

export async function uploadConfiguredSeaFocusClientEvents({
  backend,
  storage,
  fetcher = fetch,
}: {
  backend: SeaFocusSyncBackend;
  storage: SeaFocusStorageApi;
  fetcher?: Fetcher;
}): Promise<SeaFocusUploadResult> {
  const config = readSeaFocusSyncConfig(backend);
  if (!config) {
    return { status: 'not_configured', sent: 0 };
  }

  return createSeaFocusSync({ backend, storage, fetcher }).uploadClientEvents(config);
}

export async function saveTasksAndUploadConfiguredSeaFocusClientEvents({
  backend,
  storage,
  tasks,
  fetcher = fetch,
}: {
  backend: SeaFocusSyncBackend;
  storage: SeaFocusStorageApi;
  tasks: Task[];
  fetcher?: Fetcher;
}): Promise<SeaFocusUploadResult> {
  storage.saveTasks(tasks);
  return uploadConfiguredSeaFocusClientEvents({ backend, storage, fetcher });
}

export async function saveFocusRecordsAndUploadConfiguredSeaFocusClientEvents({
  backend,
  storage,
  records,
  fetcher = fetch,
}: {
  backend: SeaFocusSyncBackend;
  storage: SeaFocusStorageApi;
  records: FocusRecord[];
  fetcher?: Fetcher;
}): Promise<SeaFocusUploadResult> {
  storage.saveFocusRecords(records);
  return uploadConfiguredSeaFocusClientEvents({ backend, storage, fetcher });
}

function createDefaultSeaFocusSyncClientId(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) {
    return `sf_${randomUuid}`;
  }

  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return `sf_${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
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

interface ClientEventOutbox {
  uploadedEventIds: Set<string>;
}

interface SeaFocusClientEventBatch {
  schema_version: 1;
  client_id: string;
  client_time: string;
  last_seen_cursor: string | null;
  tasks_upserted: SeaFocusClientTaskEvent[];
  task_tombstones: SeaFocusClientTaskTombstoneEvent[];
  focus_records_completed: SeaFocusClientFocusRecordEvent[];
}

interface SeaFocusClientTaskEvent {
  event_id: string;
  id: string;
  server_task_id: string | null;
  origin: 'server' | 'client';
  title: string;
  quadrant: TaskQuadrant;
  completed: boolean;
  completedAt: string | null;
  date: string;
}

interface SeaFocusClientFocusRecordEvent extends FocusRecord {
  event_id: string;
  task: FocusRecord['task'] | null;
}

interface SeaFocusClientTaskTombstoneEvent {
  event_id: string;
}

function buildClientEventBatch({
  backend,
  storage,
  uploadedEventIds,
}: {
  backend: SeaFocusSyncBackend;
  storage: SeaFocusStorageApi;
  uploadedEventIds: Set<string>;
}): SeaFocusClientEventBatch {
  const taskMapByLocalId = new Map(readSyncTaskMap(backend).map((entry) => [entry.local_task_id, entry]));
  const tasks_upserted = storage.loadTasks()
    .filter((task) => task.completed)
    .map((task) => buildCompletedTaskEvent(task, taskMapByLocalId.get(task.id)))
    .filter((event) => !uploadedEventIds.has(event.event_id));
  const focus_records_completed = storage.loadFocusRecords()
    .map(buildFocusRecordEvent)
    .filter((event) => !uploadedEventIds.has(event.event_id));

  return {
    schema_version: 1,
    client_id: getOrCreateSeaFocusSyncClientId(backend),
    client_time: new Date().toISOString(),
    last_seen_cursor: readSyncCursor(backend)?.revision ?? null,
    tasks_upserted,
    task_tombstones: [],
    focus_records_completed,
  };
}

function buildCompletedTaskEvent(task: Task, mapEntry?: SyncTaskMapEntry): SeaFocusClientTaskEvent {
  const canonicalTaskId = mapEntry?.server_task_id ?? task.id;
  const completedAt = task.completedAt ?? task.date;

  return {
    event_id: `task_completed:${toEventIdPart(canonicalTaskId)}:${toEventIdPart(completedAt)}`,
    id: task.id,
    server_task_id: mapEntry?.server_task_id ?? null,
    origin: mapEntry?.origin ?? 'client',
    title: task.title,
    quadrant: task.quadrant,
    completed: task.completed,
    completedAt,
    date: task.date,
  };
}

function buildFocusRecordEvent(record: FocusRecord): SeaFocusClientFocusRecordEvent {
  return {
    ...record,
    event_id: `focus_completed:${toEventIdPart(record.id)}:${toEventIdPart(record.timestamp)}`,
    task: record.task ?? null,
  };
}

function countClientEvents(batch: SeaFocusClientEventBatch): number {
  return batch.tasks_upserted.length
    + batch.task_tombstones.length
    + batch.focus_records_completed.length;
}

function collectClientEventIds(batch: SeaFocusClientEventBatch): string[] {
  return [
    ...batch.tasks_upserted.map((event) => event.event_id),
    ...batch.task_tombstones.map((event) => event.event_id),
    ...batch.focus_records_completed.map((event) => event.event_id),
  ];
}

function readClientEventOutbox(backend: SeaFocusSyncBackend): ClientEventOutbox {
  try {
    const parsed = JSON.parse(backend.getItem(SYNC_OUTBOX_KEY) ?? '{}');
    const values = Array.isArray(parsed?.uploaded_event_ids) ? parsed.uploaded_event_ids : [];
    return {
      uploadedEventIds: new Set(values.filter((value: unknown) => typeof value === 'string')),
    };
  } catch {
    return { uploadedEventIds: new Set() };
  }
}

function writeClientEventOutbox(backend: SeaFocusSyncBackend, outbox: ClientEventOutbox) {
  backend.setItem(SYNC_OUTBOX_KEY, JSON.stringify({
    uploaded_event_ids: [...outbox.uploadedEventIds].sort(),
  }));
}

function toEventIdPart(value: string): string {
  return value.replace(/[^A-Za-z0-9._:-]/g, '_') || 'unknown';
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
