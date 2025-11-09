import { Github, Heart } from "lucide-react";
import { Button } from "./ui/button";

export function Footer() {
	return (
		<footer className="border-t bg-muted/30 mt-auto">
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* App Info */}
					<div className="text-center sm:text-left">
						<h3 className="font-semibold mb-1">FFmpeg Easy</h3>
						<p className="text-sm text-muted-foreground">
							浏览器端视频处理工具 - 基于 FFmpeg.wasm
						</p>
					</div>

					{/* Links & Info */}
					<div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-1">
							<span>Made with</span>
							<Heart className="w-3 h-3 text-red-500 fill-red-500" />
							<span>using React</span>
						</div>

						<div className="h-4 w-px bg-border hidden sm:block" />

						<span>MIT License</span>

						<div className="h-4 w-px bg-border hidden sm:block" />

						<Button
							variant="link"
							className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
							asChild
						>
							<a
								href="https://github.com/KiritoKing/yet-another-ffmpeg-webui"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1"
							>
								<Github className="w-4 h-4" />
								GitHub
							</a>
						</Button>
					</div>
				</div>
			</div>
		</footer>
	);
}
