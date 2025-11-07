import { useEffect, useRef, useState } from 'react';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ArgsEditorProps {
  value: string;
  onChange: (v: string) => void;
  variables: string[]; // declared variables from formSchema
  highlight?: boolean;
  onVariableInsert?: (name: string) => void; // when user picks a variable from suggestion list
}

// Helper to build a mirror div for caret measurement
function createMirror(textarea: HTMLTextAreaElement) {
  const div = document.createElement('div');
  const style = window.getComputedStyle(textarea);
  for (const prop of [
    'boxSizing','width','height','fontSize','fontFamily','fontWeight','lineHeight','letterSpacing','textTransform','padding','borderLeftWidth','borderRightWidth','borderTopWidth','borderBottomWidth','textAlign','whiteSpace'
  ]) {
    // @ts-ignore
    div.style[prop] = style[prop];
  }
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  return div;
}

export function ArgsEditor({ value, onChange, variables, highlight = true, onVariableInsert }: ArgsEditorProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [suggestVisible, setSuggestVisible] = useState(false);
  const [suggestPos, setSuggestPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [filter, setFilter] = useState('');

  // All variable occurrences
  const varRegex = /\{\{(\w+)\}\}/g;
  const highlightedHTML = highlight
    ? value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(varRegex,(m,v)=>`<span class='text-amber-600 font-semibold'>{{${v}}}</span>`)
    : value;

  const updateCaretSuggestion = () => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const textBefore = value.slice(0, start);
    // Determine if suggestion should appear (after '{{' but before '}}')
    const triggerIndex = textBefore.lastIndexOf('{{');
    const closeIndex = textBefore.lastIndexOf('}}');
    if (triggerIndex > -1 && (closeIndex < triggerIndex)) {
      setFilter(textBefore.slice(triggerIndex + 2));
      // Measure caret position
      const mirror = createMirror(ta);
      mirror.textContent = textBefore;
      const span = document.createElement('span');
      span.textContent = '\u200b';
      mirror.appendChild(span);
      ta.parentElement?.appendChild(mirror);
      const rect = span.getBoundingClientRect();
      const taRect = ta.getBoundingClientRect();
      setSuggestPos({ top: rect.top - taRect.top + ta.scrollTop + 18, left: rect.left - taRect.left + 4 });
      mirror.remove();
      setSuggestVisible(true);
    } else {
      setSuggestVisible(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Escape') {
      setSuggestVisible(false);
      return;
    }
    // Accept first suggestion with Tab / Enter when visible
    if (suggestVisible && (e.key === 'Tab' || e.key === 'Enter')) {
      e.preventDefault();
      const targetVar = filteredVariables[0];
      if (targetVar) applyVariable(targetVar);
    }
  };

  const applyVariable = (name: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const textBefore = value.slice(0, start);
    const triggerIndex = textBefore.lastIndexOf('{{');
    if (triggerIndex === -1) return;
    const prefix = value.slice(0, triggerIndex + 2); // include '{{'
    const suffix = value.slice(start); // remainder
    const newValue = `${prefix}${name}}}${suffix}`; // append name + '}}'
    onChange(newValue);
    requestAnimationFrame(() => {
      const caretPos = prefix.length + name.length + 2; // after '}}'
      ta.selectionStart = ta.selectionEnd = caretPos;
      updateCaretSuggestion();
    });
    if (onVariableInsert) onVariableInsert(name);
  };

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    onChange(e.target.value);
    requestAnimationFrame(updateCaretSuggestion);
  };

  const handleClick: React.MouseEventHandler<HTMLTextAreaElement> = () => {
    requestAnimationFrame(updateCaretSuggestion);
  };

  const filteredVariables = variables.filter(v => v.startsWith(filter));

  useEffect(() => {
    updateCaretSuggestion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      {highlight && (
        <div
          className="absolute inset-0 pointer-events-none whitespace-pre-wrap font-mono text-xs text-transparent selection:bg-blue-300"
          aria-hidden
          dangerouslySetInnerHTML={{ __html: highlightedHTML }}
        />
      )}
      <Textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        rows={8}
        className={cn('font-mono text-xs relative bg-transparent', highlight && 'text-black dark:text-white caret-black dark:caret-white')}
        placeholder="-i input.mp4 -vf scale={{width}}:{{height}} output.mp4"
      />
      {suggestVisible && filteredVariables.length > 0 && (
        <div
          className="absolute z-20 bg-popover border rounded-md shadow-sm p-1 text-xs max-h-48 overflow-auto"
          style={{ top: suggestPos.top, left: suggestPos.left }}
        >
          {filteredVariables.map(name => (
            <button
              key={name}
              type="button"
              onClick={() => applyVariable(name)}
              className="flex w-full items-center gap-2 px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded"
            >
              <Badge variant="secondary" className="text-[10px]">{name}</Badge>
              <span className="text-muted-foreground">插入</span>
            </button>
          ))}
          {filteredVariables.length === 0 && <div className="px-2 py-1 text-muted-foreground">无匹配变量</div>}
        </div>
      )}
    </div>
  );
}
