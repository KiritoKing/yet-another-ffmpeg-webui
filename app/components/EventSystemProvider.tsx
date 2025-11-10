import { useEffect } from "react";
import { useEventListeners } from "../hooks/useEventListeners";
import { setupDriverEventHandlers } from "../services/events/driverHandlers";

/**
 * 全局事件系统提供者组件
 * 负责初始化和管理应用的事件监听器
 */
export function EventSystemProvider() {
	// 初始化全局事件监听器
	useEventListeners();

	useEffect(() => {
		// 初始化 Driver.js 相关的事件处理器
		const driverHandlers = setupDriverEventHandlers();

		return () => {
			// 清理事件处理器
			driverHandlers.unregister();
		};
	}, []);

	// 这个组件不渲染任何内容
	return null;
}
