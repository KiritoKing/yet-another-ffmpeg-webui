import { XIcon } from "lucide-react";
import type { FormField } from "../types/command";
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
import { Textarea } from "./ui/textarea";

interface Props {
	schema: FormField[];
	onChange: (schema: FormField[]) => void;
	usedVariables?: string[]; // variables used in args
}

export function FormSchemaEditor({
	schema,
	onChange,
	usedVariables = [],
}: Props) {
	const addFormField = () => {
		onChange([
			...schema,
			{
				name: `field${schema.length + 1}`,
				label: `字段${schema.length + 1}`,
				type: "text",
				defaultValue: "",
			},
		]);
	};

	const updateFormField = (index: number, field: Partial<FormField>) => {
		onChange(schema.map((f, i) => (i === index ? { ...f, ...field } : f)));
	};

	const removeFormField = (index: number) => {
		onChange(schema.filter((_, i) => i !== index));
	};

	const declaredVars = schema.map((f) => f.name);
	const unusedDeclared = declaredVars.filter((v) => !usedVariables.includes(v));

	return (
		<div id="custom-form-editor" className="space-y-3">
			<div className="flex items-center justify-between">
				<Label className="font-medium">表单字段配置</Label>
				<Button
					variant="outline"
					size="sm"
					type="button"
					onClick={addFormField}
				>
					添加字段
				</Button>
			</div>
			{schema.length === 0 && (
				<p className="text-xs text-muted-foreground">
					暂无字段，点击“添加字段”创建。
				</p>
			)}
			<div className="space-y-4">
				{schema.map((field, index) => (
					// biome-ignore lint/correctness/useJsxKeyInIterable: no need
					<div className="border rounded-md p-3 space-y-2 bg-card">
						<div className="flex items-center justify-between">
							<Input
								value={field.name}
								onChange={(e) =>
									updateFormField(index, {
										name: e.target.value.replace(/\s+/g, ""),
									})
								}
								placeholder="变量名"
								className="font-mono text-xs w-32"
							/>
							<Select
								value={field.type}
								onValueChange={(val) =>
									updateFormField(index, { type: val as FormField["type"] })
								}
							>
								<SelectTrigger className="w-28 h-8">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="text">text</SelectItem>
									<SelectItem value="number">number</SelectItem>
									<SelectItem value="select">select</SelectItem>
									<SelectItem value="slider">slider</SelectItem>
									<SelectItem value="checkbox">checkbox</SelectItem>
									<SelectItem value="file-input">file-input</SelectItem>
									<SelectItem value="file-output">file-output</SelectItem>
								</SelectContent>
							</Select>
							<Button
								variant="ghost"
								size="icon"
								type="button"
								onClick={() => removeFormField(index)}
							>
								<XIcon className="size-4" />
							</Button>
						</div>
						<Input
							value={field.label}
							onChange={(e) =>
								updateFormField(index, { label: e.target.value })
							}
							placeholder="显示标签"
							className="text-xs"
						/>
						{(field.type === "text" || field.type === "number") && (
							<Input
								value={String(field.defaultValue ?? "")}
								onChange={(e) =>
									updateFormField(index, {
										defaultValue:
											field.type === "number"
												? Number(e.target.value)
												: e.target.value,
									})
								}
								placeholder="默认值"
								className="text-xs"
							/>
						)}
						{field.type === "slider" && (
							<div className="grid grid-cols-3 gap-2">
								<Input
									type="number"
									value={String(field.min ?? "")}
									onChange={(e) =>
										updateFormField(index, {
											min: e.target.value ? Number(e.target.value) : undefined,
										})
									}
									placeholder="最小值"
									className="text-xs"
								/>
								<Input
									type="number"
									value={String(field.max ?? "")}
									onChange={(e) =>
										updateFormField(index, {
											max: e.target.value ? Number(e.target.value) : undefined,
										})
									}
									placeholder="最大值"
									className="text-xs"
								/>
								<Input
									type="number"
									value={String(field.step ?? "")}
									onChange={(e) =>
										updateFormField(index, {
											step: e.target.value ? Number(e.target.value) : undefined,
										})
									}
									placeholder="步长"
									className="text-xs"
								/>
							</div>
						)}
						{field.type === "select" && (
							<div className="space-y-2">
								<Label className="text-xs">选项 (label:value，每行一个)</Label>
								<Textarea
									value={(field.options || [])
										.map((o) => `${o.label}:${o.value}`)
										.join("\n")}
									onChange={(e) => {
										const opts = e.target.value
											.split("\n")
											.map((l) => l.trim())
											.filter(Boolean)
											.map((l) => {
												const [label, value] = l.split(":");
												return {
													label: label || value || "",
													value: value || label || "",
												};
											});
										updateFormField(index, { options: opts });
									}}
									rows={4}
									className="font-mono text-[11px]"
								/>
							</div>
						)}
						{field.type === "file-input" && (
							<div className="space-y-2">
								<div className="grid grid-cols-2 gap-2">
									<Input
										value={field.accept || ""}
										onChange={(e) =>
											updateFormField(index, { accept: e.target.value })
										}
										placeholder="接受类型（例如：video/*, .mp4,.mov）"
										className="text-xs col-span-2"
									/>
									<label className="flex items-center gap-2 text-xs cursor-pointer select-none">
										<input
											type="checkbox"
											className="h-3 w-3"
											checked={!!field.multiple}
											onChange={(e) =>
												updateFormField(index, { multiple: e.target.checked })
											}
										/>
										允许多文件
									</label>
									{field.multiple && (
										<Input
											type="number"
											value={String(field.maxFiles ?? "")}
											onChange={(e) =>
												updateFormField(index, {
													maxFiles: e.target.value
														? Number(e.target.value)
														: undefined,
												})
											}
											placeholder="最大文件数"
											className="text-xs"
										/>
									)}
									<Input
										type="number"
										value={String(field.maxSizeMB ?? "")}
										onChange={(e) =>
											updateFormField(index, {
												maxSizeMB: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										placeholder="单个文件大小上限（MB）"
										className="text-xs"
									/>
								</div>
							</div>
						)}
						{field.type === "file-output" && (
							<div className="space-y-2">
								<div className="grid grid-cols-3 gap-2">
									<Input
										value={String(field.defaultValue ?? "")}
										onChange={(e) =>
											updateFormField(index, { defaultValue: e.target.value })
										}
										placeholder="默认输出文件名 (如 output.mp4)"
										className="text-xs col-span-3"
									/>
									<Input
										value={field.defaultExtension || ""}
										onChange={(e) =>
											updateFormField(index, {
												defaultExtension: e.target.value,
											})
										}
										placeholder="默认扩展名 (如 mp4, webm)"
										className="text-xs"
									/>
									<Input
										value={field.mimeType || ""}
										onChange={(e) =>
											updateFormField(index, { mimeType: e.target.value })
										}
										placeholder="MIME 类型 (如 video/mp4)"
										className="text-xs col-span-2"
									/>
								</div>
							</div>
						)}
						<Textarea
							value={field.description || ""}
							onChange={(e) =>
								updateFormField(index, { description: e.target.value })
							}
							placeholder="字段描述 (可选)"
							rows={2}
							className="text-[11px]"
						/>
						<div className="flex items-center gap-2">
							<label className="flex items-center gap-1 text-xs cursor-pointer select-none">
								<input
									type="checkbox"
									className="h-3 w-3"
									checked={!!field.required}
									onChange={(e) =>
										updateFormField(index, { required: e.target.checked })
									}
								/>
								必填
							</label>
							{field.type === "checkbox" && (
								<label className="flex items-center gap-1 text-xs cursor-pointer select-none">
									<input
										type="checkbox"
										className="h-3 w-3"
										checked={!!field.defaultValue}
										onChange={(e) =>
											updateFormField(index, { defaultValue: e.target.checked })
										}
									/>
									默认选中
								</label>
							)}
						</div>
						{declaredVars.includes(field.name) && (
							<Badge variant="secondary" className="text-[10px]">
								已引用
							</Badge>
						)}
						{usedVariables.includes(field.name) &&
							!declaredVars.includes(field.name) && (
								<Badge variant="destructive" className="text-[10px]">
									未声明
								</Badge>
							)}
					</div>
				))}
			</div>
			{unusedDeclared.length > 0 && (
				<p className="text-[11px] text-muted-foreground">
					未使用的字段: {unusedDeclared.join(", ")}
				</p>
			)}
		</div>
	);
}
