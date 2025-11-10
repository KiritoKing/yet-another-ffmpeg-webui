import { BaseCDNProvider } from "./BaseCDNProvider";
import type { FFmpegResourceUrls } from "./types";

/**
 * 自定义 CDN Provider
 * 支持用户提供自定义的 CDN URL
 */
export class CustomProvider extends BaseCDNProvider {
	readonly id = "custom";
	readonly name = "自定义 CDN";
	readonly description: string;

	private readonly baseUrl: string;

	constructor(baseUrl: string, description?: string) {
		super();
		// 移除末尾的斜杠
		this.baseUrl = baseUrl.replace(/\/$/, "");
		this.description = description || `自定义 CDN: ${baseUrl}`;
	}

	getResourceUrls(mode: "single" | "multi"): FFmpegResourceUrls {
		const packageName = mode === "multi" ? "core-mt" : "core";
		// 假设自定义 CDN 遵循 npm CDN 的标准格式
		const basePackageUrl = `${this.baseUrl}/${packageName}@${this.version}/dist/esm`;

		return {
			coreUrl: `${basePackageUrl}/ffmpeg-core.js`,
			wasmUrl: `${basePackageUrl}/ffmpeg-core.wasm`,
			workerUrl:
				mode === "multi"
					? `${basePackageUrl}/ffmpeg-core.worker.js`
					: undefined,
		};
	}

	/**
	 * 验证自定义 URL 格式
	 */
	static validateUrl(url: string): boolean {
		try {
			const parsed = new URL(url);
			// 必须是 http 或 https 协议
			return ["http:", "https:"].includes(parsed.protocol);
		} catch {
			return false;
		}
	}
}
