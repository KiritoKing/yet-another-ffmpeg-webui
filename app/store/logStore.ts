import { create } from "zustand";
import type { LogEntry } from "../types/log";

interface LogStore {
	logs: LogEntry[];
	logIdCounter: number;
	addLog: (
		message: string,
		type?: LogEntry["type"],
		instanceId?: string,
	) => void;
	clearLogs: () => void;
}

export const useLogStore = create<LogStore>((set) => ({
	logs: [],
	logIdCounter: 0,

	addLog: (
		message: string,
		type: LogEntry["type"] = "info",
		instanceId?: string,
	) => {
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
