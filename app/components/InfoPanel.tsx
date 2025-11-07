export function InfoPanel() {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        说明
      </h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">多线程 vs 单线程</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm ml-4">
            <li><strong>多线程 ⚡</strong>: 使用所有 CPU 核心，速度快 2-4 倍，适合大文件</li>
            <li><strong>单线程 ✓</strong>: 兼容性更好，内存占用低，适合小文件或低配设备</li>
          </ul>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <h4 className="font-semibold text-yellow-800 mb-1 text-sm">⚠️ 多线程模式要求</h4>
          <p className="text-yellow-700 text-xs">
            多线程模式需要启用 <code className="bg-yellow-100 px-1 rounded">SharedArrayBuffer</code>。
            如果遇到错误，请：<br/>
            1) 重启开发服务器 (<code className="bg-yellow-100 px-1 rounded">pnpm dev</code>)<br/>
            2) 或者使用单线程模式（无需额外配置）
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">功能特性</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm ml-4">
            <li>🔒 所有处理都在客户端完成，无需上传到服务器，保护隐私</li>
            <li>🎯 当前示例将视频转换为 WebM (VP9) 格式</li>
            <li>📦 首次加载需要下载约 30MB 的 WebAssembly 文件</li>
            <li>💡 处理速度取决于您的设备性能和视频大小</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
