import { useEffect, useRef } from 'react';
import { useLogStore } from '../store/logStore';
import type { LogEntry } from '../types/log';

export function LogViewer() {
  const logs = useLogStore((state) => state.logs);
  const logEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新日志
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">处理日志</h3>
        <span className="text-xs text-gray-500">{logs.length} 条记录</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">暂无日志</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`px-3 py-2 rounded border text-sm font-mono ${getLogColor(log.type)}`}
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0">{getLogIcon(log.type)}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs opacity-75">{log.timestamp}</span>
                  <p className="wrap-break-word">{log.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
