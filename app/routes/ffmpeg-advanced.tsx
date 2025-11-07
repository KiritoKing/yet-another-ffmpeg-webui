import { useEffect, useRef, useState } from "react";
import { LogViewer } from "../components/LogViewer";
import { ModeSelect } from "../components/ModeSelect";
import { VideoPlayer } from "../components/VideoPlayer";
import { type FFmpegMode, FFmpegService } from "../services/ffmpegService";
import { useLogStore } from "../store/logStore";

export default function FFmpegAdvanced() {
	const [loaded, setLoaded] = useState(false);
	const [videoSrc, setVideoSrc] = useState("");
	const [processing, setProcessing] = useState(false);
	const [isClient, setIsClient] = useState(false);
	const [useMultiThread, setUseMultiThread] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [customCommand, setCustomCommand] = useState(
		"-i input.mp4 -c copy output.mp4",
	);
	const ffmpegServiceRef = useRef<FFmpegService | null>(null);
	const addLog = useLogStore((state) => state.addLog);
	const logs = useLogStore((state) => state.logs);

	useEffect(() => {
		setIsClient(true);
	}, []);

	const load = async () => {
		if (!isClient) return;

		if (useMultiThread && !FFmpegService.isMultiThreadSupported()) {
			addLog("您的浏览器不支持多线程模式，自动切换到单线程模式", "warning");
			setUseMultiThread(false);
			return;
		}

		const mode: FFmpegMode = useMultiThread ? "multi" : "single";
		const modeText = useMultiThread ? "多线程版本" : "单线程版本";

		try {
			addLog(`开始加载 FFmpeg ${modeText}（约 30MB）`, "info");

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
			addLog(`加载失败: ${errorMsg}`, "error");
		}
	};

	const executeCustomCommand = async () => {
		const service = ffmpegServiceRef.current;

		if (!loaded || !service) {
			addLog("请先加载 FFmpeg", "warning");
			return;
		}

		if (!selectedFile) {
			addLog("请先选择文件", "warning");
			return;
		}

		setProcessing(true);

		try {
			addLog(`开始执行自定义命令: ${customCommand}`, "info");

			// 解析命令
			const args = customCommand.trim().split(/\s+/);

			// 找到输出文件名（最后一个参数）
			const outputFileName = args[args.length - 1];

			if (!outputFileName) {
				throw new Error("无法从命令中解析输出文件名");
			}

			// 执行自定义命令
			const outputBlob = await service.executeCommand({
				inputFiles: [{ file: selectedFile, name: "input.mp4" }],
				outputFileName,
				ffmpegArgs: args,
			});

			const url = URL.createObjectURL(outputBlob);
			setVideoSrc(url);
			addLog("命令执行成功！🎉", "success");
		} catch (error) {
			console.error("执行错误:", error);
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			addLog(`执行失败: ${errorMessage}`, "error");
		} finally {
			setProcessing(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith("video/")) {
				addLog(`请选择视频文件，当前文件类型: ${file.type || "未知"}`, "error");
				return;
			}
			setSelectedFile(file);
			addLog(
				`已选择文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
				"success",
			);
		}
	};

	const presetCommands = [
		{
			name: "复制流（不重新编码）",
			command: "-i input.mp4 -c copy output.mp4",
		},
		{
			name: "转换为 WebM",
			command: "-i input.mp4 -c:v libvpx-vp9 -b:v 1M -c:a libopus output.webm",
		},
		{
			name: "提取音频为 MP3",
			command: "-i input.mp4 -vn -acodec libmp3lame -q:a 2 output.mp3",
		},
		{
			name: "调整分辨率（720p）",
			command: "-i input.mp4 -vf scale=1280:720 -c:a copy output.mp4",
		},
		{
			name: "提取前 10 秒",
			command: "-i input.mp4 -t 10 -c copy output.mp4",
		},
		{
			name: "转换为 GIF",
			command:
				'-i input.mp4 -vf "fps=10,scale=320:-1:flags=lanczos" -c:v gif output.gif',
		},
	];

	return (
		<div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100 p-8">
			{!isClient ? (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
						<p className="text-gray-600">加载中...</p>
					</div>
				</div>
			) : (
				<div className="max-w-5xl mx-auto">
					<h1 className="text-4xl font-bold text-gray-800 mb-2">
						FFmpeg 高级模式
					</h1>
					<p className="text-gray-600 mb-8">
						执行自定义 FFmpeg 命令 - 完全控制视频处理流程
					</p>

					<div className="bg-white rounded-lg shadow-lg p-8 mb-6">
						<div className="space-y-6">
							{!loaded ? (
								<>
									<ModeSelect
										useMultiThread={useMultiThread}
										onModeChange={setUseMultiThread}
									/>
									<button
										type="button"
										onClick={load}
										className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
									>
										加载 FFmpeg {useMultiThread ? "(多线程)" : "(单线程)"}
									</button>
								</>
							) : (
								<>
									<div>
										<label
											htmlFor="advanced-input-file"
											className="block text-sm font-medium text-gray-700 mb-2"
										>
											选择视频文件
										</label>
										<input
											id="advanced-input-file"
											type="file"
											accept="video/*"
											onChange={handleFileChange}
											disabled={processing}
											className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
										/>
									</div>

									<div>
										<p className="block text-sm font-medium text-gray-700 mb-2">
											预设命令
										</p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
											{presetCommands.map((preset) => (
												<button
													type="button"
													key={preset.name}
													onClick={() => setCustomCommand(preset.command)}
													disabled={processing}
													className="text-left p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
												>
													<div className="font-medium text-sm text-gray-800">
														{preset.name}
													</div>
													<div className="text-xs text-gray-500 mt-1 font-mono">
														{preset.command}
													</div>
												</button>
											))}
										</div>
									</div>

									<div>
										<label
											htmlFor="advanced-command"
											className="block text-sm font-medium text-gray-700 mb-2"
										>
											FFmpeg 命令
										</label>
										<textarea
											id="advanced-command"
											value={customCommand}
											onChange={(e) => setCustomCommand(e.target.value)}
											disabled={processing}
											rows={3}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm disabled:opacity-50"
											placeholder="-i input.mp4 -c copy output.mp4"
										/>
										<p className="mt-2 text-xs text-gray-500">
											注意：输入文件必须命名为{" "}
											<code className="bg-gray-100 px-1 py-0.5 rounded">
												input.mp4
											</code>
										</p>
									</div>

									<button
										type="button"
										onClick={executeCustomCommand}
										disabled={processing || !selectedFile}
										className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{processing ? "处理中..." : "执行命令"}
									</button>
								</>
							)}

							{processing && (
								<div className="flex justify-center">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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

					<div className="bg-white rounded-lg shadow-lg p-6 mt-6">
						<h2 className="text-xl font-semibold text-gray-800 mb-4">
							使用说明
						</h2>
						<div className="space-y-3 text-sm text-gray-600">
							<div>
								<strong className="text-gray-800">1. 加载 FFmpeg：</strong>
								<p>选择单线程或多线程模式，点击"加载 FFmpeg"按钮</p>
							</div>
							<div>
								<strong className="text-gray-800">2. 选择文件：</strong>
								<p>上传您要处理的视频文件</p>
							</div>
							<div>
								<strong className="text-gray-800">3. 选择或输入命令：</strong>
								<p>使用预设命令或自定义 FFmpeg 命令参数</p>
							</div>
							<div>
								<strong className="text-gray-800">4. 执行：</strong>
								<p>点击"执行命令"开始处理</p>
							</div>
							<div className="pt-3 border-t border-gray-200">
								<strong className="text-gray-800">示例命令：</strong>
								<ul className="mt-2 space-y-1 font-mono text-xs">
									<li>
										• <code>-i input.mp4 -c copy output.mp4</code> - 复制流
									</li>
									<li>
										• <code>-i input.mp4 -vf scale=640:360 output.mp4</code> -
										调整大小
									</li>
									<li>
										•{" "}
										<code>
											-i input.mp4 -ss 00:00:10 -t 00:00:05 -c copy output.mp4
										</code>{" "}
										- 剪辑片段
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
