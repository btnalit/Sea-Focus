import React, { useState } from 'react';
import { RefreshCw, Save, X } from 'lucide-react';
import { motion } from 'motion/react';
import { SeaFocusSyncConfig } from '../api/seaFocusSync';
import { cn } from '../lib/utils';

export type SyncStatusState =
  | { state: 'idle'; message?: string; lastSyncedAt?: string }
  | { state: 'not_configured'; message?: string; lastSyncedAt?: string }
  | { state: 'syncing'; message?: string; lastSyncedAt?: string }
  | { state: 'synced'; message?: string; lastSyncedAt?: string }
  | { state: 'unchanged'; message?: string; lastSyncedAt?: string }
  | { state: 'stale'; message?: string; lastSyncedAt?: string }
  | { state: 'empty'; message?: string; lastSyncedAt?: string }
  | { state: 'error'; message?: string; lastSyncedAt?: string };

interface SyncSettingsModalProps {
  initialConfig: SeaFocusSyncConfig;
  status: SyncStatusState;
  onSave: (config: SeaFocusSyncConfig) => void | Promise<void>;
  onSync: (config: SeaFocusSyncConfig) => void | Promise<void>;
  onClose: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  initialConfig,
  status,
  onSave,
  onSync,
  onClose,
}) => {
  const [endpoint, setEndpoint] = useState(initialConfig.endpoint);
  const [readToken, setReadToken] = useState(initialConfig.readToken);
  const isBusy = status.state === 'syncing';
  const canSubmit = endpoint.trim().length > 0 && readToken.trim().length > 0 && !isBusy;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    void onSave({ endpoint, readToken });
  };

  return (
    <div className="fixed inset-0 bg-[#4a4a3544] backdrop-blur-sm z-[120] flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm max-h-[calc(100dvh-3rem)] overflow-y-auto bg-nature-bg border border-nature-border rounded-[36px] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] font-bold tracking-widest opacity-40 mb-2">SEA FOCUS</div>
            <h3 className="italic-serif text-2xl italic leading-none">云端同步</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-nature-border bg-white flex items-center justify-center text-nature-text/50 active:scale-95 transition-transform"
            aria-label="关闭同步设置"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-[10px] font-bold tracking-widest opacity-40 mb-2">API 地址</span>
            <input
              className="w-full min-w-0 rounded-2xl border border-nature-border bg-white px-4 py-3 text-sm outline-none focus:border-nature-primary"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              autoComplete="url"
              inputMode="url"
            />
          </label>

          <label className="block">
            <span className="block text-[10px] font-bold tracking-widest opacity-40 mb-2">读取 Token</span>
            <input
              className="w-full min-w-0 rounded-2xl border border-nature-border bg-white px-4 py-3 text-sm outline-none focus:border-nature-primary"
              value={readToken}
              onChange={(event) => setReadToken(event.target.value)}
              autoComplete="off"
              type="password"
            />
          </label>

          <div className="flex items-center gap-2 min-h-10 rounded-2xl bg-white/70 border border-nature-border px-4 py-3">
            <span className={cn('w-2 h-2 rounded-full shrink-0', getStatusDotClass(status.state))} />
            <span className="min-w-0 text-xs font-bold tracking-widest opacity-60 break-words">
              {getStatusLabel(status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-12 rounded-2xl bg-nature-primary text-white flex items-center justify-center gap-2 text-xs font-bold tracking-widest disabled:opacity-35 active:scale-95 transition-transform"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
            <button
              type="button"
              onClick={() => void onSync({ endpoint, readToken })}
              disabled={!canSubmit}
              className="h-12 rounded-2xl bg-white border border-nature-secondary text-nature-secondary flex items-center justify-center gap-2 text-xs font-bold tracking-widest disabled:opacity-35 active:scale-95 transition-transform"
            >
              <RefreshCw className={cn('w-4 h-4', isBusy && 'animate-spin')} />
              立即同步
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

function getStatusLabel(status: SyncStatusState): string {
  if (status.message) {
    return status.message;
  }

  switch (status.state) {
    case 'not_configured':
      return '未配置';
    case 'syncing':
      return '同步中';
    case 'synced':
      return status.lastSyncedAt ? `已同步 ${status.lastSyncedAt}` : '已同步';
    case 'unchanged':
      return status.lastSyncedAt ? `已是最新 ${status.lastSyncedAt}` : '已是最新';
    case 'stale':
      return '云端计划已过期';
    case 'empty':
      return '云端暂无计划';
    case 'error':
      return '同步失败';
    default:
      return '待同步';
  }
}

function getStatusDotClass(state: SyncStatusState['state']): string {
  if (state === 'synced' || state === 'unchanged') {
    return 'bg-[#7c8363]';
  }
  if (state === 'syncing') {
    return 'bg-[#d0a460] animate-pulse';
  }
  if (state === 'stale' || state === 'error') {
    return 'bg-[#c68a73]';
  }
  return 'bg-nature-border';
}
