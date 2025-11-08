import type { CDNProvider } from "./types";

/**
 * 默认 CDN 提供商配置
 *
 * 注意：这些 CDN 都支持 FFmpeg WASM 资源
 * - unpkg: 快速且可靠
 * - jsDelivr: 国内访问友好
 * - cdnjs: 备选方案
 */
export const defaultProviders: CDNProvider[] = [
	{
		id: "unpkg",
		name: "unpkg",
		baseUrl: "https://unpkg.com/@ffmpeg",
		description: "快速且可靠的 CDN",
		priority: 1,
	},
	{
		id: "jsdelivr",
		name: "jsDelivr",
		baseUrl: "https://cdn.jsdelivr.net/npm/@ffmpeg",
		description: "国内访问友好的 CDN",
		priority: 2,
	},
	{
		id: "local",
		name: "本地资源",
		baseUrl: "/ffmpeg",
		description: "使用本地托管的 FFmpeg 资源（需要预先部署）",
		priority: 999,
	},
];

/**
 * 默认 FFmpeg 版本
 */
export const DEFAULT_FFMPEG_VERSION = "0.12.15";

/**
 * 默认 CDN 配置
 */
export const defaultCDNConfig = {
	selectedProviderId: null,
	customUrl: null,
	ffmpegVersion: DEFAULT_FFMPEG_VERSION,
	useLocal: false,
	autoSelect: true,
};
