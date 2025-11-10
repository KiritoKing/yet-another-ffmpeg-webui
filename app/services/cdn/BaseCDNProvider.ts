import type { FFmpegResourceUrls, ICDNProvider } from "./types";

/**
 * CDN Provider 基类
 * 提供通用的健康检查和延迟测量功能
 */
export abstract class BaseCDNProvider implements ICDNProvider {
	abstract readonly id: string;
	abstract readonly name: string;
	abstract readonly description: string;

	/** FFmpeg 版本，默认 0.12.10 */
	version = "0.12.10";

	/**
	 * 设置 FFmpeg 版本
	 */
	setVersion(version: string): void {
		this.version = version;
	}

	/**
	 * 子类需要实现此方法来返回资源 URL
	 */
	abstract getResourceUrls(mode: "single" | "multi"): FFmpegResourceUrls;

	/**
	 * 检查 CDN 健康状态
	 * 默认实现：尝试 HEAD 请求核心 JS 文件
	 */
	async checkHealth(): Promise<boolean> {
		try {
			const urls = this.getResourceUrls("single");
			const response = await this.headRequest(urls.coreUrl, 5000);
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * 获取延迟
	 */
	async getLatency(): Promise<number> {
		try {
			const startTime = Date.now();
			const urls = this.getResourceUrls("single");
			const response = await this.headRequest(urls.coreUrl, 5000);
			if (!response.ok) return -1;
			return Date.now() - startTime;
		} catch {
			return -1;
		}
	}

	/**
	 * 执行 HEAD 请求（带超时）
	 */
	protected async headRequest(
		url: string,
		timeoutMs: number,
	): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(url, {
				method: "HEAD",
				signal: controller.signal,
				cache: "no-cache",
			});
			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	}

	/**
	 * 预检所有资源是否可用
	 */
	async preflightCheck(mode: "single" | "multi"): Promise<boolean> {
		try {
			const urls = this.getResourceUrls(mode);
			const checks = [
				this.headRequest(urls.coreUrl, 4000),
				this.headRequest(urls.wasmUrl, 4000),
			];

			if (urls.workerUrl) {
				checks.push(this.headRequest(urls.workerUrl, 4000));
			}

			const results = await Promise.all(checks);
			return results.every((r) => r.ok);
		} catch {
			return false;
		}
	}
}
