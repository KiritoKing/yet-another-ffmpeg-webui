# 自定义表单功能文档

## 概述

FFmpeg Easy 支持为命令预设创建自定义表单，让用户可以通过可视化界面调整参数，而不需要手动编辑复杂的 FFmpeg 命令。

## 功能特性

- ✅ 支持多种表单字段类型（文本、数字、选择器、滑块、复选框）
- ✅ 实时预览：修改参数后命令立即更新
- ✅ 模板变量替换：使用 `{{variableName}}` 语法
- ✅ 字段验证：支持必填、最小值、最大值等验证
- ✅ 默认值配置：预设合理的默认参数

## 表单字段类型

### 1. Text（文本输入）
```typescript
{
  name: 'outputFormat',
  label: '输出格式',
  type: 'text',
  defaultValue: 'mp4',
  placeholder: '例如: mp4, webm, avi',
  description: '输出视频的文件格式',
  required: true
}
```

### 2. Number（数字输入）
```typescript
{
  name: 'width',
  label: '宽度（像素）',
  type: 'number',
  defaultValue: 1280,
  min: 128,
  max: 3840,
  step: 2,
  required: true,
  description: '输出视频的宽度（必须是偶数）'
}
```

### 3. Select（下拉选择）
```typescript
{
  name: 'direction',
  label: '旋转方向',
  type: 'select',
  defaultValue: '1',
  required: true,
  description: '选择视频旋转的方向',
  options: [
    { label: '顺时针旋转 90°', value: '1' },
    { label: '逆时针旋转 90°', value: '2' },
    { label: '顺时针旋转 90° + 垂直翻转', value: '3' },
    { label: '逆时针旋转 90° + 垂直翻转', value: '0' }
  ]
}
```

### 4. Slider（滑块）
```typescript
{
  name: 'quality',
  label: 'CRF 质量',
  type: 'slider',
  defaultValue: 23,
  min: 18,
  max: 35,
  step: 1,
  description: 'CRF 值：18=最高质量，28=平衡，35=最低质量'
}
```

### 5. Checkbox（复选框）
```typescript
{
  name: 'faststart',
  label: '启用快速启动',
  type: 'checkbox',
  defaultValue: true,
  description: '为 Web 播放优化（将 moov atom 移到文件开头）'
}
```

## 完整示例

### 示例 1：旋转视频

```typescript
{
  name: '旋转视频',
  description: '使用自定义角度或方向旋转视频（支持表单化配置）',
  category: '视频编辑',
  ffmpegArgs: [
    '-i',
    'input.mp4',
    '-vf',
    'transpose={{direction}}',
    '-c:a',
    'copy',
    'output.mp4',
  ],
  inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
  outputFileName: 'output.mp4',
  formSchema: [
    {
      name: 'direction',
      label: '旋转方向',
      type: 'select',
      defaultValue: '1',
      required: true,
      description: '选择视频旋转的方向',
      options: [
        { label: '顺时针旋转 90°', value: '1' },
        { label: '逆时针旋转 90°', value: '2' },
        { label: '顺时针旋转 90° + 垂直翻转', value: '3' },
        { label: '逆时针旋转 90° + 垂直翻转', value: '0' },
      ],
    },
  ],
}
```

**生成的命令：**
```bash
# 当 direction = '1' 时
ffmpeg -i input.mp4 -vf transpose=1 -c:a copy output.mp4
```

### 示例 2：视频缩放（多参数）

```typescript
{
  name: '视频缩放（自定义）',
  description: '自定义视频分辨率、码率和质量参数',
  category: '视频编辑',
  ffmpegArgs: [
    '-i',
    'input.mp4',
    '-vf',
    'scale={{width}}:{{height}}',
    '-b:v',
    '{{bitrate}}k',
    '-crf',
    '{{quality}}',
    '-c:a',
    'copy',
    'output.mp4',
  ],
  inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
  outputFileName: 'output.mp4',
  formSchema: [
    {
      name: 'width',
      label: '宽度（像素）',
      type: 'number',
      defaultValue: 1280,
      min: 128,
      max: 3840,
      step: 2,
      required: true,
      description: '输出视频的宽度（必须是偶数）',
    },
    {
      name: 'height',
      label: '高度（像素）',
      type: 'number',
      defaultValue: 720,
      min: 128,
      max: 2160,
      step: 2,
      required: true,
      description: '输出视频的高度（必须是偶数）',
    },
    {
      name: 'bitrate',
      label: '视频码率（kbps）',
      type: 'slider',
      defaultValue: 2000,
      min: 500,
      max: 10000,
      step: 100,
      description: '视频比特率，值越高质量越好但文件越大',
    },
    {
      name: 'quality',
      label: 'CRF 质量',
      type: 'slider',
      defaultValue: 23,
      min: 18,
      max: 35,
      step: 1,
      description: 'CRF 值：18=最高质量，28=平衡，35=最低质量',
    },
  ],
}
```

**生成的命令：**
```bash
# 使用默认值时
ffmpeg -i input.mp4 -vf scale=1280:720 -b:v 2000k -crf 23 -c:a copy output.mp4
```

## 模板变量语法

在 `ffmpegArgs` 中使用 `{{variableName}}` 来引用表单字段：

```typescript
ffmpegArgs: [
  '-i',
  'input.mp4',
  '-vf',
  'scale={{width}}:{{height}}',  // 模板变量
  '-b:v',
  '{{bitrate}}k',                // 模板变量
  'output.mp4'
]
```

变量会在执行时被替换为用户选择的值。

## 字段属性说明

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 字段名称，用于模板变量 |
| `label` | string | ✅ | 显示标签 |
| `type` | string | ✅ | 字段类型：text, number, select, slider, checkbox |
| `defaultValue` | string/number/boolean | ❌ | 默认值 |
| `placeholder` | string | ❌ | 占位符文本（仅 text 类型） |
| `description` | string | ❌ | 字段描述/帮助文本 |
| `required` | boolean | ❌ | 是否必填 |
| `min` | number | ❌ | 最小值（number/slider 类型） |
| `max` | number | ❌ | 最大值（number/slider 类型） |
| `step` | number | ❌ | 步长（number/slider 类型） |
| `options` | Array | ❌ | 选项列表（select 类型必填） |

## 最佳实践

### 1. 提供合理的默认值
```typescript
{
  name: 'quality',
  type: 'slider',
  defaultValue: 23,  // 推荐值
  min: 18,
  max: 35
}
```

### 2. 添加清晰的描述
```typescript
{
  name: 'crf',
  label: 'CRF 质量',
  description: 'CRF 值：18=最高质量，28=平衡，35=最低质量'  // 帮助用户理解
}
```

### 3. 使用语义化的选项标签
```typescript
options: [
  { label: '顺时针旋转 90°', value: '1' },  // 清晰的说明
  { label: '逆时针旋转 90°', value: '2' }
]
```

### 4. 设置合理的范围限制
```typescript
{
  name: 'width',
  type: 'number',
  min: 128,    // 最小合理值
  max: 3840,   // 最大合理值（4K）
  step: 2      // FFmpeg 要求偶数
}
```

## 导入导出

自定义表单配置会随命令预设一起导出为 JSON：

```json
{
  "name": "旋转视频",
  "ffmpegArgs": ["-i", "input.mp4", "-vf", "transpose={{direction}}", ...],
  "formSchema": [
    {
      "name": "direction",
      "label": "旋转方向",
      "type": "select",
      "defaultValue": "1",
      ...
    }
  ]
}
```

## 技术实现

### 类型定义
```typescript
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'slider' | 'checkbox';
  defaultValue?: string | number | boolean;
  placeholder?: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
}

interface CommandPreset {
  // ... 其他字段
  formSchema?: FormField[];
}
```

### 模板替换函数
```typescript
function replaceTemplateVariables(
  args: string[],
  values: Record<string, string | number | boolean>
): string[] {
  return args.map((arg) => {
    let result = arg;
    const matches = arg.matchAll(/\{\{(\w+)\}\}/g);
    for (const match of matches) {
      const varName = match[1];
      const value = values[varName];
      if (value !== undefined) {
        result = result.replace(match[0], String(value));
      }
    }
    return result;
  });
}
```

## 常见问题

### Q: 如何创建带表单的命令？
A: 在命令预设的 JSON 中添加 `formSchema` 字段，定义需要的表单字段。

### Q: 可以动态改变参数吗？
A: 是的！表单修改后命令会实时更新，你可以在"FFmpeg 命令"预览区看到最终命令。

### Q: 支持哪些 FFmpeg 参数？
A: 理论上支持所有 FFmpeg 参数，只要在命令中使用模板变量语法即可。

### Q: 如何验证用户输入？
A: 使用 `required`、`min`、`max`、`step` 等属性进行基本验证。

---

**提示：** 可以通过"导出单个"功能将带表单的命令导出为 JSON，然后分享给其他用户！
