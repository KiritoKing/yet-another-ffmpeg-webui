import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { headersPlugin } from "./vite-plugin-headers";

export default defineConfig({
	plugins: [headersPlugin(), tailwindcss(), reactRouter(), tsconfigPaths()],
	optimizeDeps: {
		include: ["@tauri-apps/api", "react", "react-dom"],
		exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
	},
});
