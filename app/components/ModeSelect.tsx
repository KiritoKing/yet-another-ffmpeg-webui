interface ModeSelectProps {
  useMultiThread: boolean;
  onModeChange: (multiThread: boolean) => void;
}

export function ModeSelect({ useMultiThread, onModeChange }: ModeSelectProps) {
  const isSharedArrayBufferAvailable = typeof SharedArrayBuffer !== 'undefined';

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-800 mb-3">选择运行模式</h3>
      <div className="space-y-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="threadMode"
            checked={useMultiThread}
            onChange={() => onModeChange(true)}
            className="mr-3 w-4 h-4 text-blue-600"
          />
          <div>
            <span className="font-medium text-gray-800">多线程模式 ⚡</span>
            <p className="text-sm text-gray-600">
              推荐 - 性能提升 2-4 倍，适合大文件
              {!isSharedArrayBufferAvailable && (
                <span className="text-orange-600 font-semibold"> (需要重启服务器)</span>
              )}
            </p>
          </div>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="threadMode"
            checked={!useMultiThread}
            onChange={() => onModeChange(false)}
            className="mr-3 w-4 h-4 text-blue-600"
          />
          <div>
            <span className="font-medium text-gray-800">单线程模式 ✓</span>
            <p className="text-sm text-gray-600">兼容性更好，内存占用更低，无需额外配置</p>
          </div>
        </label>
      </div>
    </div>
  );
}
