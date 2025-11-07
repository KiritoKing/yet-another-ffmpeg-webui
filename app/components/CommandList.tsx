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
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
              {category}
            </h3>
            <div className="space-y-2">
              {groupedPresets[category].map((preset) => (
                <Card
                  key={preset.id}
                  className={`group cursor-pointer transition-all ${
                    selectedId === preset.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:border-primary/50 hover:shadow-sm'
                  }`}
                  onClick={() => onSelect(preset)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {preset.name}
                        </CardTitle>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(preset);
                          }}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExport(preset);
                          }}
                        >
                          <DownloadIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`确定要删除 "${preset.name}" 吗？`)) {
                              onDelete(preset);
                            }
                          }}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0">
                    {preset.description && (
                      <CardDescription className="text-xs line-clamp-2 mb-3">
                        {preset.description}
                      </CardDescription>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileIcon className="size-3" />
                      <span>{preset.inputFiles.length} 个输入</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="truncate">{preset.outputFileName}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {presets.length === 0 && (
          <Card className="p-12">
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
