import { BaseCDNProvider } from "./BaseCDNProvider";
import type { FFmpegResourceUrls } from "./types";

/**
 * unpkg CDN Provider
 * URL 格式: https://unpkg.com/@ffmpeg/{package}@{version}/dist/esm/{file}
 */
export class UnpkgProvider extends BaseCDNProvider {
	readonly id = "unpkg";
	readonly name = "unpkg";
	readonly description = "快速且可靠的 CDN";

	private readonly baseUrl = "https://unpkg.com/@ffmpeg";

	getResourceUrls(mode: "single" | "multi"): FFmpegResourceUrls {
		const packageName = mode === "multi" ? "core-mt" : "core";
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
}
