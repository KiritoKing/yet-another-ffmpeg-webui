/**
 * SettingsRenderer - Main settings renderer with strategy pattern
 *
 * Supports two rendering modes:
 * - dialog: Two-column layout with category navigation (desktop)
 * - page: Flat scrollable layout (mobile)
 */

import type {
	SettingCategory,
	SettingConfig,
	SettingsRendererContext,
} from "../../config/settings-config";
import { Separator } from "../ui/separator";
import { SettingButton } from "./SettingButton";
import { SettingCard } from "./SettingCard";
import { SettingCustom } from "./SettingCustom";
import { SettingSelect } from "./SettingSelect";
import { SettingStats } from "./SettingStats";
import { SettingSwitch } from "./SettingSwitch";

interface SettingsRendererProps {
	mode: "dialog" | "page";
	categories: SettingCategory[];
	activeCategory?: string; // For dialog mode
	onCategoryChange?: (id: string) => void; // For dialog mode
	context: SettingsRendererContext;
}

/**
 * Render a single setting based on its type
 */
function renderSetting(
	setting: SettingConfig,
	mode: "dialog" | "page",
	context: SettingsRendererContext,
) {
	switch (setting.type) {
		case "select":
			return <SettingSelect key={setting.id} config={setting} mode={mode} />;
		case "switch":
			return <SettingSwitch key={setting.id} config={setting} mode={mode} />;
		case "button":
			return (
				<SettingButton
					key={setting.id}
					config={setting}
					mode={mode}
					context={context}
				/>
			);
		case "card":
			return (
				<SettingCard
					key={setting.id}
					config={setting}
					mode={mode}
					context={context}
				/>
			);
		case "stats":
			return (
				<SettingStats
					key={setting.id}
					config={setting}
					mode={mode}
					context={context}
				/>
			);
		case "custom":
			return <SettingCustom key={setting.id} config={setting} mode={mode} />;
		default:
			console.warn(`Unknown setting type: ${setting.type}`);
			return null;
	}
}

/**
 * Render settings for a category
 */
function renderCategorySettings(
	category: SettingCategory,
	mode: "dialog" | "page",
	context: SettingsRendererContext,
) {
	return category.settings.map((setting, index) => (
		<div key={setting.id}>
			{renderSetting(setting, mode, context)}
			{index < category.settings.length - 1 && <Separator />}
		</div>
	));
}

/**
 * Dialog mode: Category navigation sidebar
 */
function CategoryNav({
	categories,
	activeCategory,
	onCategoryChange,
}: {
	categories: SettingCategory[];
	activeCategory: string;
	onCategoryChange: (id: string) => void;
}) {
	return (
		<div className="w-48 border-r bg-muted/20 p-4 overflow-y-auto">
			<nav className="space-y-1">
				{categories.map((category) => {
					const Icon = category.icon;
					const isActive = activeCategory === category.id;
					return (
						<button
							type="button"
							key={category.id}
							onClick={() => onCategoryChange(category.id)}
							className={`
								w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
								${
									isActive
										? "bg-primary text-primary-foreground"
										: "hover:bg-muted text-muted-foreground hover:text-foreground"
								}
							`}
						>
							<Icon className="w-4 h-4 shrink-0" />
							<span className="truncate">{category.label}</span>
						</button>
					);
				})}
			</nav>
		</div>
	);
}

/**
 * Dialog mode: Settings content area
 */
function SettingsContent({
	categories,
	activeCategory,
	context,
}: {
	categories: SettingCategory[];
	activeCategory: string;
	context: SettingsRendererContext;
}) {
	const category = categories.find((c) => c.id === activeCategory);

	if (!category) {
		return <div className="flex-1 p-6">Category not found</div>;
	}

	return (
		<div className="flex-1 overflow-y-auto p-6">
			<div className="space-y-6">
				<div>
					<h3 className="text-lg font-semibold mb-1">{category.label}</h3>
					<p className="text-sm text-muted-foreground">
						{category.description}
					</p>
				</div>

				<Separator />

				<div className="space-y-6">
					{renderCategorySettings(category, "dialog", context)}
				</div>
			</div>
		</div>
	);
}

/**
 * Page mode: Category section (flat layout)
 */
function CategorySection({
	category,
	context,
}: {
	category: SettingCategory;
	context: SettingsRendererContext;
}) {
	const Icon = category.icon;

	// Special handling for About section in page mode
	if (category.id === "about") {
		return (
			<section className="space-y-4">
				<div className="flex items-center gap-2">
					<Icon className="w-5 h-5 text-primary" />
					<h2 className="text-lg font-semibold">{category.label}</h2>
				</div>

				<div className="space-y-0">
					{category.settings.map((setting) =>
						renderSetting(setting, "page", context),
					)}
				</div>
			</section>
		);
	}

	return (
		<section className="space-y-4">
			<div className="flex items-center gap-2">
				<Icon className="w-5 h-5 text-primary" />
				<h2 className="text-lg font-semibold">{category.label}</h2>
			</div>
			<p className="text-sm text-muted-foreground">{category.description}</p>

			{/* Settings within Card or outside based on category */}
			{category.id === "storage" ? (
				<>
					{/* Storage stats outside card */}
					{renderSetting(category.settings[0], "page", context)}
					{/* Clear and Reset buttons inside card */}
					<div className="bg-card border rounded-lg p-4 space-y-4">
						{category.settings.slice(1).map((setting, index) => (
							<div key={setting.id}>
								{renderSetting(setting, "page", context)}
								{index < category.settings.length - 2 && <Separator />}
							</div>
						))}
					</div>
				</>
			) : category.id === "performance" ? (
				<>
					{/* Performance settings in card */}
					<div className="bg-card border rounded-lg p-4 space-y-4">
						{category.settings.slice(0, 2).map((setting, index) => (
							<div key={setting.id}>
								{renderSetting(setting, "page", context)}
								{index < 1 && <Separator />}
							</div>
						))}
					</div>
					{/* Performance tips outside card */}
					{renderSetting(category.settings[2], "page", context)}
				</>
			) : (
				<div className="bg-card border rounded-lg p-4 space-y-4">
					{renderCategorySettings(category, "page", context)}
				</div>
			)}
		</section>
	);
}

/**
 * Main SettingsRenderer component
 */
export function SettingsRenderer({
	mode,
	categories,
	activeCategory = "general",
	onCategoryChange = () => {},
	context,
}: SettingsRendererProps) {
	if (mode === "dialog") {
		return (
			<div className="flex h-full">
				<CategoryNav
					categories={categories}
					activeCategory={activeCategory}
					onCategoryChange={onCategoryChange}
				/>
				<SettingsContent
					categories={categories}
					activeCategory={activeCategory}
					context={context}
				/>
			</div>
		);
	}

	if (mode === "page") {
		return (
			<div className="space-y-8">
				{categories.map((category) => (
					<CategorySection
						key={category.id}
						category={category}
						context={context}
					/>
				))}
			</div>
		);
	}

	return null;
}
