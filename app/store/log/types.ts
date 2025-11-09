import type { LogEntry } from "../../types/log";

/**
 * Log Store State Interface
 */
export interface LogStore {
	logs: LogEntry[];
	logIdCounter: number;
	addLog: (
		message: string,
		type?: LogEntry["type"],
		instanceId?: string,
	) => void;
	clearLogs: () => void;
}
