import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "FFmpeg Easy - 浏览器中的视频处理工具" },
		{ name: "description", content: "使用 FFmpeg.wasm 在浏览器中处理视频" },
	];
}

export default function Home() {
	return (
		<div className="min-h-screen bg-linear-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
			<div className="max-w-2xl w-full">
				<div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
					<h1 className="text-5xl font-bold text-gray-900 mb-4 text-center">
						FFmpeg Easy
					</h1>
					<p className="text-xl text-gray-600 text-center mb-8">
						在浏览器中处理视频 - 无需上传，保护隐私
					</p>

					<div className="space-y-4">
						<Link
							to="/ffmpeg-web"
							className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
						>
							🚀 FFmpeg Web - 完整版
						</Link>

						<div className="grid grid-cols-2 gap-3">
							<Link
								to="/ffmpeg-demo"
								className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow text-sm"
							>
								🎬 简单模式
							</Link>

							<Link
								to="/ffmpeg-advanced"
								className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow text-sm"
							>
								⚡ 高级模式
							</Link>
						</div>

						<div className="bg-gray-50 rounded-lg p-6 mt-8">
							<h2 className="text-lg font-semibold text-gray-800 mb-3">
								✨ 功能特点
							</h2>
							<ul className="space-y-2 text-gray-600">
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

				<p className="text-center text-gray-500 mt-6 text-sm">
					基于{" "}
					<a
						href="https://github.com/ffmpegwasm/ffmpeg.wasm"
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 hover:underline"
					>
						FFmpeg.wasm
					</a>{" "}
					构建
				</p>
			</div>
		</div>
	);
}
