interface VideoPlayerProps {
  videoSrc: string;
}

export function VideoPlayer({ videoSrc }: VideoPlayerProps) {
  if (!videoSrc) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        转换后的视频
      </h2>
      <video
        src={videoSrc}
        controls
        className="w-full rounded-lg shadow-md"
      />
      <a
        href={videoSrc}
        download="output.webm"
        className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
      >
        下载视频
      </a>
    </div>
  );
}
