import { useState, useEffect } from 'react';
import type { CommandPreset } from '../types/command';
import { validatePreset } from '../utils/commandUtils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { XIcon, PlusIcon } from 'lucide-react';

interface CommandEditorProps {
  preset?: CommandPreset;
  onSave: (preset: Omit<CommandPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function CommandEditor({ preset, onSave, onCancel }: CommandEditorProps) {
  const [name, setName] = useState(preset?.name || '');
  const [description, setDescription] = useState(preset?.description || '');
  const [category, setCategory] = useState(preset?.category || '自定义');
  const [ffmpegArgs, setFfmpegArgs] = useState(preset?.ffmpegArgs.join(' ') || '');
  const [inputFiles, setInputFiles] = useState(
    preset?.inputFiles || [{ name: 'input.mp4', pattern: 'video/*' }]
  );
  const [outputFileName, setOutputFileName] = useState(preset?.outputFileName || 'output.mp4');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    const args = ffmpegArgs.trim().split(/\s+/).filter(Boolean);
    
    const newPreset = {
      name,
      description,
      category,
      ffmpegArgs: args,
      inputFiles,
      outputFileName,
    };

    const validationErrors = validatePreset(newPreset);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave(newPreset);
  };

  const addInputFile = () => {
    setInputFiles([...inputFiles, { name: `input${inputFiles.length + 1}.mp4`, pattern: 'video/*' }]);
  };

  const removeInputFile = (index: number) => {
    setInputFiles(inputFiles.filter((_, i) => i !== index));
  };

  const updateInputFile = (index: number, field: 'name' | 'pattern', value: string) => {
    setInputFiles(
      inputFiles.map((file, i) =>
        i === index ? { ...file, [field]: value } : file
      )
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">
          {preset ? '编辑命令' : '新建命令'}
        </CardTitle>
        <CardDescription>
          配置 FFmpeg 命令参数和输入输出文件
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 错误提示 */}
        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-semibold text-destructive mb-2">请修正以下错误：</h4>
            <ul className="list-disc list-inside text-sm text-destructive/90 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              命令名称 <Badge variant="destructive" className="ml-1">必填</Badge>
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
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="简要描述此命令的功能..."
          />
        </div>

        <Separator />

        {/* 输入文件 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>
              输入文件 <Badge variant="destructive" className="ml-1">必填</Badge>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInputFile}
            >
              <PlusIcon className="mr-1" />
              添加文件
            </Button>
          </div>
          <div className="space-y-2">
            {inputFiles.map((file, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={file.name}
                  onChange={(e) => updateInputFile(index, 'name', e.target.value)}
                  placeholder="input.mp4"
                  className="flex-1"
                />
                <Select
                  value={file.pattern || ''}
                  onValueChange={(value) => updateInputFile(index, 'pattern', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="文件类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">任意文件</SelectItem>
                    <SelectItem value="video/*">视频</SelectItem>
                    <SelectItem value="audio/*">音频</SelectItem>
                    <SelectItem value="image/*">图片</SelectItem>
                  </SelectContent>
                </Select>
                {inputFiles.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInputFile(index)}
                  >
                    <XIcon />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* FFmpeg 参数 */}
        <div className="space-y-2">
          <Label htmlFor="ffmpegArgs">
            FFmpeg 参数 <Badge variant="destructive" className="ml-1">必填</Badge>
          </Label>
          <Textarea
            id="ffmpegArgs"
            value={ffmpegArgs}
            onChange={(e) => setFfmpegArgs(e.target.value)}
            rows={4}
            className="font-mono text-sm"
            placeholder="-i input.mp4 -c copy output.mp4"
          />
          <p className="text-xs text-muted-foreground">
            输入完整的 FFmpeg 命令参数（空格分隔）
          </p>
        </div>

        {/* 输出文件 */}
        <div className="space-y-2">
          <Label htmlFor="outputFileName">
            输出文件名 <Badge variant="destructive" className="ml-1">必填</Badge>
          </Label>
          <Input
            id="outputFileName"
            value={outputFileName}
            onChange={(e) => setOutputFileName(e.target.value)}
            placeholder="output.mp4"
          />
        </div>

        <Separator />

        {/* 按钮 */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSave}
          >
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
