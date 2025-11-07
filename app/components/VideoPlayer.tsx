import { DownloadIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface VideoPlayerProps {
	videoSrc: string;
}

export function VideoPlayer({ videoSrc }: VideoPlayerProps) {
	if (!videoSrc) return null;

	return (
		<Card className="p-6">
			<h2 className="text-2xl font-bold mb-4">转换后的视频</h2>
			<video
				src={videoSrc}
				controls
				className="w-full rounded-lg shadow-md mb-4"
				aria-label="转换后的视频预览"
			>
				<track
					kind="captions"
					src="data:text/vtt,WEBVTT%0A%0A"
					srcLang="zh"
					label="空字幕"
					default
				/>
			</video>
			<Button asChild>
				<a href={videoSrc} download="output.webm">
					<DownloadIcon className="mr-2" />
					下载视频
				</a>
			</Button>
		</Card>
	);
}
