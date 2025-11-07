import { useState, useEffect } from 'react';
import type { FormField } from '../types/command';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { UploadIcon, XIcon } from 'lucide-react';
import { Button } from './ui/button';

interface DynamicFormProps {
  schema: FormField[];
  values: Record<string, string | number | boolean | File | File[]>;
  onChange: (values: Record<string, string | number | boolean | File | File[]>) => void;
}

export function DynamicForm({ schema, values, onChange }: DynamicFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string | number | boolean | File | File[]>>(values);

  useEffect(() => {
    setFormValues(values);
  }, [values]);

  const handleChange = (name: string, value: string | number | boolean | File | File[]) => {
    const newValues = { ...formValues, [name]: value };
    setFormValues(newValues);
    onChange(newValues);
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.name] ?? field.defaultValue;

    switch (field.type) {
      case 'file-input':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <Badge variant="destructive" className="ml-1 text-xs">必填</Badge>}
            </Label>
            <div className="space-y-2">
              <Input
                id={field.name}
                type="file"
                accept={field.accept || 'video/*,audio/*'}
                multiple={field.multiple}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (field.multiple) {
                    const maxFiles = field.maxFiles || 10;
                    if (files.length > maxFiles) {
                      alert(`最多只能选择 ${maxFiles} 个文件`);
                      return;
                    }
                    handleChange(field.name, files);
                  } else {
                    handleChange(field.name, files[0] || null);
                  }
                }}
                className="cursor-pointer"
              />
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
              {field.maxSizeMB && (
                <p className="text-xs text-muted-foreground">
                  单文件最大: {field.maxSizeMB} MB
                </p>
              )}
              {/* 显示已选文件 */}
              {value && (
                <div className="mt-2 space-y-1">
                  {Array.isArray(value) ? (
                    value.map((file: File, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-1.5 text-xs">
                        <span className="truncate">{file.name}</span>
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-1.5 text-xs">
                      <span className="truncate">{(value as File).name}</span>
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        {((value as File).size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'file-output':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <Badge variant="destructive" className="ml-1 text-xs">必填</Badge>}
            </Label>
            <div className="flex gap-2">
              <Input
                id={field.name}
                type="text"
                value={String(value || field.defaultValue || '')}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder || `output.${field.defaultExtension || 'mp4'}`}
                required={field.required}
                className="flex-1"
              />
              {field.defaultExtension && (
                <Badge variant="outline" className="self-center">
                  .{field.defaultExtension}
                </Badge>
              )}
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <Badge variant="destructive" className="ml-1 text-xs">必填</Badge>}
            </Label>
            <Input
              id={field.name}
              type="text"
              value={String(value || '')}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <Badge variant="destructive" className="ml-1 text-xs">必填</Badge>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={Number(value || field.defaultValue || 0)}
              onChange={(e) => handleChange(field.name, Number(e.target.value))}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <Badge variant="destructive" className="ml-1 text-xs">必填</Badge>}
            </Label>
            <Select
              value={String(value || field.defaultValue || '')}
              onValueChange={(val) => handleChange(field.name, val)}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={field.placeholder || '请选择'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'slider':
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <Badge variant="destructive" className="ml-1 text-xs">必填</Badge>}
              </Label>
              <span className="text-sm font-mono text-muted-foreground">
                {typeof value === 'number' ? value : (field.defaultValue ?? field.min ?? 0)}
              </span>
            </div>
            <Slider
              id={field.name}
              value={[Number(typeof value === 'number' ? value : (field.defaultValue ?? field.min ?? 0))]}
              onValueChange={(vals: number[]) => handleChange(field.name, vals[0])}
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                id={field.name}
                type="checkbox"
                checked={Boolean(value ?? field.defaultValue ?? false)}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor={field.name} className="cursor-pointer">
                {field.label}
                {field.required && <Badge variant="destructive" className="ml-1 text-xs">必填</Badge>}
              </Label>
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground ml-6">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {schema.map((field) => renderField(field))}
    </div>
  );
}
