import type {
	CDNHealthStatus,
	CDNProvider,
	FFmpegVersionInfo,
} from "../store/cdn/types";

/**
 * CDN Service
 * 处理 CDN 健康检查、版本验证和 URL 生成
 */
export class CDNService {
	/**
	 * 检查 CDN 健康状态
	 * 通过尝试下载一个小文件来测量延迟和可用性
	 */
	static async checkHealth(provider: CDNProvider): Promise<CDNHealthStatus> {
		const startTime = Date.now();

		try {
			// 使用 HEAD 请求检查 CDN 是否可用
			// 检查 ffmpeg 包的 package.json（小文件，快速响应）
			const url = `${provider.baseUrl}/ffmpeg@0.12.15/package.json`;

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

			const response = await fetch(url, {
				method: "HEAD",
				signal: controller.signal,
				cache: "no-cache",
			});

			clearTimeout(timeoutId);

			const latency = Date.now() - startTime;
			const available = response.ok;

			return {
				providerId: provider.id,
				available,
				latency,
				lastChecked: Date.now(),
				error: available ? undefined : `HTTP ${response.status}`,
			};
		} catch (error) {
			const latency = Date.now() - startTime;
			return {
				providerId: provider.id,
				available: false,
				latency,
				lastChecked: Date.now(),
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	}

	/**
	 * 批量检查多个 CDN 的健康状态
	 */
	static async checkAllHealth(
		providers: CDNProvider[],
	): Promise<CDNHealthStatus[]> {
		const checks = providers.map((provider) =>
			CDNService.checkHealth(provider),
		);
		return Promise.all(checks);
	}

	/**
	 * 验证指定版本的 FFmpeg 是否在 CDN 上可用
	 */
	static async validateVersion(
		provider: CDNProvider,
		version: string,
	): Promise<boolean> {
		try {
			const url = `${provider.baseUrl}/ffmpeg@${version}/package.json`;
			const response = await fetch(url, {
				method: "HEAD",
				cache: "no-cache",
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * 获取可用的 FFmpeg 版本列表
	 * 注意：这个功能可能需要 CDN 支持 API 或者维护一个已知版本列表
	 */
	static getKnownVersions(): string[] {
		return [
			"0.12.15", // latest
			"0.12.14",
			"0.12.13",
			"0.12.12",
			"0.12.11",
			"0.12.10",
		];
	}

	/**
	 * 生成 FFmpeg 资源的完整 URL
	 */
	static generateFFmpegUrls(
		provider: CDNProvider,
		version: string,
	): FFmpegVersionInfo {
		const baseUrl = provider.baseUrl;

		// 根据 CDN 类型生成不同的 URL 格式
		if (provider.id === "local") {
			return {
				version,
				coreUrl: `${baseUrl}/core@0.12.6/dist/esm/ffmpeg-core.js`,
				coreWasmUrl: `${baseUrl}/core@0.12.6/dist/esm/ffmpeg-core.wasm`,
				wasmUrl: `${baseUrl}/core-mt@0.12.6/dist/esm/ffmpeg-core.js`,
				workerUrl: `${baseUrl}/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js`,
			};
		}

		// unpkg 和 jsdelivr 使用标准格式
		return {
			version,
			coreUrl: `${baseUrl}/core@0.12.6/dist/esm/ffmpeg-core.js`,
			coreWasmUrl: `${baseUrl}/core@0.12.6/dist/esm/ffmpeg-core.wasm`,
			wasmUrl: `${baseUrl}/core-mt@0.12.6/dist/esm/ffmpeg-core.js`,
			workerUrl: `${baseUrl}/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js`,
		};
	}

	/**
	 * 验证自定义 CDN URL 的格式
	 */
	static validateCustomUrl(url: string): boolean {
		try {
			const parsed = new URL(url);
			// 必须是 http 或 https 协议
			if (!["http:", "https:"].includes(parsed.protocol)) {
				return false;
			}
			// URL 应该以 @ffmpeg 或 ffmpeg 结尾（宽松验证）
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * 从自定义 URL 创建 CDN Provider
	 */
	static createCustomProvider(url: string): CDNProvider {
		return {
			id: "custom",
			name: "自定义 CDN",
			baseUrl: url,
			description: "用户自定义的 CDN 地址",
			priority: 0, // 最高优先级
		};
	}
}
