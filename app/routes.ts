import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("ffmpeg-demo", "routes/ffmpeg-demo.tsx"),
] satisfies RouteConfig;
