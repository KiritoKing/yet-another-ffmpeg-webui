/**
 * CDN Provider 类型定义
 */

export type FFmpegMode = "single" | "multi";

/**
 * FFmpeg 资源 URL 集合
 */
export interface FFmpegResourceUrls {
	/** 核心 JS 文件 URL */
	coreUrl: string;
	/** WASM 文件 URL */
	wasmUrl: string;
	/** Worker JS 文件 URL（仅多线程需要） */
	workerUrl?: string;
}

/**
 * CDN Provider 接口
 * 每个 CDN 提供商需要实现此接口
 */
export interface ICDNProvider {
	/** Provider ID */
	readonly id: string;
	/** Provider 显示名称 */
	readonly name: string;
	/** Provider 描述 */
	readonly description: string;
	/** FFmpeg 版本 */
	version: string;

	/**
	 * 获取指定模式的 FFmpeg 资源 URL
	 * @param mode 运行模式（单线程/多线程）
	 */
	getResourceUrls(mode: FFmpegMode): FFmpegResourceUrls;

	/**
	 * 检查 CDN 健康状态
	 * @returns 是否可用
	 */
	checkHealth(): Promise<boolean>;

	/**
	 * 获取延迟（毫秒）
	 * @returns 延迟时间，如果不可用则返回 -1
	 */
	getLatency(): Promise<number>;

	/**
	 * 预检所有资源是否可用
	 * @param mode 运行模式
	 * @returns 是否所有资源都可用
	 */
	preflightCheck(mode: FFmpegMode): Promise<boolean>;

	/**
	 * 设置 FFmpeg 版本
	 * @param version 版本号
	 */
	setVersion(version: string): void;
}
