import type { FFmpegMode } from "./ffmpegService";
import { FFmpegService } from "./ffmpegService";

/**
 * 提供 FFmpeg 实例的通用接口
 * 支持单实例与多实例池两种实现
 */
export interface FFmpegProvider {
	acquire(): Promise<FFmpegService>;
	release(instance: FFmpegService): void | Promise<void>;
	dispose(): Promise<void>;
}

/**
 * 单实例提供者（不支持并发执行，适用于 batchSize=1 的情况）
 */
export class SingleFFmpegProvider implements FFmpegProvider {
	private service: FFmpegService;

	constructor(service: FFmpegService) {
		this.service = service;
	}

	async acquire(): Promise<FFmpegService> {
		return this.service;
	}

	// 单实例无需归还处理
	release(): void {}

	async dispose(): Promise<void> {
		// 这里不主动终止由外部创建并管理的单例
	}
}

export interface FFmpegWorkerPoolOptions {
	size: number; // 池大小 = 并发 worker 数量
	mode: FFmpegMode; // 与主实例一致的模式（single/multi）
	onLog?: (message: string) => void; // 日志代理（可选）
}

/**
 * FFmpeg 多实例池
 * 预先创建并加载 size 个 FFmpegService，每次 acquire 返回一个空闲实例
 */
export class FFmpegWorkerPool implements FFmpegProvider {
	private options: FFmpegWorkerPoolOptions;
	private workers: FFmpegService[] = [];
	private available: FFmpegService[] = [];
	private waitQueue: Array<(inst: FFmpegService) => void> = [];
	private loaded = false;

	constructor(options: FFmpegWorkerPoolOptions) {
		this.options = options;
	}

	/**
	 * 预加载所有 worker 实例
	 */
	async loadAll(): Promise<void> {
		if (this.loaded) return;

		const createOne = async (index: number) => {
			const service = new FFmpegService({
				mode: this.options.mode,
				onLog: (msg) => this.options.onLog?.(`[worker#${index + 1}] ${msg}`),
				// 进度可按需路由，这里仅透传日志，避免与任务绑定造成混乱
			});
			await service.load();
			this.workers.push(service);
			this.available.push(service);
		};

		for (let i = 0; i < this.options.size; i++) {
			// 串行加载，避免同时抓取大文件造成压力；如需更快可改为 Promise.all
			// eslint-disable-next-line no-await-in-loop
			await createOne(i);
		}

		this.loaded = true;
	}

	async acquire(): Promise<FFmpegService> {
		if (!this.loaded) {
			await this.loadAll();
		}

		if (this.available.length > 0) {
			const inst = this.available.shift();
			if (inst) return inst;
		}

		return new Promise<FFmpegService>((resolve) => {
			this.waitQueue.push(resolve);
		});
	}

	release(instance: FFmpegService): void {
		const resolver = this.waitQueue.shift();
		if (resolver) {
			resolver(instance);
		} else {
			this.available.push(instance);
		}
	}

	async dispose(): Promise<void> {
		// 终止并清理所有 worker 实例
		const workers = [...this.workers];
		this.workers = [];
		this.available = [];
		this.waitQueue = [];
		await Promise.allSettled(workers.map((w) => w.terminate()));
		this.loaded = false;
	}
}
