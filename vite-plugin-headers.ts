import type { Plugin } from "vite";

/**
 * Vite 插件：为开发服务器添加必要的 HTTP headers
 * 用于支持 SharedArrayBuffer（FFmpeg 多线程模式）
 */
export function headersPlugin(): Plugin {
	return {
		name: "configure-response-headers",
		configureServer(server) {
			server.middlewares.use((_req, res, next) => {
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
				res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
				next();
			});
		},
		configurePreviewServer(server) {
			server.middlewares.use((_req, res, next) => {
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
				res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
				next();
			});
		},
	};
}
