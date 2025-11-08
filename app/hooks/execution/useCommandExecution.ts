import { useFFmpegWebStore } from "../../store/ffmpegWeb";
import { useTaskStore } from "../../store/task";

/**
 * Hook for command execution state and controls
 * Consolidates command-related state from multiple stores
 */
export function useCommandExecution() {
	// Get state from stores
	const selectedPreset = useFFmpegWebStore((state) => state.selectedPreset);
	const formValues = useFFmpegWebStore((state) => state.formValues);
	const copiedCommand = useFFmpegWebStore((state) => state.copiedCommand);
	const setFormValues = useFFmpegWebStore((state) => state.setFormValues);

	return {
		selectedPreset,
		formValues,
		copiedCommand,
		setFormValues,
	};
}
