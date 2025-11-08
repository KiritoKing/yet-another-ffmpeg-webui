/**
 * CDN Provider Type
 * 定义 CDN 提供商的基本信息
 */
export interface CDNProvider {
	id: string;
	name: string;
	baseUrl: string;
	description?: string;
	priority: number; // 优先级，数字越小优先级越高
}

/**
 * CDN Health Status
 * CDN 健康检查结果
 */
export interface CDNHealthStatus {
	providerId: string;
	available: boolean;
	latency: number; // 延迟（毫秒）
	lastChecked: number; // 时间戳
	error?: string;
}

/**
 * FFmpeg Version Info
 * FFmpeg 版本信息
 */
export interface FFmpegVersionInfo {
	version: string;
	coreUrl: string;
	coreWasmUrl: string;
	wasmUrl?: string;
	workerUrl?: string;
}

/**
 * CDN Configuration
 * 用户 CDN 配置
 */
export interface CDNConfig {
	selectedProviderId: string | null; // 选中的 CDN 提供商 ID
	customUrl: string | null; // 自定义 CDN URL
	ffmpegVersion: string; // FFmpeg 版本号
	useLocal: boolean; // 是否使用本地 fallback
	autoSelect: boolean; // 是否自动选择最快的 CDN
}

/**
 * CDN Store State Interface
 */
export interface CDNState {
	// CDN providers
	providers: CDNProvider[];
	healthStatus: Map<string, CDNHealthStatus>;

	// Configuration
	config: CDNConfig;

	// Loading state
	isChecking: boolean;
	isLoading: boolean;

	// Actions
	setConfig: (config: Partial<CDNConfig>) => void;
	setProviders: (providers: CDNProvider[]) => void;
	updateHealthStatus: (providerId: string, status: CDNHealthStatus) => void;
	setIsChecking: (checking: boolean) => void;
	setIsLoading: (loading: boolean) => void;
	getBestProvider: () => CDNProvider | null;
	resetToDefaults: () => void;
}
