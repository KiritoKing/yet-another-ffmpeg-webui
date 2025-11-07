import type { CommandPreset } from '../types/command';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { PencilIcon, DownloadIcon, TrashIcon, FileIcon } from 'lucide-react';

interface CommandListProps {
  presets: CommandPreset[];
  selectedId?: string;
  onSelect: (preset: CommandPreset) => void;
  onEdit: (preset: CommandPreset) => void;
  onDelete: (preset: CommandPreset) => void;
  onExport: (preset: CommandPreset) => void;
}

export function CommandList({
  presets,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onExport,
}: CommandListProps) {
  // 按分类分组
  const groupedPresets = presets.reduce((acc, preset) => {
    const category = preset.category || '未分类';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(preset);
    return acc;
  }, {} as Record<string, CommandPreset[]>);

  const categories = Object.keys(groupedPresets).sort();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pr-4">
        {categories.map((category) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="h-px flex-1 bg-border"></div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </h3>
              <div className="h-px flex-1 bg-border"></div>
            </div>
            <div className="space-y-3">
              {groupedPresets[category].map((preset) => (
                <Card
                  key={preset.id}
                  className={`group cursor-pointer transition-all overflow-hidden ${
                    selectedId === preset.id
                      ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
                      : 'hover:border-primary/40 hover:shadow-md hover:bg-accent/5'
                  }`}
                  onClick={() => onSelect(preset)}
                >
                  <div className="relative p-4">
                    {/* 选中指示器 */}
                    {selectedId === preset.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    )}
                    
                    <div className="flex items-start gap-3">
                      {/* 主内容区 */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* 标题和描述 */}
                        <div>
                          <CardTitle className="text-base font-semibold mb-1.5 truncate">
                            {preset.name}
                          </CardTitle>
                          {preset.description && (
                            <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                              {preset.description}
                            </CardDescription>
                          )}
                        </div>
                        
                        {/* 文件信息 */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/50">
                          <FileIcon className="size-3.5 shrink-0 text-primary/60" />
                          <span className="font-medium">{preset.inputFiles.length} 个输入</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span className="truncate flex-1" title={preset.outputFileName}>
                            {preset.outputFileName}
                          </span>
                        </div>
                      </div>
                      
                      {/* 操作按钮区 */}
                      <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:bg-primary/10 hover:text-primary rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(preset);
                          }}
                          title="编辑"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExport(preset);
                          }}
                          title="导出"
                        >
                          <DownloadIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:bg-destructive/10 hover:text-destructive rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`确定要删除 "${preset.name}" 吗？`)) {
                              onDelete(preset);
                            }
                          }}
                          title="删除"
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {presets.length === 0 && (
          <Card className="p-12 border-dashed">
            <div className="text-center text-muted-foreground">
              <FileIcon className="size-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">暂无命令预设</p>
              <p className="text-xs mt-1">点击"新建命令"创建第一个预设</p>
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
