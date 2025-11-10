/**
 * CDN Provider 工厂
 * 用于创建和管理 CDN Provider 实例
 */

import type { CDNProvider as StoreCDNProvider } from "../../store/cdn/types";
import { CustomProvider } from "./CustomProvider";
import { JsDelivrProvider } from "./JsDelivrProvider";
import { LocalProvider } from "./LocalProvider";
import type { ICDNProvider } from "./types";
import { UnpkgProvider } from "./UnpkgProvider";

/**
 * 预定义的 CDN Provider 实例
 */
const providerInstances: Record<string, ICDNProvider> = {
	unpkg: new UnpkgProvider(),
	jsdelivr: new JsDelivrProvider(),
	local: new LocalProvider(),
};

/**
 * CDN Provider 工厂类
 */

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class CDNProviderFactory {
	/**
	 * 根据 ID 获取 Provider 实例
	 * @param id Provider ID
	 * @param version FFmpeg 版本（可选）
	 */
	static getProvider(id: string, version?: string): ICDNProvider | null {
		const provider = providerInstances[id] || null;
		if (provider && version) {
			provider.setVersion(version);
		}
		return provider;
	}

	/**
	 * 从 store 的 CDNProvider 配置创建 Provider 实例
	 * @param config Store 中的 CDN 配置
	 * @param version FFmpeg 版本（可选）
	 */
	static fromStoreConfig(
		config: StoreCDNProvider,
		version?: string,
	): ICDNProvider | null {
		// 如果是自定义 URL
		if (config.id === "custom") {
			if (!CustomProvider.validateUrl(config.baseUrl)) {
				console.warn("Invalid custom CDN URL:", config.baseUrl);
				return null;
			}
			const provider = new CustomProvider(config.baseUrl, config.description);
			if (version) {
				provider.setVersion(version);
			}
			return provider;
		}

		// 返回预定义的 Provider
		return CDNProviderFactory.getProvider(config.id, version);
	}

	/**
	 * 获取所有预定义的 Provider
	 */
	static getAllProviders(): ICDNProvider[] {
		return Object.values(providerInstances);
	}

	/**
	 * 自动选择最佳 Provider（基于延迟）
	 */
	static async selectBestProvider(): Promise<ICDNProvider> {
		const providers = CDNProviderFactory.getAllProviders();
		const latencies = await Promise.all(
			providers.map(async (p) => ({
				provider: p,
				latency: await p.getLatency(),
			})),
		);

		// 过滤出可用的 Provider（延迟 >= 0）
		const available = latencies.filter((l) => l.latency >= 0);

		if (available.length === 0) {
			// 如果都不可用，返回 jsDelivr 作为默认
			console.warn("No CDN available, falling back to jsDelivr");
			return providerInstances.jsdelivr;
		}

		// 返回延迟最低的
		available.sort((a, b) => a.latency - b.latency);
		return available[0].provider;
	}

	/**
	 * 批量检查 Provider 健康状态
	 */
	static async checkHealth(
		providers: ICDNProvider[],
	): Promise<Map<string, boolean>> {
		const results = await Promise.all(
			providers.map(async (p) => ({
				id: p.id,
				healthy: await p.checkHealth(),
			})),
		);

		return new Map(results.map((r) => [r.id, r.healthy]));
	}
}
