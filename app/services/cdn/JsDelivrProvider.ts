import { BaseCDNProvider } from "./BaseCDNProvider";
import type { FFmpegResourceUrls } from "./types";

/**
 * jsDelivr CDN Provider
 * URL 格式: https://cdn.jsdelivr.net/npm/@ffmpeg/{package}@{version}/dist/esm/{file}
 */
export class JsDelivrProvider extends BaseCDNProvider {
	readonly id = "jsdelivr";
	readonly name = "jsDelivr";
	readonly description = "国内访问友好的 CDN";

	private readonly baseUrl = "https://cdn.jsdelivr.net/npm/@ffmpeg";

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
