import { Button } from '../components/Button.jsx';
import { Chip, ChipList } from '../components/Chip.jsx';
import { FloatingAlert } from '../components/FloatingAlert.jsx';
import { Panel } from '../components/Panel.jsx';
import { useExplainTool } from './useExplainTool.js';

export function ExplainTool({ onBack, onOpenSettings, geminiApiKey }) {
	const {
		promptMode,
		setPromptMode,
		customPrompt,
		setCustomPrompt,
		response,
		isLoading,
		error,
		previewUrl,
		selectionState,
		captureAndExplain,
		clearResponse,
		promptModes,
		promptLabels,
		hasTextNode,
		sendTextOnly,
		setSendTextOnly,
	} = useExplainTool({ geminiApiKey });

	const hasGeminiKey = geminiApiKey?.trim();
	const canExplain = selectionState.selectedCount > 0 && hasGeminiKey;
	const hasResponse = response.length > 0;

	const handleExplain = () => {
		if (!hasGeminiKey) {
			onOpenSettings();
			return;
		}
		captureAndExplain();
	};

	return (
		<div className="flex flex-col gap-3">
			{error && (
				<FloatingAlert
					message={error}
					tone="error"
					onDismiss={clearResponse}
				/>
			)}

			<div className="flex items-center justify-between gap-2.5">
				<div className="flex items-center gap-2">
					<button
						onClick={onBack}
						className="inline-flex h-7 w-7 items-center justify-center rounded-full border-none bg-transparent p-0 text-[var(--figma-color-text-secondary)] transition-colors hover:bg-[var(--figma-color-bg-secondary)] hover:text-[var(--figma-color-text)]"
						aria-label="Back to tools"
					>
						<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					</button>
					<h1 className="m-0 text-[18px] font-bold leading-[1.15]">Explain</h1>
				</div>
				<Button variant="ghost" onClick={onOpenSettings}>
					Settings
				</Button>
			</div>

			<Panel variant="accent">
				<div className="flex flex-col gap-3">
					<div>
						<h2 className="m-0 text-[13px] font-bold leading-[1.15]">Select Prompt Type</h2>
						<p className="m-0 mt-1 text-[11px] leading-[1.4] text-[var(--figma-color-text-secondary)]">
							Choose how to analyze the selected UI elements.
						</p>
					</div>

					<ChipList>
						<Chip
							label={promptLabels[promptModes.EXPLAIN_UI]}
							active={promptMode === promptModes.EXPLAIN_UI}
							onClick={() => setPromptMode(promptModes.EXPLAIN_UI)}
						/>
						<Chip
							label={promptLabels[promptModes.TRANSLATE_UI]}
							active={promptMode === promptModes.TRANSLATE_UI}
							onClick={() => setPromptMode(promptModes.TRANSLATE_UI)}
						/>
						<Chip
							label={promptLabels[promptModes.CUSTOM]}
							active={promptMode === promptModes.CUSTOM}
							onClick={() => setPromptMode(promptModes.CUSTOM)}
						/>
					</ChipList>

					{hasTextNode && (
						<label className="flex items-center gap-2 text-[11px] text-[var(--figma-color-text-secondary)] cursor-pointer">
							<input
								type="checkbox"
								checked={sendTextOnly}
								onChange={(e) => setSendTextOnly(e.target.checked)}
								className="w-3.5 h-3.5 rounded border-[var(--figma-color-border)]"
							/>
							Send text only (faster)
						</label>
					)}

					{promptMode === promptModes.CUSTOM && (
						<div className="flex flex-col gap-1.5">
							<label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--figma-color-text-secondary)]">
								Custom Prompt
							</label>
							<textarea
								value={customPrompt}
								onChange={(e) => setCustomPrompt(e.target.value)}
								placeholder="Enter your prompt..."
								className="min-h-[80px] w-full resize-none rounded-[10px] border border-[var(--figma-color-border)] bg-[var(--figma-color-bg)] p-[10px] text-[11px] leading-[1.4] placeholder:text-[var(--figma-color-text-tertiary)] focus:border-[var(--figma-color-bg-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--figma-color-bg-brand)]"
							/>
						</div>
					)}

					<Button
						variant="primary"
						onClick={handleExplain}
						disabled={isLoading || !canExplain}
					>
						{isLoading ? 'Analyzing...' : 'Explain Selection'}
					</Button>

					{!hasGeminiKey && (
						<p className="m-0 text-[10px] text-[var(--figma-color-text-secondary)]">
							Configure your Gemini API key in Settings to use this feature.
						</p>
					)}
				</div>
			</Panel>

			{(hasResponse || isLoading) && (
				<Panel>
					<div className="flex items-center justify-between mb-3">
						<h2 className="m-0 text-[13px] font-bold leading-[1.15]">Analysis Result</h2>
						{!isLoading && (
							<button
								onClick={clearResponse}
								className="inline-flex h-6 w-6 items-center justify-center rounded-full border-none bg-transparent p-0 text-[var(--figma-color-text-secondary)] transition-colors hover:bg-[var(--figma-color-bg-tertiary)] hover:text-[var(--figma-color-text)]"
								title="Clear"
							>
								<svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
									<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
								</svg>
							</button>
						)}
					</div>

					{previewUrl && (
						<div className="mb-3 flex justify-center">
							<img
								src={previewUrl}
								alt="Selected UI"
								className="max-h-[120px] rounded-lg object-contain"
							/>
						</div>
					)}

					<div className="text-[13px] leading-[1.6] text-[var(--figma-color-text)] whitespace-pre-wrap">
						{isLoading && response.length === 0 ? (
							<span className="text-[var(--figma-color-text-secondary)]">Analyzing...</span>
						) : (
							response
						)}
						{isLoading && response.length > 0 && (
							<span className="ml-1 inline-block w-2 h-3 bg-[var(--figma-color-text-secondary)] animate-pulse" />
						)}
					</div>
				</Panel>
			)}
		</div>
	);
}
