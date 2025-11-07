import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ModeSelectProps {
  useMultiThread: boolean;
  onModeChange: (multiThread: boolean) => void;
}

export function ModeSelect({ useMultiThread, onModeChange }: ModeSelectProps) {
  const isSharedArrayBufferAvailable = typeof SharedArrayBuffer !== 'undefined';

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="mode-select" className="text-sm whitespace-nowrap">
        运行模式:
      </Label>
      <Select
        value={useMultiThread ? 'multi' : 'single'}
        onValueChange={(value) => onModeChange(value === 'multi')}
      >
        <SelectTrigger id="mode-select" className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="multi">
            <div className="flex items-center gap-2">
              <span>多线程模式 ⚡</span>
              {!isSharedArrayBufferAvailable && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 text-orange-600 border-orange-600">
                  需重启
                </Badge>
              )}
            </div>
          </SelectItem>
          <SelectItem value="single">
            <span>单线程模式 ✓</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
