import { Input } from './ui/input';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUploader({ onFileSelect, disabled = false }: FileUploaderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept="video/*"
        onChange={handleChange}
        disabled={disabled}
      />
      <p className="text-sm text-muted-foreground">
        选择一个视频文件，将自动转换为 WebM 格式
      </p>
    </div>
  );
}
