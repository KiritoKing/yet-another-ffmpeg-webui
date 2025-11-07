// 移除的 legacy 图标（输入文件增删）已不再需要
import { useEffect, useState } from "react";
import type { CommandPreset, FormField } from "../types/command";
import {
	extractTemplateVariables,
	validatePreset,
	validateTemplateUsage,
} from "../utils/commandUtils";
import { ArgsEditor } from "./ArgsEditor";
import { FormSchemaEditor } from "./FormSchemaEditor";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

interface CommandEditorProps {
	preset?: CommandPreset;
	onSave: (
		preset: Omit<CommandPreset, "id" | "createdAt" | "updatedAt">,
	) => void;
	onCancel: () => void;
	onFormEditorToggle?: (open: boolean) => void;
}

export function CommandEditor({
	preset,
	onSave,
	onCancel,
	onFormEditorToggle,
}: CommandEditorProps) {
	const [name, setName] = useState(preset?.name || "");
	const [description, setDescription] = useState(preset?.description || "");
	const [category, setCategory] = useState(preset?.category || "自定义");
	const [ffmpegArgs, setFfmpegArgs] = useState(
		preset?.ffmpegArgs.join(" ") || "",
	);
	// legacy inputFiles/outputFileName 已移除，使用 formSchema 中的 file-input/file-output
	// 表单编辑器相关状态
	const [showFormEditor, setShowFormEditor] = useState(false);
	const [formSchema, setFormSchema] = useState<FormField[]>(
		preset?.formSchema || [],
	);
	const [_templateErrors, setTemplateErrors] = useState<{
		unknown: string[];
		unused: string[];
	}>({ unknown: [], unused: [] });
	const [errors, setErrors] = useState<string[]>([]);

	// 通知上层表单编辑器展开状态
	useEffect(() => {
		onFormEditorToggle?.(showFormEditor);
	}, [showFormEditor, onFormEditorToggle]);

	// 当预设切换时重置面板展开状态
	useEffect(() => {
		setShowFormEditor(false);
	}, []);

	const handleSave = () => {
		const args = ffmpegArgs.trim().split(/\s+/).filter(Boolean);
		const newPreset = {
			name,
			description,
			category,
			ffmpegArgs: args,
			formSchema: formSchema.length ? formSchema : undefined,
		};

		const validationErrors = validatePreset(newPreset);
		const { unknown } = validateTemplateUsage({
			ffmpegArgs: newPreset.ffmpegArgs,
			formSchema: newPreset.formSchema,
		});
		if (unknown.length > 0) {
			validationErrors.push(`存在未声明的模板变量: ${unknown.join(", ")}`);
		}
		if (validationErrors.length > 0) {
			setErrors(validationErrors);
			return;
		}
		onSave(newPreset);
	};

	// 输入/输出文件通过表单编辑器维护，不再单独编辑 legacy 字段

	// 同步并校验模板变量使用情况
	useEffect(() => {
		const argsArray = ffmpegArgs.trim().split(/\s+/).filter(Boolean);
		const v = validateTemplateUsage({ ffmpegArgs: argsArray, formSchema });
		setTemplateErrors(v);
	}, [ffmpegArgs, formSchema]);

	const declaredVars = formSchema.map((f) => f.name);
	const usedVars = extractTemplateVariables(
		ffmpegArgs.trim().split(/\s+/).filter(Boolean),
	);
	const undeclaredUsed = usedVars.filter((v) => !declaredVars.includes(v));
	const unusedDeclared = declaredVars.filter((v) => !usedVars.includes(v));

	return (
		<div
			className={
				showFormEditor
					? "grid grid-cols-[minmax(0,1fr)_380px] gap-6"
					: "space-y-6"
			}
		>
			{/* 左侧：基础配置 + 命令参数 */}
			<div className="space-y-6 min-w-0">
				{/* 错误提示 */}
				{errors.length > 0 && (
					<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
						<h4 className="font-semibold text-destructive mb-2">
							请修正以下错误：
						</h4>
						<ul className="list-disc list-inside text-sm text-destructive/90 space-y-1">
							{errors.map((error) => (
								<li key={error}>{error}</li>
							))}
						</ul>
					</div>
				)}

				{/* 模板变量使用状态提示 */}
				{(undeclaredUsed.length > 0 || unusedDeclared.length > 0) && (
					<div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1 text-xs">
						{undeclaredUsed.length > 0 && (
							<p className="text-amber-700 dark:text-amber-300">
								未声明的变量: {undeclaredUsed.join(", ")}
							</p>
						)}
						{unusedDeclared.length > 0 && (
							<p className="text-amber-700 dark:text-amber-300">
								未使用的字段: {unusedDeclared.join(", ")}
							</p>
						)}
					</div>
				)}

				{/* 基本信息 */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="name">
							命令名称{" "}
							<Badge variant="destructive" className="ml-1">
								必填
							</Badge>
						</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="例如：转换为 WebM"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="category">分类</Label>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger id="category">
								<SelectValue placeholder="选择分类" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="基础">基础</SelectItem>
								<SelectItem value="格式转换">格式转换</SelectItem>
								<SelectItem value="视频编辑">视频编辑</SelectItem>
								<SelectItem value="音频提取">音频提取</SelectItem>
								<SelectItem value="高级">高级</SelectItem>
								<SelectItem value="自定义">自定义</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="description">描述</Label>
					<Textarea
						id="description"
						value={description}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							setDescription(e.target.value)
						}
						rows={2}
						placeholder="简要描述此命令的功能..."
					/>
				</div>

				<Separator />

				{/* 输入/输出文件已通过“表单字段编辑器”管理 */}
				<p className="text-xs text-muted-foreground">
					文件选择与输出命名请在右侧“表单字段编辑器”中使用 file-input /
					file-output 字段配置。
				</p>

				{/* FFmpeg 参数 */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="ffmpegArgs" className="flex items-center gap-2">
							FFmpeg 参数 <Badge variant="destructive">必填</Badge>
						</Label>
						<Button
							variant="outline"
							size="sm"
							type="button"
							onClick={() => setShowFormEditor((s) => !s)}
						>
							{showFormEditor ? "隐藏表单编辑器" : "显示表单编辑器"}
						</Button>
					</div>
					<ArgsEditor
						value={ffmpegArgs}
						onChange={setFfmpegArgs}
						variables={declaredVars}
						highlight
					/>
				</div>

				<Separator />

				{/* 按钮 */}
				<div className="flex justify-end gap-3">
					<Button type="button" variant="outline" onClick={onCancel}>
						取消
					</Button>
					<Button type="button" onClick={handleSave}>
						保存
					</Button>
				</div>
			</div>

			{/* 右侧：表单字段编辑器固定列 */}
			{showFormEditor && (
				<div className="space-y-4 h-full overflow-y-auto pb-4">
					<FormSchemaEditor
						schema={formSchema}
						onChange={setFormSchema}
						usedVariables={usedVars}
					/>
				</div>
			)}
		</div>
	);
}
