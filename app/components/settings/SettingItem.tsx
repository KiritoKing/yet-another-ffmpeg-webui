/**
 * SettingItem - Base wrapper component for settings
 *
 * Provides consistent layout for setting label, description, and control
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "../ui/label";

export interface SettingItemProps {
	id: string;
	title: string;
	description?: string;
	icon?: LucideIcon;
	mode: "dialog" | "page";
	layout?: "horizontal" | "vertical"; // horizontal for switch, vertical for select
	children: ReactNode;
}

export function SettingItem({
	id,
	title,
	description,
	icon: Icon,
	mode,
	layout = "vertical",
	children,
}: SettingItemProps) {
	const isHorizontal = layout === "horizontal";

	return (
		<div
			className={`space-y-3 ${isHorizontal ? "flex items-center justify-between" : ""}`}
		>
			<div className={isHorizontal ? "flex-1" : ""}>
				<Label
					htmlFor={`${mode}-${id}`}
					className="text-base flex items-center gap-2"
				>
					{Icon && <Icon className="w-4 h-4" />}
					{title}
				</Label>
				{description && (
					<p className="text-sm text-muted-foreground mt-1">{description}</p>
				)}
			</div>
			{children}
		</div>
	);
}
