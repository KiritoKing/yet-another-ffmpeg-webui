import mitt, { type Emitter } from "mitt";

// 定义应用全局事件类型
export type AppEvents = {
	// Driver.js 引导相关事件
	"driver:highlight-command-panel": undefined;
	"driver:highlight-queue-panel": { presetName?: string };
	"driver:highlight-task-history": undefined;
	"driver:highlight-custom-form": { presetId?: string };
	"driver:highlight-batch-upload": { presetName?: string };
	"driver:highlight-settings": undefined;
	"driver:highlight-help": undefined;

	// 标签页切换事件
	"tabs:switch-to-queue": undefined;
	"tabs:switch-to-history": undefined;

	// 命令选择事件
	"command:select": { presetId?: string; presetName?: string };
	"command:select-first": undefined;
	"command:select-by-category": { category: string };
	"command:select-with-form": undefined;
	"command:select-copy-stream": undefined;

	// UI 状态事件
	"ui:scroll-to-element": { elementId: string };
	"ui:focus-input": { inputId?: string };
	"ui:show-loading": { message?: string };
	"ui:hide-loading": undefined;

	// FFmpeg 相关事件
	"ffmpeg:select-mode": { mode: "single-thread" | "multi-thread" };
	"ffmpeg:load-complete": undefined;
	"ffmpeg:load-error": { error: string };
};

// 创建全局事件发射器实例
const emitter: Emitter<AppEvents> = mitt<AppEvents>();

// 导出事件发射器和类型
export { emitter };
export type AppEmitter = Emitter<AppEvents>;

// 便捷的事件发射函数
export const emit = emitter.emit.bind(emitter);
export const on = emitter.on.bind(emitter);
export const off = emitter.off.bind(emitter);

// 批量事件监听器管理
export class EventManager {
	private listeners: Array<{
		type: keyof AppEvents;
		handler: (event: any) => void;
	}> = [];

	/**
	 * 添加事件监听器并记录以便清理
	 */
	add<T extends keyof AppEvents>(
		type: T,
		handler: (event: AppEvents[T]) => void,
	) {
		emitter.on(type, handler);
		this.listeners.push({ type, handler });
	}

	/**
	 * 移除特定事件监听器
	 */
	remove<T extends keyof AppEvents>(
		type: T,
		handler: (event: AppEvents[T]) => void,
	) {
		emitter.off(type, handler);
		this.listeners = this.listeners.filter(
			(listener) => listener.type !== type || listener.handler !== handler,
		);
	}

	/**
	 * 清理所有事件监听器
	 */
	clear() {
		this.listeners.forEach(({ type, handler }) => {
			emitter.off(type, handler);
		});
		this.listeners = [];
	}

	/**
	 * 移除特定类型的所有监听器
	 */
	clearType<T extends keyof AppEvents>(type: T) {
		const typeListeners = this.listeners.filter((l) => l.type === type);
		typeListeners.forEach(({ handler }) => {
			emitter.off(type, handler);
		});
		this.listeners = this.listeners.filter((l) => l.type !== type);
	}
}

// 导出全局事件管理器实例
export const eventManager = new EventManager();

// 向后兼容的别名
export const globalEventManager = eventManager;
