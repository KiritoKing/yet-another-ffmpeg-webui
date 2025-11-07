import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { DownloadIcon } from "lucide-react";

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
			/>
			<Button asChild>
				<a href={videoSrc} download="output.webm">
					<DownloadIcon className="mr-2" />
					下载视频
				</a>
			</Button>
		</Card>
	);
}
