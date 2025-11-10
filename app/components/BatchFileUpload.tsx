import { AlertCircle, FileVideo, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { CommandPreset } from "../types/command";
import { sanitizeFilename } from "../utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface BatchFileUploadProps {
	preset: CommandPreset;
	onFilesSelected: (files: File[]) => void;
	maxFiles?: number;
	acceptedTypes?: string;
}

/**
 * 批量文件上传组件
 * 支持拖拽上传和文件选择
 */
export function BatchFileUpload({
	preset,
	onFilesSelected,
	maxFiles = 10,
	acceptedTypes = "video/*,audio/*",
}: BatchFileUploadProps) {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 处理文件选择
	const handleFilesChange = (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const filesArray = Array.from(files);

		// 检查文件数量限制
		if (selectedFiles.length + filesArray.length > maxFiles) {
			toast.error(`最多只能选择 ${maxFiles} 个文件`);
			return;
		}

		// 验证文件类型
		const validFiles: File[] = [];
		const invalidFiles: string[] = [];

		for (const file of filesArray) {
			// 简单的类型检查
			if (
				acceptedTypes === "*" ||
				acceptedTypes.includes("*/*") ||
				acceptedTypes.split(",").some((type) => {
					const trimmedType = type.trim();
					if (trimmedType.endsWith("/*")) {
						const category = trimmedType.split("/")[0];
						return file.type.startsWith(category);
					}
					return file.type === trimmedType;
				})
			) {
				validFiles.push(file);
			} else {
				invalidFiles.push(file.name);
			}
		}

		if (invalidFiles.length > 0) {
			toast.warning(`以下文件类型不支持: ${invalidFiles.join(", ")}`);
		}

		if (validFiles.length > 0) {
			const newFiles = [...selectedFiles, ...validFiles];
			setSelectedFiles(newFiles);
			onFilesSelected(newFiles);
			toast.success(`已添加 ${validFiles.length} 个文件`);
		}
	};

	// 移除文件
	const handleRemoveFile = (index: number) => {
		const newFiles = selectedFiles.filter((_, i) => i !== index);
		setSelectedFiles(newFiles);
		onFilesSelected(newFiles);
	};

	// 清空所有文件
	const handleClearAll = () => {
		setSelectedFiles([]);
		onFilesSelected([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// 拖拽处理
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		handleFilesChange(e.dataTransfer.files);
	};

	// 格式化文件大小
	const formatFileSize = (bytes: number) => {
		const mb = bytes / (1024 * 1024);
		if (mb < 1) {
			return `${(bytes / 1024).toFixed(2)} KB`;
		}
		return `${mb.toFixed(2)} MB`;
	};

	// 计算总大小
	const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

	return (
		<Card id="batch-upload" className="p-6">
			<div className="space-y-4">
				{/* 标题 */}
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold">批量上传文件</h3>
						<p className="text-sm text-gray-500">
							为 "{preset.name}" 批量处理文件
						</p>
					</div>
					{selectedFiles.length > 0 && (
						<Button variant="outline" size="sm" onClick={handleClearAll}>
							<X className="w-4 h-4 mr-2" />
							清空
						</Button>
					)}
				</div>

				{/* 上传区域 */}
				<button
					type="button"
					className={`
						w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors
						${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-700"}
						${selectedFiles.length >= maxFiles ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-400"}
					`}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => {
						if (selectedFiles.length < maxFiles) {
							fileInputRef.current?.click();
						}
					}}
					disabled={selectedFiles.length >= maxFiles}
				>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept={acceptedTypes}
						className="hidden"
						onChange={(e) => handleFilesChange(e.target.files)}
						disabled={selectedFiles.length >= maxFiles}
					/>

					<Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

					<p className="text-lg font-medium mb-2">拖拽文件到此处或点击选择</p>

					<p className="text-sm text-gray-500">支持类型: {acceptedTypes}</p>

					<p className="text-sm text-gray-500">最多 {maxFiles} 个文件</p>
				</button>

				{/* 警告信息 */}
				{preset.estimatedMemoryMB && (
					<div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
						<AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
						<div>
							<p className="font-semibold text-yellow-800 dark:text-yellow-300">
								内存提示
							</p>
							<p className="text-yellow-700 dark:text-yellow-400">
								此命令预计需要 {preset.estimatedMemoryMB} MB 内存。
								批量处理时请注意文件大小，避免内存溢出。
							</p>
						</div>
					</div>
				)}

				{/* 文件列表 */}
				{selectedFiles.length > 0 && (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h4 className="font-semibold text-sm">
								已选择 {selectedFiles.length} 个文件
							</h4>
							<span className="text-sm text-gray-500">
								总大小: {formatFileSize(totalSize)}
							</span>
						</div>

						<div className="space-y-2 max-h-64 overflow-y-auto">
							{selectedFiles.map((file, index) => {
								const sanitized = sanitizeFilename(file.name);
								const hasWarning = sanitized !== file.name;

								return (
									<div
										key={`${file.name}-${index}`}
										className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
									>
										<div className="flex items-center gap-3 flex-1">
											<FileVideo className="w-5 h-5 text-blue-500" />
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className="font-medium truncate">
														{file.name}
													</span>
													{hasWarning && (
														<Badge variant="outline" className="text-xs">
															文件名已清理
														</Badge>
													)}
												</div>
												<div className="text-sm text-gray-500">
													{formatFileSize(file.size)}
													{hasWarning && ` → ${sanitized}`}
												</div>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												handleRemoveFile(index);
											}}
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
