export interface LogEntry {
	id: number;
	timestamp: string;
	type: "info" | "success" | "error" | "warning";
	message: string;
	instanceId?: string; // FFmpeg 实例ID，用于区分日志来源
}
