import { type ReactNode, useMemo, useState } from "react";
import {
	Mention,
	MentionsInput,
	type MentionsInputStyle,
	type OnChangeHandlerFunc,
	type SuggestionDataItem,
} from "react-mentions";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";

interface ArgsEditorProps {
	value: string;
	onChange: (v: string) => void;
	variables: string[]; // declared variables from formSchema
	highlight?: boolean;
	onVariableInsert?: (name: string) => void; // when user picks a variable from suggestion list
}

export function ArgsEditor({
	value,
	onChange,
	variables,
	highlight = true,
	onVariableInsert,
}: ArgsEditorProps) {
	const mentionOptions = useMemo(
		() => variables.map((name) => ({ id: name, display: name })),
		[variables],
	);
	const [focused, setFocused] = useState(false);

	const handleChange: OnChangeHandlerFunc = (_event, newValue) => {
		onChange(newValue);
	};

	const mentionStyles = useMemo<MentionsInputStyle>(
		() => ({
			control: {
				display: "block",
				width: "100%",
				minHeight: "10rem",
				padding: 0,
				border: "none",
				background: "transparent",
				position: "relative",
				fontFamily:
					'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace)',
				fontSize: "0.75rem",
				lineHeight: 1.6,
			},
			highlighter: {
				padding: "0.75rem",
				whiteSpace: "pre-wrap",
				wordBreak: "break-word",
				minHeight: "10rem",
				borderRadius: "inherit",
				fontFamily:
					'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace)',
				fontSize: "0.75rem",
				lineHeight: 1.6,
			},
			input: {
				padding: "0.75rem",
				whiteSpace: "pre-wrap",
				wordBreak: "break-word",
				minHeight: "10rem",
				border: "none",
				outline: "none",
				boxShadow: "none",
				background: "transparent",
				fontFamily:
					'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace)',
				fontSize: "0.75rem",
				lineHeight: 1.6,
				color: "inherit",
				caretColor: "var(--foreground)",
			},
			suggestions: {
				list: {
					backgroundColor: "hsl(var(--popover))",
					border: "1px solid hsl(var(--border))",
					borderRadius: "0.5rem",
					padding: "0.25rem",
					boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
					fontSize: "0.75rem",
					marginTop: "0.25rem",
					maxHeight: "12rem",
					overflowY: "auto",
					zIndex: 20,
				},
				item: {
					padding: "0.35rem 0.75rem",
					borderRadius: "0.375rem",
					display: "flex",
					alignItems: "center",
					gap: "0.5rem",
					color: "hsl(var(--foreground))",
					"&focused": {
						backgroundColor: "hsl(var(--accent))",
						color: "hsl(var(--accent-foreground))",
					},
				},
			},
		}),
		[],
	);

	return (
		<div
			className={cn(
				"relative w-full min-w-0 rounded-md border bg-background text-foreground shadow-xs transition-[box-shadow,color]",
				focused ? "border-ring ring-2 ring-ring" : "border-input",
			)}
		>
			<MentionsInput
				className="block w-full"
				value={value}
				onChange={handleChange}
				placeholder="-i input.mp4 -vf scale={{width}}:{{height}} output.mp4"
				allowSuggestionsAboveCursor
				forceSuggestionsAboveCursor
				style={mentionStyles}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
			>
				<Mention
					trigger="{{"
					markup="{{__id__}}"
					data={mentionOptions}
					appendSpaceOnAdd={false}
					displayTransform={(id: string) => `{{${id}}}`}
					onAdd={(id: string | number) => onVariableInsert?.(String(id))}
					style={{
						backgroundColor: "transparent",
						color: highlight ? "#b45309" : undefined,
						fontWeight: highlight ? 600 : undefined,
					}}
					renderSuggestion={(
						entry: SuggestionDataItem,
						_search: string,
						_highlightedDisplay: ReactNode,
						_index: number,
						focused: boolean,
					) => (
						<div
							className={cn(
								"flex w-full items-center gap-2 px-3 py-1.5",
								focused
									? "bg-accent text-accent-foreground"
									: "text-foreground",
							)}
						>
							<Badge variant="secondary" className="text-[10px]">
								{entry.display ?? entry.id}
							</Badge>
							<span className="text-muted-foreground">插入</span>
						</div>
					)}
				/>
			</MentionsInput>
		</div>
	);
}
