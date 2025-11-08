import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { CDNProvider } from "../store/cdn/types";

export type FFmpegMode = "single" | "multi";

export interface FFmpegConfig {
	mode: FFmpegMode;
	onLog?: (message: string) => void;
	onProgress?: (progress: number, time: number) => void;
	cdnProvider?: CDNProvider; // 可选的 CDN 配置
}

export interface ConvertOptions {
	inputFile: File;
	outputFormat?: string;
	videoCodec?: string;
	quality?: number;
	speed?: number;
}

export interface ExecuteCommandOptions {
	inputFiles: { file: File; name: string }[];
	outputFileName: string;
	ffmpegArgs: string[];
	onProgress?: (progress: number, time: number) => void;
}

export class FFmpegService {
	private ffmpeg: FFmpeg | null = null;
	private config: FFmpegConfig;
	private loaded = false;
	private isExecuting = false;
	private isAborting = false;

	constructor(config: FFmpegConfig) {
		this.config = config;
	}

	/**
	 * 检查是否支持多线程模式
	 */
	static isMultiThreadSupported(): boolean {
		return typeof SharedArrayBuffer !== "undefined";
	}

	/**
	 * 加载 FFmpeg
	 */
	async load(): Promise<void> {
		if (this.loaded) {
			throw new Error("FFmpeg 已经加载");
		}

		// 检查多线程支持
		if (
			this.config.mode === "multi" &&
			!FFmpegService.isMultiThreadSupported()
		) {
			throw new Error(
				"当前环境不支持多线程模式，请使用单线程模式或重启开发服务器",
			);
		}

		// 使用 CDN 配置或默认 jsDelivr
		const baseURL = this.getBaseURL();

		this.ffmpeg = new FFmpeg();

		// 设置日志回调
		if (this.config.onLog) {
			this.ffmpeg.on("log", ({ message }) => {
				this.config.onLog?.(message);
			});
		}

		// 设置进度回调
		if (this.config.onProgress) {
			this.ffmpeg.on("progress", ({ progress, time }) => {
				this.config.onProgress?.(progress, time);
			});
		}

		const loadConfig: {
			coreURL: string;
			wasmURL: string;
			workerURL?: string;
		} = {
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
			wasmURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.wasm`,
				"application/wasm",
			),
		};

		// 多线程版本需要额外的 worker
		if (this.config.mode === "multi") {
			loadConfig.workerURL = await toBlobURL(
				`${baseURL}/ffmpeg-core.worker.js`,
				"text/javascript",
			);
		}

		await this.ffmpeg.load(loadConfig);
		this.loaded = true;
	}

	/**
	 * 获取 FFmpeg 资源的基础 URL
	 */
	private getBaseURL(): string {
		const corePackage =
			this.config.mode === "multi" ? "@ffmpeg/core-mt" : "@ffmpeg/core";

		// 如果配置了 CDN provider，使用它
		if (this.config.cdnProvider) {
			const provider = this.config.cdnProvider;

			// 特殊处理本地资源
			if (provider.id === "local") {
				return this.config.mode === "multi"
					? `${provider.baseUrl}/core-mt@0.12.6/dist/esm`
					: `${provider.baseUrl}/core@0.12.6/dist/esm`;
			}

			// 使用 CDN provider 的 baseUrl
			return `${provider.baseUrl}/${corePackage}@0.12.6/dist/esm`;
		}

		// 默认使用 jsDelivr（国内友好）
		return `https://cdn.jsdelivr.net/npm/${corePackage}@0.12.6/dist/esm`;
	}

	/**
	 * 执行任意 FFmpeg 命令
	 */
	async executeCommand(options: ExecuteCommandOptions): Promise<Blob> {
		if (!this.ffmpeg || !this.loaded) {
			throw new Error("FFmpeg 未加载，请先调用 load()");
		}

		if (this.isExecuting) {
			throw new Error("FFmpeg 正在执行任务，请等待完成或中止当前任务");
		}

		const { inputFiles, outputFileName, ffmpegArgs, onProgress } = options;
		const fileNames: string[] = [];

		this.isExecuting = true;

		// 如果提供了进度回调，临时设置它
		if (onProgress && this.ffmpeg) {
			this.ffmpeg.on("progress", ({ progress, time }) => {
				onProgress(progress, time);
			});
		}

		try {
			// 写入所有输入文件
			for (const { file, name } of inputFiles) {
				this.config.onLog?.(
					`正在加载文件: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
				);
				const inputData = await fetchFile(file);
				await this.ffmpeg.writeFile(name, inputData);
				fileNames.push(name);
				this.config.onLog?.(`文件 ${name} 已写入 FFmpeg 虚拟文件系统`);
			}

			this.config.onLog?.(`执行 FFmpeg 命令: ffmpeg ${ffmpegArgs.join(" ")}`);

			// 执行命令
			await this.ffmpeg.exec(ffmpegArgs);

			this.config.onLog?.(`命令执行完成，正在读取输出文件`);

			// 读取输出文件
			const data = await this.ffmpeg.readFile(outputFileName);

			this.config.onLog?.(
				`输出文件大小: ${(data.length / 1024).toFixed(2)} KB`,
			);

			// 创建新的 Uint8Array 副本，避免 SharedArrayBuffer 问题
			const uint8Data = new Uint8Array(data as Uint8Array);
			const buffer = uint8Data.buffer.slice(0);

			// 推断输出文件的 MIME 类型
			const mimeType = this.getMimeType(outputFileName);

			// 清理文件 - 使用更安全的方式
			await this.cleanupFiles([...fileNames, outputFileName]);

			return new Blob([buffer], { type: mimeType });
		} catch (error) {
			// 检查是否是中止错误
			const errorStr = error instanceof Error ? error.message : String(error);
			const isTerminated =
				this.isAborting ||
				errorStr.includes("called FFmpeg.terminate()") ||
				errorStr.includes("FFmpeg.terminate()");

			if (isTerminated) {
				this.config.onLog?.(`任务已被用户中止`);
				this.isAborting = false;
				throw new Error("TASK_ABORTED");
			}

			this.config.onLog?.(`命令执行失败: ${error}`);
			// 尝试清理文件，但不抛出错误
			await this.cleanupFiles([...fileNames, outputFileName]);
			throw error;
		} finally {
			this.isExecuting = false;
			this.isAborting = false;
		}
	}

	/**
	 * 转换视频（便捷方法，内部调用 executeCommand）
	 */
	async convert(options: ConvertOptions): Promise<Blob> {
		const { inputFile, outputFormat = "webm" } = options;

		const inputFileName = "input.mp4";
		const outputFileName = `output.${outputFormat}`;

		// 构建 FFmpeg 参数（使用 copy 模式避免重新编码）
		const args = ["-i", inputFileName, "-c", "copy", outputFileName];

		return this.executeCommand({
			inputFiles: [{ file: inputFile, name: inputFileName }],
			outputFileName,
			ffmpegArgs: args,
		});
	}

	/**
	 * 安全地清理虚拟文件系统中的文件
	 */
	private async cleanupFiles(fileNames: string[]): Promise<void> {
		if (!this.ffmpeg) return;

		const ffmpeg = this.ffmpeg;
		const results = await Promise.allSettled(
			fileNames.map(async (fileName) => {
				try {
					// 先检查文件是否存在
					await ffmpeg.readFile(fileName);
					// 存在则删除
					await ffmpeg.deleteFile(fileName);
					this.config.onLog?.(`已清理文件: ${fileName}`);
				} catch (e) {
					// 文件不存在或删除失败，记录但不抛出错误
					const errorMsg = e instanceof Error ? e.message : String(e);
					if (!errorMsg.includes("ENOENT")) {
						// 只记录非"文件不存在"的错误
						console.warn(`清理文件 ${fileName} 失败:`, errorMsg);
					}
				}
			}),
		);

		const failed = results.filter((r) => r.status === "rejected").length;
		if (failed > 0) {
			console.warn(`${failed}/${fileNames.length} 个文件清理失败`);
		} else if (fileNames.length > 0) {
			this.config.onLog?.(`清理了 ${fileNames.length} 个临时文件`);
		}
	}

	/**
	 * 根据文件扩展名推断 MIME 类型
	 */
	private getMimeType(fileName: string): string {
		const ext = fileName.split(".").pop()?.toLowerCase();
		const mimeTypes: Record<string, string> = {
			mp4: "video/mp4",
			webm: "video/webm",
			avi: "video/x-msvideo",
			mov: "video/quicktime",
			mkv: "video/x-matroska",
			flv: "video/x-flv",
			wmv: "video/x-ms-wmv",
			m4v: "video/x-m4v",
			mpg: "video/mpeg",
			mpeg: "video/mpeg",
			mp3: "audio/mpeg",
			wav: "audio/wav",
			ogg: "audio/ogg",
			aac: "audio/aac",
			flac: "audio/flac",
			m4a: "audio/mp4",
			gif: "image/gif",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			webp: "image/webp",
		};
		return mimeTypes[ext || ""] || "application/octet-stream";
	}

	/**
	 * 获取是否已加载
	 */
	isLoaded(): boolean {
		return this.loaded;
	}

	/**
	 * 获取模式
	 */
	getMode(): FFmpegMode {
		return this.config.mode;
	}

	/**
	 * 终止 FFmpeg 进程（用于清理或重新加载）
	 */
	async terminate(): Promise<void> {
		if (!this.ffmpeg) return;

		try {
			this.config.onLog?.("正在终止 FFmpeg...");

			// 先设置标志，防止新任务启动
			this.isExecuting = false;
			this.loaded = false;

			// 终止 FFmpeg 实例
			this.ffmpeg.terminate();

			// 清空实例引用
			this.ffmpeg = null;

			this.config.onLog?.("FFmpeg 已终止");
		} catch (error) {
			console.error("终止 FFmpeg 失败:", error);
			// 即使出错也要清理状态
			this.isExecuting = false;
			this.loaded = false;
			this.ffmpeg = null;
		}
	}

	/**
	 * 中止当前正在执行的任务
	 * 注意：会终止并重新加载 FFmpeg 实例以确保干净状态
	 */
	async abort(): Promise<void> {
		if (!this.isExecuting) {
			this.config.onLog?.("没有正在执行的任务");
			return;
		}

		this.config.onLog?.("正在中止当前任务...");
		this.isAborting = true;

		// 保存配置，因为 terminate 后需要重新加载
		const savedMode = this.config.mode;
		const savedOnLog = this.config.onLog;
		const savedOnProgress = this.config.onProgress;

		// 调用 terminate 强制结束 FFmpeg 进程
		if (this.ffmpeg) {
			this.ffmpeg.terminate();
			this.ffmpeg = null;
			this.loaded = false;
			this.isExecuting = false;
		}

		// 立即重新加载，保持实例可用
		try {
			this.config.onLog?.("正在重新加载 FFmpeg...");

			// 重置状态
			this.config = {
				mode: savedMode,
				onLog: savedOnLog,
				onProgress: savedOnProgress,
			};
			this.loaded = false;
			this.isExecuting = false;
			this.isAborting = false;

			// 重新加载
			await this.load();
			this.config.onLog?.("FFmpeg 已重新加载，可继续使用");
		} catch (error) {
			this.config.onLog?.(`重新加载失败: ${error}`);
			throw error;
		}
	}

	/**
	 * 检查是否正在执行任务
	 */
	getIsExecuting(): boolean {
		return this.isExecuting;
	}
}
