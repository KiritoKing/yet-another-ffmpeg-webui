import { useEffect, useRef } from "react";
import { CLIImportDialog } from "../components/CLIImportDialog";
import { CommandPanel } from "../components/CommandPanel";
import { EditorDialog } from "../components/EditorDialog";
import { ExecutionPanel } from "../components/ExecutionPanel";
import { FFmpegToolbar } from "../components/FFmpegToolbar";
import { InitializationDialog } from "../components/InitializationDialog";
import { ResetConfirmDialog } from "../components/ResetConfirmDialog";
import { SettingsDialog } from "../components/SettingsDialog";
import { Card } from "../components/ui/card";
import { useFFmpegWeb } from "../hooks/useFFmpegWeb";
import { useCommandStore } from "../store/command";
import { useFFmpegWebStore } from "../store/ffmpegWeb";
import type { CommandPreset } from "../types/command";

/**
 * FFmpeg Web 主页面
 * 重构后的版本：数据层、逻辑层、视图层分离
 */
export default function FFmpegWeb() {
	// Store 状态
	const {
		isClient,
		loaded,
		processing,
		selectedPreset,
		editingPreset,
		selectedCategories,
		showEditor,
		showCLIImport,
		showSettings,
		showResetConfirm,
		showInitDialog,
		savedMode,
		cliCommand,
		setSelectedPreset,
		setEditingPreset,
		setSelectedCategories,
		setShowEditor,
		setShowCLIImport,
		setShowSettings,
		setShowResetConfirm,
		setShowInitDialog,
		setSavedMode,
		setCliCommand,
		setUseMultiThread,
	} = useFFmpegWebStore();

	const {
		presets,
		categoryOrder,
		reorderPresets,
		reorderCategories,
		batchDelete,
		updatePreset: updatePresetInStore,
	} = useCommandStore();

	// 业务逻辑 Hook
	const {
		loading,
		useMultiThread,
		loadFFmpeg,
		executeCommand,
		handleReloadFFmpeg,
		handleExportAll,
		handleImportJSON,
		handleExportPreset,
		handleCLIImport,
		handleCopyCommand,
		handleResetCommands,
		addPreset,
		updatePreset,
		deletePreset,
		taskManager,
	} = useFFmpegWeb();

	// 初始化分类筛选（全选）
	// biome-ignore lint/correctness/useExhaustiveDependencies: setSelectedCategories 是稳定的 zustand setter
	useEffect(() => {
		if (presets.length > 0 && selectedCategories.size === 0) {
			const categories = new Set(presets.map((p) => p.category || "未分类"));
			setSelectedCategories(categories);
		}
	}, [presets, selectedCategories.size]);

	// 使用 ref 追踪是否已经尝试过自动加载
	const autoLoadAttemptedRef = useRef(false);

	// 自动加载逻辑：检查 savedMode 并自动加载 FFmpeg
	// biome-ignore lint/correctness/useExhaustiveDependencies: 仅在初始化时执行一次
	useEffect(() => {
		if (
			isClient &&
			!loaded &&
			!loading &&
			savedMode &&
			!autoLoadAttemptedRef.current
		) {
			autoLoadAttemptedRef.current = true;

			// 设置模式并加载
			const mode = savedMode === "multi-thread";
			setUseMultiThread(mode);

			// 延迟加载，确保模式已更新
			setTimeout(() => {
				loadFFmpeg();
			}, 100);
		} else if (isClient && !loaded && !loading && !savedMode) {
			// 没有保存的模式，显示初始化对话框
			if (!showInitDialog) {
				setShowInitDialog(true);
			}
		}
	}, [isClient, loaded, loading, savedMode, showInitDialog]);

	// 处理初始化对话框的加载
	const handleInitLoad = (rememberChoice: boolean) => {
		if (rememberChoice) {
			setSavedMode(useMultiThread ? "multi-thread" : "single-thread");
		}
		setShowInitDialog(false);
		loadFFmpeg();
	};

	// 处理保存命令
	const handleSavePreset = (
		preset: Omit<CommandPreset, "id" | "createdAt" | "updatedAt">,
	) => {
		if (editingPreset && !editingPreset.id.startsWith("temp_")) {
			// 更新现有命令
			updatePreset(editingPreset.id, preset);
		} else {
			// 新建命令（包括从 CLI 导入的）
			addPreset(preset);
		}
		setShowEditor(false);
		setEditingPreset(null);
	};

	// 加载中状态
	if (!isClient) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-linear-to-br from-purple-50 to-blue-50 p-4">
				<div className="text-center max-w-md">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600 mb-6">加载中...</p>

					<div className="bg-white rounded-lg p-6 shadow-lg">
						<h2 className="text-lg font-semibold text-gray-800 mb-3">
							✨ 功能特点
						</h2>
						<ul className="space-y-2 text-gray-600 text-left">
							<li className="flex items-start">
								<span className="mr-2">🔒</span>
								<span>完全在浏览器中运行，文件不会上传到服务器</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2">⚡</span>
								<span>使用 WebAssembly 技术，性能强大</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2">🎯</span>
								<span>支持多种视频格式转换</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2">🆓</span>
								<span>完全免费，开源项目</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* 初始化对话框（如果需要显示） */}
			{showInitDialog && (
				<InitializationDialog
					loading={loading}
					mode={useMultiThread ? "multi-thread" : "single-thread"}
					onModeChange={(mode) => setUseMultiThread(mode === "multi-thread")}
					onLoad={handleInitLoad}
				/>
			)}

			{/* 顶部工具栏 */}
			<FFmpegToolbar
				loaded={loaded}
				loading={loading}
				processing={processing}
				useMultiThread={useMultiThread}
				onModeChange={setUseMultiThread}
				onLoadFFmpeg={loadFFmpeg}
				onReloadFFmpeg={handleReloadFFmpeg}
				onShowSettings={() => setShowSettings(true)}
				onShowCLIImport={() => setShowCLIImport(true)}
				onImportJSON={handleImportJSON}
				onExportAll={handleExportAll}
				onNewPreset={() => {
					setEditingPreset(null);
					setShowEditor(true);
				}}
			/>

			{/* 主内容区域 */}
			<div className="max-w-7xl mx-auto px-4 py-6">
				{loaded ? (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* 左侧：命令列表 */}
						<div className="lg:col-span-1">
							<CommandPanel
								presets={presets}
								categoryOrder={categoryOrder}
								selectedId={selectedPreset?.id}
								selectedCategories={selectedCategories}
								onSelect={setSelectedPreset}
								onEdit={(preset) => {
									setEditingPreset(preset);
									setShowEditor(true);
								}}
								onDelete={(preset) => deletePreset(preset.id)}
								onExport={handleExportPreset}
								onReorder={reorderPresets}
								onReorderCategories={reorderCategories}
								onUpdateCategory={(id, category) =>
									updatePresetInStore(id, { category })
								}
								onBatchDelete={batchDelete}
							/>
						</div>{" "}
						{/* 右侧：执行面板（整合了队列和历史） */}
						<div className="lg:col-span-2">
							<ExecutionPanel
								onCopyCommand={handleCopyCommand}
								onExecute={executeCommand}
								onStartQueue={taskManager.startQueue}
								onStopQueue={taskManager.stopQueue}
							/>
						</div>
					</div>
				) : (
					<Card className="p-12 text-center max-w-2xl mx-auto">
						<svg
							className="w-20 h-20 mx-auto mb-6 text-muted-foreground"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="播放占位图标"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h2 className="text-2xl font-bold mb-2">欢迎使用 FFmpeg Web</h2>
						<p className="text-muted-foreground mb-8">
							点击上方"加载 FFmpeg"按钮开始使用
						</p>

						<div className="bg-muted/50 rounded-lg p-6 mt-6">
							<h3 className="text-lg font-semibold text-foreground mb-4">
								✨ 功能特点
							</h3>
							<ul className="space-y-3 text-muted-foreground text-left max-w-md mx-auto">
								<li className="flex items-start">
									<span className="mr-2 text-lg">🔒</span>
									<span>完全在浏览器中运行，文件不会上传到服务器</span>
								</li>
								<li className="flex items-start">
									<span className="mr-2 text-lg">⚡</span>
									<span>使用 WebAssembly 技术，性能强大</span>
								</li>
								<li className="flex items-start">
									<span className="mr-2 text-lg">🎯</span>
									<span>支持多种视频格式转换</span>
								</li>
								<li className="flex items-start">
									<span className="mr-2 text-lg">🆓</span>
									<span>完全免费，开源项目</span>
								</li>
							</ul>
						</div>
					</Card>
				)}
			</div>

			{/* 对话框 */}
			<EditorDialog
				open={showEditor}
				editingPreset={editingPreset}
				onOpenChange={setShowEditor}
				onSave={handleSavePreset}
				onCancel={() => {
					setShowEditor(false);
					setEditingPreset(null);
				}}
			/>

			<CLIImportDialog
				open={showCLIImport}
				cliCommand={cliCommand}
				onOpenChange={setShowCLIImport}
				onCommandChange={setCliCommand}
				onImport={handleCLIImport}
				onCancel={() => {
					setShowCLIImport(false);
					setCliCommand("");
				}}
			/>

			<SettingsDialog
				open={showSettings}
				presetsCount={presets.length}
				categoriesCount={
					new Set(presets.map((p) => p.category || "未分类")).size
				}
				onOpenChange={setShowSettings}
				onResetCommands={() => {
					setShowSettings(false);
					setShowResetConfirm(true);
				}}
			/>

			<ResetConfirmDialog
				open={showResetConfirm}
				presetsCount={presets.length}
				onOpenChange={setShowResetConfirm}
				onConfirm={handleResetCommands}
				onCancel={() => setShowResetConfirm(false)}
			/>
		</div>
	);
}
