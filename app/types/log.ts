export interface LogEntry {
	id: number;
	timestamp: string;
	type: "info" | "success" | "error" | "warning";
	message: string;
}
