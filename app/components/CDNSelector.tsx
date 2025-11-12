import { Activity, Check, RefreshCw, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CDNService } from "../services/cdnService";
import { useCDNStore } from "../store/cdn";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";

interface CDNSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * CDN Selector Component
 * 允许用户选择 CDN、检查健康状态和配置自定义 CDN
 */
export function CDNSelector({ open, onOpenChange }: CDNSelectorProps) {
	const {
		providers,
		healthStatus,
		config,
		isChecking,
		setConfig,
		updateHealthStatus,
		setIsChecking,
		getBestProvider,
	} = useCDNStore();

	const [customUrl, setCustomUrl] = useState(config.customUrl || "");
	const [isValidatingCustom, setIsValidatingCustom] = useState(false);
	const [customUrlError, setCustomUrlError] = useState<string | null>(null);

	// 检查所有 CDN 的健康状态
	const checkAllCDNs = useCallback(async () => {
		setIsChecking(true);
		try {
			const results = await CDNService.checkAllHealth(providers);
			for (const result of results) {
				updateHealthStatus(result.providerId, result);
			}
		} catch (error) {
			console.error("CDN health check failed:", error);
		} finally {
			setIsChecking(false);
		}
	}, [providers, setIsChecking, updateHealthStatus]);

	// 组件挂载时自动检查 CDN
	useEffect(() => {
		if (open && healthStatus.size === 0) {
			checkAllCDNs();
		}
	}, [open, checkAllCDNs, healthStatus.size]);

	// 验证自定义 URL
	const validateCustomUrl = async () => {
		if (!customUrl.trim()) {
			setCustomUrlError("请输入 CDN URL");
			return false;
		}

		if (!CDNService.validateCustomUrl(customUrl)) {
			setCustomUrlError("无效的 URL 格式");
			return false;
		}

		setIsValidatingCustom(true);
		setCustomUrlError(null);

		try {
			const customProvider = CDNService.createCustomProvider(customUrl);
			const health = await CDNService.checkHealth(customProvider);

			if (!health.available) {
				setCustomUrlError(`CDN 不可用: ${health.error || "无法访问"}`);
				return false;
			}

			// 验证通过，添加到 providers 并选中
			setConfig({
				customUrl,
				selectedProviderId: "custom",
			});

			return true;
		} catch (error) {
			setCustomUrlError(error instanceof Error ? error.message : "验证失败");
			return false;
		} finally {
			setIsValidatingCustom(false);
		}
	};

	// 获取 CDN 健康状态显示
	const getHealthBadge = (providerId: string) => {
		const health = healthStatus.get(providerId);
		if (!health) {
			return <span className="text-muted-foreground text-sm">未检查</span>;
		}

		if (health.available) {
			return (
				<span className="text-green-600 text-sm flex items-center gap-1">
					<Check className="w-4 h-4" />
					可用 ({health.latency}ms)
				</span>
			);
		}

		return (
			<span className="text-red-600 text-sm flex items-center gap-1">
				<X className="w-4 h-4" />
				不可用
			</span>
		);
	};

	// 获取最佳 CDN
	const bestProvider = getBestProvider();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[95vw] lg:max-w-2xl max-h-[80vh] overflow-y-auto p-4 lg:p-6">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Activity className="w-5 h-5" />
						CDN 配置
					</DialogTitle>
					<DialogDescription>
						选择 CDN 加速 FFmpeg 资源加载，提升国内访问速度
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* 自动选择开关 */}
					<Card className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<Label htmlFor="auto-select">自动选择最快的 CDN</Label>
								<p className="text-sm text-muted-foreground mt-1">
									根据延迟自动选择最优 CDN
								</p>
							</div>
							<Switch
								id="auto-select"
								checked={config.autoSelect}
								onCheckedChange={(checked) =>
									setConfig({ autoSelect: checked })
								}
							/>
						</div>
					</Card>

					{/* CDN 列表 */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<Label>内置 CDN 提供商</Label>
							<Button
								variant="outline"
								size="sm"
								onClick={checkAllCDNs}
								disabled={isChecking}
							>
								<RefreshCw
									className={`w-4 h-4 mr-2 ${isChecking ? "animate-spin" : ""}`}
								/>
								{isChecking ? "检查中..." : "重新检查"}
							</Button>
						</div>

						<div className="space-y-2">
							{providers.map((provider) => (
								<Card
									key={provider.id}
									className={`p-4 cursor-pointer transition-colors ${
										config.selectedProviderId === provider.id &&
										!config.autoSelect
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50"
									}`}
									onClick={() => {
										if (!config.autoSelect) {
											setConfig({ selectedProviderId: provider.id });
										}
									}}
								>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<h4 className="font-medium">{provider.name}</h4>
												{bestProvider?.id === provider.id && (
													<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
														推荐
													</span>
												)}
											</div>
											<p className="text-sm text-muted-foreground mt-1">
												{provider.description}
											</p>
											<p className="text-xs text-muted-foreground mt-1 font-mono">
												{provider.baseUrl}
											</p>
										</div>
										<div className="ml-4">{getHealthBadge(provider.id)}</div>
									</div>
								</Card>
							))}
						</div>
					</div>

					{/* 自定义 CDN */}
					<Card className="p-4">
						<Label>自定义 CDN URL</Label>
						<p className="text-sm text-muted-foreground mt-1 mb-3">
							使用自己部署的 CDN 或其他镜像源
						</p>
						<div className="flex gap-2">
							<div className="flex-1">
								<Input
									placeholder="https://your-cdn.com/@ffmpeg"
									value={customUrl}
									onChange={(e) => {
										setCustomUrl(e.target.value);
										setCustomUrlError(null);
									}}
								/>
								{customUrlError && (
									<p className="text-sm text-red-600 mt-1">{customUrlError}</p>
								)}
							</div>
							<Button
								onClick={validateCustomUrl}
								disabled={isValidatingCustom || !customUrl.trim()}
							>
								{isValidatingCustom ? "验证中..." : "验证并使用"}
							</Button>
						</div>
					</Card>

					{/* FFmpeg 版本选择 */}
					<div>
						<Label>FFmpeg 版本</Label>
						<Select
							value={config.ffmpegVersion}
							onValueChange={(value) => setConfig({ ffmpegVersion: value })}
						>
							<SelectTrigger className="mt-2">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CDNService.getKnownVersions().map((version) => (
									<SelectItem key={version} value={version}>
										{version}
										{version === "0.12.15" && " (推荐)"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 当前选择摘要 */}
					<Card className="p-4 bg-muted/50">
						<div className="flex items-start gap-2">
							<Settings2 className="w-5 h-5 mt-0.5" />
							<div>
								<p className="font-medium">当前配置</p>
								<p className="text-sm text-muted-foreground mt-1">
									{config.autoSelect
										? `自动选择: ${bestProvider?.name || "未知"}`
										: `手动选择: ${providers.find((p) => p.id === config.selectedProviderId)?.name || "未选择"}`}
								</p>
								<p className="text-sm text-muted-foreground">
									FFmpeg 版本: {config.ffmpegVersion}
								</p>
							</div>
						</div>
					</Card>
				</div>
			</DialogContent>
		</Dialog>
	);
}
