import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("ffmpeg-web", "routes/ffmpeg-web.tsx"),
  route("ffmpeg-demo", "routes/ffmpeg-demo.tsx"),
  route("ffmpeg-advanced", "routes/ffmpeg-advanced.tsx"),
] satisfies RouteConfig;
