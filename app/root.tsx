import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { EventSystemProvider } from "./components/EventSystemProvider";
import { Toaster } from "./components/ui/sonner";
import "./app.css";

// 结构化数据
const structuredData = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: "FFmpeg Easy",
	description:
		"专业的在线视频处理工具，支持视频格式转换、压缩、旋转等功能。基于WebAssembly技术，完全在浏览器中运行，文件无需上传到服务器。",
	url: "https://ffmpeg-easy.vercel.app",
	applicationCategory: "MultimediaApplication",
	operatingSystem: "Any",
	browserRequirements: "Chrome 57+, Firefox 52+, Safari 11+, Edge 16+",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "CNY",
		availability: "https://schema.org/InStock",
	},
	creator: {
		"@type": "Organization",
		name: "FFmpeg Easy Team",
	},
	featureList: [
		"视频格式转换",
		"视频压缩",
		"视频旋转",
		"视频裁剪",
		"批量处理",
		"实时进度显示",
		"无需上传文件",
		"完全免费",
	],
	screenshot: "https://ffmpeg-easy.vercel.app/og-image.png",
	softwareVersion: "1.0.0",
	dateCreated: "2024-01-01",
	inLanguage: "zh-CN",
};

// 在 CSR 模式下，Vercel 配置中的 headers 会自动添加必要的 HTTP 头
// 这里不需要额外的配置，因为 vercel.json 已经包含了所需的头

export const meta: Route.MetaFunction = () => [
	{ charset: "utf-8" },
	{ title: "FFmpeg Easy - 简单易用的在线视频处理工具 | 免费格式转换压缩" },
	{
		name: "description",
		content:
			"FFmpeg Easy 是专业的在线视频处理工具，支持视频格式转换、压缩、旋转、裁剪等功能。基于WebAssembly技术，完全在浏览器中运行，文件无需上传到服务器，安全快速。支持MP4、AVI、MOV、WebM等主流格式。",
	},
	{
		name: "keywords",
		content:
			"FFmpeg, 视频处理, 在线视频转换, 视频压缩, 格式转换, MP4转换, 视频裁剪, 视频旋转, WebAssembly, 浏览器工具, 免费视频工具, 无上传, 安全处理",
	},
	{ name: "author", content: "FFmpeg Easy Team" },
	{ name: "viewport", content: "width=device-width, initial-scale=1" },
	{ name: "language", content: "zh-CN" },
	{ name: "revisit-after", content: "7 days" },
	{ name: "distribution", content: "global" },
	{ name: "rating", content: "general" },
	{ property: "og:title", content: "FFmpeg Easy - 简单易用的在线视频处理工具" },
	{
		property: "og:description",
		content:
			"专业的在线视频处理工具，支持格式转换、压缩、旋转等功能。完全在浏览器中运行，文件无需上传，安全快速。",
	},
	{ property: "og:type", content: "website" },
	{ property: "og:url", content: "https://ffmpeg-easy.vercel.app" },
	{
		property: "og:image",
		content: "https://ffmpeg-easy.vercel.app/og-image.png",
	},
	{ property: "og:image:width", content: "1200" },
	{ property: "og:image:height", content: "630" },
	{ property: "og:image:alt", content: "FFmpeg Easy - 在线视频处理工具" },
	{ property: "og:site_name", content: "FFmpeg Easy" },
	{ property: "og:locale", content: "zh_CN" },
	{ name: "twitter:card", content: "summary_large_image" },
	{
		name: "twitter:title",
		content: "FFmpeg Easy - 简单易用的在线视频处理工具",
	},
	{
		name: "twitter:description",
		content:
			"专业的在线视频处理工具，支持格式转换、压缩、旋转等功能。完全在浏览器中运行，文件无需上传，安全快速。",
	},
	{
		name: "twitter:image",
		content: "https://ffmpeg-easy.vercel.app/twitter-image.png",
	},
	{ name: "twitter:site", content: "@ffmpeg_easy" },
	{ name: "twitter:creator", content: "@ffmpeg_easy" },
	{
		name: "robots",
		content:
			"index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
	},
	{ name: "googlebot", content: "index, follow" },
	{ name: "baidu-site-verification", content: "codeva-ffmpeg-easy" },
	{ name: "msvalidate.01", content: "YOUR_BING_VERIFICATION_CODE" },
	{ name: "yandex-verification", content: "YOUR_YANDEX_VERIFICATION_CODE" },
	{ name: "theme-color", content: "#3b82f6" },
	{ name: "msapplication-TileColor", content: "#3b82f6" },
	{ name: "msapplication-config", content: "/browserconfig.xml" },
	{ name: "mobile-web-app-capable", content: "yes" },
	{ name: "apple-mobile-web-app-capable", content: "yes" },
	{
		name: "apple-mobile-web-app-status-bar-style",
		content: "black-translucent",
	},
	{ name: "apple-mobile-web-app-title", content: "FFmpeg Easy" },
	{ name: "application-name", content: "FFmpeg Easy" },
	{ name: "generator", content: "FFmpeg Easy v1.0.0" },
];

export const links: Route.LinksFunction = () => [
	{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
	{
		rel: "icon",
		type: "image/png",
		sizes: "32x32",
		href: "/favicon-32x32.png",
	},
	{
		rel: "icon",
		type: "image/png",
		sizes: "16x16",
		href: "/favicon-16x16.png",
	},
	{
		rel: "icon",
		type: "image/png",
		sizes: "192x192",
		href: "/android-chrome-192x192.png",
	},
	{
		rel: "icon",
		type: "image/png",
		sizes: "512x512",
		href: "/android-chrome-512x512.png",
	},
	{ rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
	{ rel: "manifest", href: "/site.webmanifest" },
	{ rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#000000" },
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				{/* 结构化数据 */}
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: ineedthis
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(structuredData, null, 2),
					}}
				/>
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<div className="min-h-screen flex flex-col">
			{/* 全局事件系统提供者 */}
			<EventSystemProvider />

			<main className="flex-1">
				<Outlet />
			</main>
			<Toaster richColors position="top-right" />
		</div>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
