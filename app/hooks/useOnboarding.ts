import { useCallback, useEffect } from "react";
import { driverService } from "../services/driver";
import {
	advancedSteps,
	firstTimeSteps,
	onboardingSteps,
} from "../services/driver/steps";
import { type AppEvents, emitter } from "../services/events";
import { useFFmpegWebStore } from "../store/ffmpegWeb";

export const useOnboarding = () => {
	const { savedMode } = useFFmpegWebStore();
	const typedEmitter = emitter as {
		emit: <K extends keyof AppEvents>(event: K, data: AppEvents[K]) => void;
	};

	const startBasicTour = useCallback(() => {
		// 使用事件系统简化状态变化回调
		const stepsWithCallbacks = onboardingSteps.map((step) => {
			let onHighlighted: (() => void) | undefined;

			// 根据步骤元素ID发送对应的事件
			switch (step.element) {
				case "#command-panel":
					onHighlighted = () => {
						console.log("🚀 Emitting: driver:highlight-command-panel");
						typedEmitter.emit("driver:highlight-command-panel", undefined);
					};
					break;
				case "#queue-panel":
					onHighlighted = () => {
						console.log("🚀 Emitting: driver:highlight-queue-panel");
						typedEmitter.emit("driver:highlight-queue-panel", {});
					};
					break;
				case "#task-history":
					onHighlighted = () => {
						console.log("🚀 Emitting: driver:highlight-task-history");
						typedEmitter.emit("driver:highlight-task-history", undefined);
					};
					break;
				case "#settings-button":
					onHighlighted = () => {
						console.log("🚀 Emitting: driver:highlight-settings");
						typedEmitter.emit("driver:highlight-settings", undefined);
					};
					break;
				case "#help-button":
					onHighlighted = () => {
						console.log("🚀 Emitting: driver:highlight-help");
						typedEmitter.emit("driver:highlight-help", undefined);
					};
					break;
			}

			return {
				...step,
				onHighlighted,
			};
		});

		driverService.start({
			steps: stepsWithCallbacks,
			showProgress: true,
			nextBtnText: "下一步",
			prevBtnText: "上一步",
			doneBtnText: "完成引导",
			onDestroyed: () => {
				// 标记引导已完成
				localStorage.setItem("onboarding-completed", "true");
			},
		});
	}, [typedEmitter.emit]);

	const startAdvancedTour = useCallback(() => {
		// 使用事件系统简化高级引导状态变化回调
		const advancedStepsWithCallbacks = advancedSteps.map((step) => {
			let onHighlighted: (() => void) | undefined;

			// 根据步骤元素ID发送对应的事件
			switch (step.element) {
				case "#custom-form-editor":
					onHighlighted = () => {
						typedEmitter.emit("driver:highlight-custom-form", {});
					};
					break;
				case "#batch-upload":
					onHighlighted = () => {
						typedEmitter.emit("driver:highlight-batch-upload", {});
					};
					break;
				case "#task-history":
					onHighlighted = () => {
						typedEmitter.emit("driver:highlight-task-history", undefined);
					};
					break;
			}

			return {
				...step,
				onHighlighted,
			};
		});

		driverService.start({
			steps: advancedStepsWithCallbacks,
			showProgress: true,
			nextBtnText: "下一步",
			prevBtnText: "上一步",
			doneBtnText: "完成",
			onDestroyed: () => {
				localStorage.setItem("advanced-tour-completed", "true");
			},
		});
	}, [typedEmitter.emit]);

	const startFirstTimeTour = useCallback(() => {
		driverService.start({
			steps: firstTimeSteps,
			showProgress: false,
			showButtons: true,
			nextBtnText: "知道了",
			doneBtnText: "知道了",
			onDestroyed: () => {
				// 延迟开始基础引导
				setTimeout(() => {
					startBasicTour();
				}, 500);
			},
		});
	}, [startBasicTour]);

	const checkAndStartOnboarding = useCallback(() => {
		const hasCompletedOnboarding = localStorage.getItem("onboarding-completed");
		const hasSeenFirstTime = localStorage.getItem("first-time-completed");

		if (!hasSeenFirstTime && !savedMode) {
			// 首次访问，显示模式选择提示
			localStorage.setItem("first-time-completed", "true");
			startFirstTimeTour();
		} else if (!hasCompletedOnboarding) {
			// 未完成基础引导
			startBasicTour();
		}
	}, [savedMode, startBasicTour, startFirstTimeTour]);

	useEffect(() => {
		// 页面加载完成后检查是否需要显示引导
		const timer = setTimeout(() => {
			checkAndStartOnboarding();
		}, 1000);

		return () => clearTimeout(timer);
	}, [checkAndStartOnboarding]);

	return {
		startBasicTour,
		startAdvancedTour,
		startFirstTimeTour,
		checkAndStartOnboarding,
		isTourActive: () => driverService.isRunning(),
	};
};
