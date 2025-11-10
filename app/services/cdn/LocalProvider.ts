import { BaseCDNProvider } from "./BaseCDNProvider";
import type { FFmpegResourceUrls } from "./types";

/**
 * 本地资源 Provider
 * URL 格式: /core[@|@-mt]/{version}/dist/esm/{file}
 *
 * 注意：本地资源目录结构与 CDN 不同
 * - public/core/@0.12.10/dist/esm/
 * - public/core-mt/@0.12.10/dist/esm/
 */
export class LocalProvider extends BaseCDNProvider {
	readonly id = "local";
	readonly name = "本地资源";
	readonly description = "使用本地托管的 FFmpeg 资源";

	constructor() {
		super();
		// 本地资源版本固定为 0.12.10（需要预先下载）
		this.version = "0.12.10";
	}

	getResourceUrls(mode: "single" | "multi"): FFmpegResourceUrls {
		// 本地资源使用不同的目录结构：版本号在包名后面的子目录中
		const packageDir = mode === "multi" ? "core-mt" : "core";
		const basePackageUrl = `/${packageDir}/@${this.version}/dist/esm`;

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
	 * 本地资源假设总是可用
	 */
	async checkHealth(): Promise<boolean> {
		return true;
	}

	/**
	 * 本地资源延迟为 0
	 */
	async getLatency(): Promise<number> {
		return 0;
	}
}
