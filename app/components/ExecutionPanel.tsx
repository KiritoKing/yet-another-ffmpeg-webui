import {
	CheckIcon,
	CopyIcon,
	DownloadIcon,
	Loader2Icon,
	XIcon,
} from "lucide-react";
import type { CommandPreset } from "../types/command";
import {
	extractNonFileValues,
	getFileInputFields,
	replaceTemplateVariables,
} from "../utils";
import { DynamicForm } from "./DynamicForm";
import { ProgressLogViewer } from "./ProgressLogViewer";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";

interface ExecutionPanelProps {
	selectedPreset: CommandPreset | null;
	formValues: Record<string, string | number | boolean | File | File[]>;
	processing: boolean;
	progress: number;
	currentStep: string;
	outputUrl: string;
	copiedCommand: boolean;
	onFormChange: (
		values: Record<string, string | number | boolean | File | File[]>,
	) => void;
	onExecute: () => void;
	onAbort: () => void;
	onCopyCommand: () => void;
	onDownload: () => void;
	computeOutputName: (
		preset: CommandPreset,
		values: Record<string, unknown>,
	) => string;
}

/**
 * 执行面板组件
 * 包含命令信息、表单、执行按钮、进度日志和输出预览
 */
export function ExecutionPanel({
	selectedPreset,
	formValues,
	processing,
	progress,
	currentStep,
	outputUrl,
	copiedCommand,
	onFormChange,
	onExecute,
	onAbort,
	onCopyCommand,
	onDownload,
	computeOutputName,
}: ExecutionPanelProps) {
	if (!selectedPreset) {
		return (
			<Card className="p-12 text-center">
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
				<h2 className="text-2xl font-bold mb-2">请选择一个命令预设</h2>
				<p className="text-muted-foreground">
					从左侧列表中选择要执行的 FFmpeg 命令
				</p>
			</Card>
		);
	}

	const fileInputFields = getFileInputFields(selectedPreset);
	const hasRequiredFiles = !fileInputFields.some((field) => {
		if (!field.required) return false;
		const val = formValues[field.name];
		if (field.multiple) {
			return !val || !Array.isArray(val) || val.length === 0;
		}
		return !(val instanceof File);
	});

	return (
		<div className="space-y-6">
			{/* 命令信息和表单 */}
			<Card className="p-6">
				<div className="flex items-start justify-between mb-4">
					<div>
						<h2 className="text-xl font-bold">{selectedPreset.name}</h2>
						<p className="text-sm text-muted-foreground mt-1">
							{selectedPreset.description}
						</p>
					</div>
					<Badge variant="secondary">{selectedPreset.category}</Badge>
				</div>

				{/* 命令预览 */}
				<div className="mb-4">
					<div className="flex items-center justify-between mb-2">
						<Label>FFmpeg 命令</Label>
						<Button
							variant="ghost"
							size="sm"
							onClick={onCopyCommand}
							className="h-7 px-2 text-xs"
						>
							{copiedCommand ? (
								<>
									<CheckIcon className="size-3 mr-1" />
									已复制
								</>
							) : (
								<>
									<CopyIcon className="size-3 mr-1" />
									复制
								</>
							)}
						</Button>
					</div>
					<div className="bg-slate-950 text-slate-50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
						ffmpeg{" "}
						{selectedPreset.formSchema && selectedPreset.formSchema.length > 0
							? replaceTemplateVariables(
									selectedPreset.ffmpegArgs,
									extractNonFileValues(formValues),
								).join(" ")
							: selectedPreset.ffmpegArgs.join(" ")}
					</div>
				</div>

				{/* 自定义表单 */}
				{selectedPreset.formSchema && selectedPreset.formSchema.length > 0 && (
					<Card className="p-4 mb-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
						<div className="mb-3">
							<Label className="text-base font-semibold flex items-center gap-2">
								<span className="text-blue-600 dark:text-blue-400">⚙️</span>
								命令参数配置
							</Label>
							<p className="text-xs text-muted-foreground mt-1">
								调整下方参数，命令将实时更新
							</p>
						</div>
						<DynamicForm
							schema={selectedPreset.formSchema}
							values={formValues}
							onChange={onFormChange}
						/>
					</Card>
				)}

				{/* 执行/中止按钮 */}
				<div className="flex gap-2 mt-4">
					<Button
						onClick={onExecute}
						disabled={processing || !hasRequiredFiles}
						className="flex-1"
						size="lg"
					>
						{processing ? (
							<>
								<Loader2Icon className="mr-2 animate-spin" />
								处理中...
							</>
						) : (
							"执行命令"
						)}
					</Button>
					{processing && (
						<Button onClick={onAbort} variant="destructive" size="lg">
							<XIcon className="mr-2" />
							中止
						</Button>
					)}
				</div>
			</Card>

			{/* 进度和日志 */}
			<ProgressLogViewer
				progress={progress}
				currentStep={currentStep}
				isExecuting={processing}
			/>

			{/* 输出预览 */}
			{outputUrl && (
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold">输出预览</h3>
						<Button onClick={onDownload} variant="default" size="sm">
							<DownloadIcon className="mr-2" />
							下载文件
						</Button>
					</div>

					{(() => {
						const outName = computeOutputName(selectedPreset, formValues);
						if (/\.(mp4|webm|avi|mov)$/i.test(outName)) {
							return (
								<video
									src={outputUrl}
									controls
									className="w-full rounded-lg bg-black"
									aria-label="输出视频预览"
								>
									<track
										kind="captions"
										src="data:text/vtt,WEBVTT%0A%0A"
										srcLang="zh"
										label="空字幕"
										default
									/>
								</video>
							);
						}
						if (/\.(mp3|wav|ogg|m4a)$/i.test(outName)) {
							return (
								<audio
									src={outputUrl}
									controls
									className="w-full"
									aria-label="输出音频预览"
								>
									<track
										kind="captions"
										src="data:text/vtt,WEBVTT%0A%0A"
										srcLang="zh"
										label="空字幕"
										default
									/>
								</audio>
							);
						}
						if (/\.(gif|jpg|jpeg|png|webp)$/i.test(outName)) {
							return (
								<img
									src={outputUrl}
									alt="输出文件预览"
									className="w-full rounded-lg"
								/>
							);
						}
						return (
							<p className="text-muted-foreground text-sm">
								文件已生成，点击"下载文件"按钮保存
							</p>
						);
					})()}
				</Card>
			)}
		</div>
	);
}
