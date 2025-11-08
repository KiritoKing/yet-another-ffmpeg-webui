import { create } from "zustand";
import type { LogStore } from "./types";

/**
 * Log Store
 * 管理应用程序日志
 */
export const useLogStore = create<LogStore>((set) => ({
	logs: [],
	logIdCounter: 0,

	addLog: (message, type = "info", instanceId) => {
		set((state) => ({
			logs: [
				...state.logs,
				{
					id: state.logIdCounter,
					timestamp: new Date().toISOString(),
					type,
					message,
					instanceId,
				},
			],
			logIdCounter: state.logIdCounter + 1,
		}));
	},

	clearLogs: () => {
		set({ logs: [], logIdCounter: 0 });
	},
}));
