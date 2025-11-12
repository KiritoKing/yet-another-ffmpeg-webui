import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/ffmpeg-web.tsx"),
	route("/settings", "routes/settings.tsx"),
] satisfies RouteConfig;
