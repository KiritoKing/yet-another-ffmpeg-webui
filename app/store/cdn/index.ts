import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultCDNConfig, defaultProviders } from "./default-values";
import type { CDNState } from "./types";

/**
 * CDN Store
 * 管理 CDN 配置和健康状态
 */
export const useCDNStore = create<CDNState>()(
	persist(
		(set, get) => ({
			// 初始状态
			providers: defaultProviders,
			healthStatus: new Map(),
			config: defaultCDNConfig,
			isChecking: false,
			isLoading: false,

			// Actions
			setConfig: (config) =>
				set((state) => ({
					config: { ...state.config, ...config },
				})),

			setProviders: (providers) => set({ providers }),

			updateHealthStatus: (providerId, status) =>
				set((state) => {
					const newHealthStatus = new Map(state.healthStatus);
					newHealthStatus.set(providerId, status);
					return { healthStatus: newHealthStatus };
				}),

			setIsChecking: (checking) => set({ isChecking: checking }),

			setIsLoading: (loading) => set({ isLoading: loading }),

			getBestProvider: () => {
				const { providers, healthStatus, config } = get();

				// 如果用户选择了特定 CDN，优先使用
				if (config.selectedProviderId) {
					const selected = providers.find(
						(p) => p.id === config.selectedProviderId,
					);
					if (selected) return selected;
				}

				// 开发模式下优先使用本地资源，避免 COEP + 外链在 Vite dev 上的代理问题
				if (
					import.meta &&
					(import.meta as any).env &&
					(import.meta as any).env.DEV
				) {
					const local = providers.find((p) => p.id === "local");
					if (local) return local;
				}

				// 如果开启了自动选择，选择延迟最低且可用的 CDN
				if (config.autoSelect) {
					const available = providers
						.map((provider) => ({
							provider,
							health: healthStatus.get(provider.id),
						}))
						.filter((item) => item.health?.available)
						.sort((a, b) => {
							// 先按延迟排序
							const latencyDiff =
								(a.health?.latency || 999999) - (b.health?.latency || 999999);
							// 如果延迟相同，按优先级排序
							return latencyDiff !== 0
								? latencyDiff
								: a.provider.priority - b.provider.priority;
						});

					if (available.length > 0) {
						return available[0].provider;
					}
				}

				// 如果 autoSelect 关闭或没有可用的 CDN，按优先级选择
				const sorted = [...providers].sort((a, b) => a.priority - b.priority);
				return sorted[0] || null;
			},

			resetToDefaults: () =>
				set({
					providers: defaultProviders,
					config: defaultCDNConfig,
					healthStatus: new Map(),
				}),
		}),
		{
			name: "ffmpeg-cdn-config",
			version: 1,
			// 只持久化配置，健康状态不持久化（每次重新检查）
			partialize: (state) => ({
				config: state.config,
				providers: state.providers,
			}),
		},
	),
);
