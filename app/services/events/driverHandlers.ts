import { type AppEmitter, emitter } from "./index";

/**
 * Driver.js 引导步骤的事件处理器
 * 负责处理引导过程中的状态变化，避免直接操作 DOM
 */
export class DriverEventHandlers {
	private emitter: AppEmitter;

	constructor(emitter: AppEmitter) {
		this.emitter = emitter;
	}

	/**
	 * 注册所有 Driver.js 相关的事件处理器
	 */
	register() {
		// 高亮命令面板时的事件处理
		this.emitter.on("driver:highlight-command-panel", () => {
			console.log("🔥 Driver handler: driver:highlight-command-panel received");
			// 确保有选中的命令
			this.emitter.emit("command:select-first");
		});

		// 高亮执行面板时的事件处理
		this.emitter.on("driver:highlight-queue-panel", ({ presetName }) => {
			console.log("🔥 Driver handler: driver:highlight-queue-panel received", {
				presetName,
			});
			// 切换到队列标签页
			console.log("📤 Emitting: tabs:switch-to-queue");
			this.emitter.emit("tabs:switch-to-queue");

			// 选择复制流命令或指定命令
			if (presetName) {
				console.log("📤 Emitting: command:select with presetName:", presetName);
				this.emitter.emit("command:select", { presetName });
			} else {
				console.log("📤 Emitting: command:select-copy-stream");
				this.emitter.emit("command:select-copy-stream");
			}
		});

		// 高亮任务历史时的事件处理
		this.emitter.on("driver:highlight-task-history", () => {
			console.log("🔥 Driver handler: driver:highlight-task-history received");
			// 切换到历史标签页
			console.log("📤 Emitting: tabs:switch-to-history");
			this.emitter.emit("tabs:switch-to-history");
		});

		// 高亮自定义表单时的事件处理
		this.emitter.on("driver:highlight-custom-form", ({ presetId }) => {
			// 切换到队列标签页
			this.emitter.emit("tabs:switch-to-queue");

			// 选择有表单的命令
			if (presetId) {
				this.emitter.emit("command:select", { presetId });
			} else {
				this.emitter.emit("command:select-with-form");
			}
		});

		// 高亮批量上传时的事件处理
		this.emitter.on("driver:highlight-batch-upload", ({ presetName }) => {
			// 切换到队列标签页
			this.emitter.emit("tabs:switch-to-queue");

			// 选择支持批量处理的命令
			if (presetName) {
				this.emitter.emit("command:select", { presetName });
			} else {
				this.emitter.emit("command:select-by-category", {
					category: "基础操作",
				});
			}
		});

		// 高亮设置按钮时的事件处理
		this.emitter.on("driver:highlight-settings", () => {
			// 滚动到设置按钮位置
			this.emitter.emit("ui:scroll-to-element", {
				elementId: "settings-button",
			});
		});

		// 高亮帮助按钮时的事件处理
		this.emitter.on("driver:highlight-help", () => {
			// 滚动到帮助按钮位置
			this.emitter.emit("ui:scroll-to-element", { elementId: "help-button" });
		});
	}

	/**
	 * 取消注册所有事件处理器
	 */
	unregister() {
		// 清理相关事件类型
		this.emitter.all.clear();
	}
}

/**
 * 创建并注册 Driver.js 事件处理器
 */
export function setupDriverEventHandlers() {
	const handlers = new DriverEventHandlers(emitter);
	handlers.register();
	return handlers;
}
