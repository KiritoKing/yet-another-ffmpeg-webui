import { useEffect } from "react";
import type { AppEvents } from "../services/events";
import { globalEventManager } from "../services/events";
import { useCommandStore } from "../store/command";
import { useFFmpegWebStore } from "../store/ffmpegWeb";

/**
 * 全局事件监听 Hook
 * 处理应用中通过事件系统触发的状态变化
 */
export const useEventListeners = () => {
	const { presets } = useCommandStore();
	const { setShowSettings, setSelectedPreset } = useFFmpegWebStore();

	useEffect(() => {
		// 命令选择事件处理器
		globalEventManager.add("command:select-first", () => {
			console.log("🎯 Event: command:select-first received");
			const firstPreset = presets[0];
			if (firstPreset) {
				console.log("✅ Selecting first preset:", firstPreset.name);
				setSelectedPreset(firstPreset);
			} else {
				console.log("❌ No presets available");
			}
		});

		globalEventManager.add("command:select", ({ presetId, presetName }) => {
			if (presetId) {
				const preset = presets.find((p) => p.id === presetId);
				if (preset) {
					setSelectedPreset(preset);
				}
			} else if (presetName) {
				const preset = presets.find((p) => p.name.includes(presetName));
				if (preset) {
					setSelectedPreset(preset);
				}
			}
		});

		globalEventManager.add("command:select-copy-stream", () => {
			console.log("🎯 Event: command:select-copy-stream received");
			const copyStreamPreset = presets.find((p) => p.name.includes("复制流"));
			if (copyStreamPreset) {
				console.log("✅ Selecting copy stream preset:", copyStreamPreset.name);
				setSelectedPreset(copyStreamPreset);
			} else {
				console.log("❌ No copy stream preset found");
			}
		});

		globalEventManager.add("command:select-with-form", () => {
			const formPreset = presets.find(
				(p) => p.formSchema && p.formSchema.length > 0,
			);
			if (formPreset) {
				setSelectedPreset(formPreset);
			}
		});

		globalEventManager.add("command:select-by-category", ({ category }) => {
			const categoryPreset = presets.find((p) => p.category === category);
			if (categoryPreset) {
				setSelectedPreset(categoryPreset);
			}
		});

		// 标签页切换事件处理器
		globalEventManager.add("tabs:switch-to-queue", () => {
			console.log("🎯 Event: tabs:switch-to-queue received");
			// 使用 setTimeout 确保 DOM 更新完成
			setTimeout(() => {
				const queueTab = document.getElementById(
					"queue-tab",
				) as HTMLButtonElement;
				console.log(
					"🔍 Queue tab found:",
					queueTab,
					"state:",
					queueTab?.getAttribute("data-state"),
				);
				if (queueTab && queueTab.getAttribute("data-state") === "inactive") {
					console.log("✅ Clicking queue tab");
					queueTab.click();
				} else if (
					queueTab &&
					queueTab.getAttribute("data-state") === "active"
				) {
					console.log("ℹ️ Queue tab already active");
				} else {
					console.log("❌ Queue tab not found or already active");
				}
			}, 100);
		});

		globalEventManager.add("tabs:switch-to-history", () => {
			console.log("🎯 Event: tabs:switch-to-history received");
			setTimeout(() => {
				const historyTab = document.getElementById(
					"history-tab",
				) as HTMLButtonElement;
				console.log(
					"🔍 History tab found:",
					historyTab,
					"state:",
					historyTab?.getAttribute("data-state"),
				);
				if (
					historyTab &&
					historyTab.getAttribute("data-state") === "inactive"
				) {
					console.log("✅ Clicking history tab");
					historyTab.click();
				} else if (
					historyTab &&
					historyTab.getAttribute("data-state") === "active"
				) {
					console.log("ℹ️ History tab already active");
				} else {
					console.log("❌ History tab not found or already active");
				}
			}, 100);
		});

		// UI 操作事件处理器
		globalEventManager.add("ui:scroll-to-element", ({ elementId }) => {
			const element = document.getElementById(elementId);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		});

		globalEventManager.add("ui:focus-input", ({ inputId }) => {
			setTimeout(() => {
				const input = inputId
					? (document.getElementById(inputId) as HTMLInputElement)
					: (document.querySelector('input[type="file"]') as HTMLInputElement);

				if (input) {
					input.focus();
				}
			}, 100);
		});

		// 设置相关事件处理器
		globalEventManager.add("driver:highlight-settings", () => {
			// 这个事件会触发 scroll-to-element，已经在上面处理
		});

		// FFmpeg 相关事件处理器
		globalEventManager.add("ffmpeg:select-mode", ({ mode }) => {
			const { setUseMultiThread } = useFFmpegWebStore.getState();
			setUseMultiThread(mode === "multi-thread");
		});

		// 清理函数
		return () => {
			globalEventManager.clear();
		};
	}, [presets, setSelectedPreset]);
};
