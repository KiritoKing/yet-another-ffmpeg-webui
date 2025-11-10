import {
	type Driver,
	type DriverHook,
	type DriveStep,
	driver,
} from "driver.js";
import "driver.js/dist/driver.css";

export type DriverStep = DriveStep;

export interface DriverConfig {
	steps: DriverStep[];
	showProgress?: boolean;
	showButtons?: boolean;
	nextBtnText?: string;
	prevBtnText?: string;
	doneBtnText?: string;
	onNext?: DriverHook;
	onPrevious?: DriverHook;
	onDeselected?: DriverHook;
	onHighlighted?: DriverHook;
	onDestroyed?: () => void;
}

class DriverService {
	private driver: Driver | null = null;
	private isActive = false;

	start(config: DriverConfig) {
		if (this.isActive) {
			this.destroy();
		}

		this.driver = driver({
			...config,
			popoverClass: "ffmpeg-easy-driver",
			overlayColor: "rgba(0, 0, 0, 0.7)",
			overlayOpacity: 0.7,
			smoothScroll: true,
			allowClose: true,
			overlayClickBehavior: "nextStep",
			doneBtnText: config.doneBtnText || "完成",
			nextBtnText: config.nextBtnText || "下一步",
			prevBtnText: config.prevBtnText || "上一步",
			showProgress: config.showProgress !== false,
			showButtons:
				config.showButtons !== false ? ["next", "previous", "close"] : [],
			onDestroyed: () => {
				this.isActive = false;
				this.driver = null;
				config.onDestroyed?.();
			},
		});

		this.isActive = true;
		this.driver.drive();
	}

	next() {
		if (this.driver && this.isActive) {
			this.driver.moveNext();
		}
	}

	previous() {
		if (this.driver && this.isActive) {
			this.driver.movePrevious();
		}
	}

	destroy() {
		if (this.driver && this.isActive) {
			this.driver.destroy();
		}
	}

	isRunning() {
		return this.isActive;
	}
}

export const driverService = new DriverService();
