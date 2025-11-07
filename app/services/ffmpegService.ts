import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export type FFmpegMode = "single" | "multi";

export interface FFmpegConfig {
  mode: FFmpegMode;
  onLog?: (message: string) => void;
  onProgress?: (progress: number, time: number) => void;
}

export interface ConvertOptions {
  inputFile: File;
  outputFormat?: string;
  videoCodec?: string;
  quality?: number;
  speed?: number;
}

export class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private config: FFmpegConfig;
  private loaded = false;

  constructor(config: FFmpegConfig) {
    this.config = config;
  }

  /**
   * 检查是否支持多线程模式
   */
  static isMultiThreadSupported(): boolean {
    return typeof SharedArrayBuffer !== "undefined";
  }

  /**
   * 加载 FFmpeg
   */
  async load(): Promise<void> {
    if (this.loaded) {
      throw new Error("FFmpeg 已经加载");
    }

    // 检查多线程支持
    if (
      this.config.mode === "multi" && !FFmpegService.isMultiThreadSupported()
    ) {
      throw new Error(
        "当前环境不支持多线程模式，请使用单线程模式或重启开发服务器",
      );
    }

    const corePackage = this.config.mode === "multi"
      ? "@ffmpeg/core-mt"
      : "@ffmpeg/core";
    const baseURL =
      `https://cdn.jsdelivr.net/npm/${corePackage}@0.12.6/dist/esm`;

    this.ffmpeg = new FFmpeg();

    // 设置日志回调
    if (this.config.onLog) {
      this.ffmpeg.on("log", ({ message }) => {
        this.config.onLog?.(message);
      });
    }

    // 设置进度回调
    if (this.config.onProgress) {
      this.ffmpeg.on("progress", ({ progress, time }) => {
        this.config.onProgress?.(progress, time);
      });
    }

    const loadConfig: any = {
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    };

    // 多线程版本需要额外的 worker
    if (this.config.mode === "multi") {
      loadConfig.workerURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript",
      );
    }

    await this.ffmpeg.load(loadConfig);
    this.loaded = true;
  }

  /**
   * 转换视频
   */
  async convert(options: ConvertOptions): Promise<Blob> {
    if (!this.ffmpeg || !this.loaded) {
      throw new Error("FFmpeg 未加载，请先调用 load()");
    }

    const {
      inputFile,
      outputFormat = "webm",
      videoCodec = "libvpx-vp9",
      quality = 30,
      speed = 4, // 降低默认速度，提高稳定性
    } = options;

    // 使用简单的文件名，避免特殊字符问题
    const inputFileName = "input.mp4";
    const outputFileName = "output.mp4";

    try {
      // 写入输入文件
      this.config.onLog?.(`正在加载文件: ${inputFile.name} (${(inputFile.size / 1024).toFixed(2)} KB)`);
      const inputData = await fetchFile(inputFile);
      await this.ffmpeg.writeFile(inputFileName, inputData);
      this.config.onLog?.(`文件已写入 FFmpeg 虚拟文件系统`);

      // 使用最简单的复制模式 - 不重新编码，只是重新封装
      // 这可以测试 FFmpeg 的基本功能是否正常
      const args = [
        "-i", inputFileName,
        "-c", "copy", // 复制所有流，不重新编码
        outputFileName,
      ];

      this.config.onLog?.(`执行 FFmpeg 命令: ffmpeg ${args.join(" ")}`);
      
      // 执行转换
      await this.ffmpeg.exec(args);
      
      this.config.onLog?.(`转换完成，正在读取输出文件`);

      // 读取输出文件
      const data = await this.ffmpeg.readFile(outputFileName);
      
      this.config.onLog?.(`输出文件大小: ${(data.length / 1024).toFixed(2)} KB`);

      // 创建新的 Uint8Array 副本，避免 SharedArrayBuffer 问题
      const uint8Data = new Uint8Array(data as Uint8Array);
      const buffer = uint8Data.buffer.slice(0);
      
      // 清理文件
      try {
        await this.ffmpeg.deleteFile(inputFileName);
        await this.ffmpeg.deleteFile(outputFileName);
        this.config.onLog?.(`清理临时文件完成`);
      } catch (e) {
        console.warn("清理文件失败:", e);
      }

      // 返回 Blob（保持原视频格式）
      return new Blob([buffer], { type: inputFile.type || "video/mp4" });
    } catch (error) {
      this.config.onLog?.(`转换失败: ${error}`);
      // 确保在错误时也清理文件
      try {
        await this.ffmpeg.deleteFile(inputFileName).catch(() => {});
        await this.ffmpeg.deleteFile(outputFileName).catch(() => {});
      } catch (e) {
        // 忽略清理错误
      }
      throw error;
    }
  }

  /**
   * 获取是否已加载
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * 获取模式
   */
  getMode(): FFmpegMode {
    return this.config.mode;
  }

  /**
   * 终止 FFmpeg（清理资源）
   */
  async terminate(): Promise<void> {
    if (this.ffmpeg && this.loaded) {
      await this.ffmpeg.terminate();
      this.ffmpeg = null;
      this.loaded = false;
    }
  }
}
