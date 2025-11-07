import { useEffect, useRef, useState } from "react";
import { FileUploader } from "../components/FileUploader";
import { InfoPanel } from "../components/InfoPanel";
import { LogViewer } from "../components/LogViewer";
import { ModeSelect } from "../components/ModeSelect";
import { VideoPlayer } from "../components/VideoPlayer";
import { type FFmpegMode, FFmpegService } from "../services/ffmpegService";
import { useLogStore } from "../store/logStore";

export default function FFmpegDemo() {
	const [loaded, setLoaded] = useState(false);
	const [videoSrc, setVideoSrc] = useState("");
	const [processing, setProcessing] = useState(false);
	const [isClient, setIsClient] = useState(false);
	const [useMultiThread, setUseMultiThread] = useState(true);
	const ffmpegServiceRef = useRef<FFmpegService | null>(null);
	const addLog = useLogStore((state) => state.addLog);
	const logs = useLogStore((state) => state.logs);

	// 确保只在客户端运行
	useEffect(() => {
		setIsClient(true);
	}, []);

	const load = async () => {
		if (!isClient) return;

		// 检查多线程支持
		if (useMultiThread && !FFmpegService.isMultiThreadSupported()) {
			addLog("您的浏览器不支持多线程模式，自动切换到单线程模式", "warning");
			setUseMultiThread(false);
			setTimeout(() => {
				addLog('已切换到单线程模式，请重新点击"加载 FFmpeg"按钮', "info");
			}, 2000);
			return;
		}

		const mode: FFmpegMode = useMultiThread ? "multi" : "single";
		const modeText = useMultiThread ? "多线程版本" : "单线程版本";

		try {
			addLog(`开始加载 FFmpeg ${modeText}（约 30MB）`, "info");

			// 创建 FFmpeg 服务实例
			const service = new FFmpegService({
				mode,
				onLog: (message) => {
					console.log(message);
					addLog(message, "info");
				},
				onProgress: (progress, time) => {
					addLog(
						`处理进度: ${(progress * 100).toFixed(2)}% (${(time / 1000000).toFixed(2)}s)`,
						"info",
					);
				},
			});

			await service.load();
			ffmpegServiceRef.current = service;
			setLoaded(true);
			addLog(`FFmpeg ${modeText} 加载成功！🚀`, "success");
		} catch (error) {
			console.error("详细错误:", error);
			const errorMsg = error instanceof Error ? error.message : String(error);

			// 如果是 SharedArrayBuffer 错误，提示用户切换模式
			if (
				errorMsg.includes("SharedArrayBuffer") ||
				errorMsg.includes("多线程")
			) {
				addLog("多线程模式需要特殊的服务器配置", "error");
				setTimeout(() => {
					setUseMultiThread(false);
					addLog("已自动切换到单线程模式，请重新加载", "warning");
				}, 3000);
			} else {
				addLog(`加载失败: ${errorMsg}`, "error");
			}
		}
	};

	const convertVideo = async (file: File) => {
		const service = ffmpegServiceRef.current;

		if (!loaded || !service) {
			addLog("请先加载 FFmpeg", "warning");
			return;
		}

		setProcessing(true);

		try {
			addLog(
				`开始转换: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`,
				"info",
			);

			if (useMultiThread) {
				addLog("使用多线程模式", "info");
			} else {
				addLog("使用单线程模式", "info");
			}

			// 方式1: 使用便捷的 convert 方法（内部调用 executeCommand）
			const outputBlob = await service.convert({
				inputFile: file,
			});

			// 方式2: 使用 executeCommand 执行自定义 FFmpeg 命令
			// const outputBlob = await service.executeCommand({
			//   inputFiles: [{ file, name: 'input.mp4' }],
			//   outputFileName: 'output.mp4',
			//   ffmpegArgs: [
			//     '-i', 'input.mp4',
			//     '-c', 'copy',
			//     'output.mp4'
			//   ]
			// });

			const url = URL.createObjectURL(outputBlob);
			setVideoSrc(url);
			addLog("视频转换成功！🎉", "success");
		} catch (error) {
			console.error("转换错误详情:", error);
			console.error("错误堆栈:", error instanceof Error ? error.stack : "N/A");

			let errorMessage = "未知错误";

			if (error instanceof Error) {
				errorMessage = error.message;
				// 如果是内存错误，给出更详细的提示
				if (errorMessage.includes("memory access out of bounds")) {
					errorMessage +=
						"\n\n可能的原因：\n1. 视频文件格式不支持\n2. FFmpeg WASM 内存限制\n3. 浏览器内存不足\n\n建议：尝试更小的视频文件或刷新页面重试";
				}
			} else if (typeof error === "string") {
				errorMessage = error;
			} else if (error && typeof error === "object") {
				errorMessage = JSON.stringify(error);
			}

			addLog(`转换失败: ${errorMessage}`, "error");
		} finally {
			setProcessing(false);
		}
	};

	const handleFileSelect = (file: File) => {
		// 验证文件类型
		if (!file.type || !file.type.startsWith("video/")) {
			addLog(`请选择视频文件，当前文件类型: ${file.type || "未知"}`, "error");
			return;
		}

		// 验证文件大小（建议小于 500MB）
		const maxSize = 500 * 1024 * 1024; // 500MB
		if (file.size > maxSize) {
			addLog(
				`文件太大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，建议小于 500MB`,
				"warning",
			);
			return;
		}

		convertVideo(file);
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
			{!isClient ? (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-gray-600">加载中...</p>
					</div>
				</div>
			) : (
				<div className="max-w-4xl mx-auto">
					<h1 className="text-4xl font-bold text-gray-800 mb-2">
						FFmpeg.wasm 示例
					</h1>
					<p className="text-gray-600 mb-8">
						在浏览器中运行 FFmpeg - 支持单线程/多线程模式
					</p>

					<div className="bg-white rounded-lg shadow-lg p-8 mb-6">
						<div className="space-y-4">
							{!loaded ? (
								<>
									<ModeSelect
										useMultiThread={useMultiThread}
										onModeChange={setUseMultiThread}
									/>
									<button
										type="button"
										onClick={load}
										className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
									>
										加载 FFmpeg {useMultiThread ? "(多线程)" : "(单线程)"}
									</button>
								</>
							) : (
								<FileUploader
									onFileSelect={handleFileSelect}
									disabled={processing}
								/>
							)}

							{processing && (
								<div className="flex justify-center">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
								</div>
							)}
						</div>
					</div>

					{logs.length > 0 && (
						<div className="mb-6">
							<LogViewer />
						</div>
					)}

					<VideoPlayer videoSrc={videoSrc} />

					<InfoPanel />
				</div>
			)}
		</div>
	);
}
