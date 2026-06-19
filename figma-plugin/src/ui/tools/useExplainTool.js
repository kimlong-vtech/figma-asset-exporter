import { useState, useCallback, useEffect } from 'react';

const PROMPT_MODES = {
	EXPLAIN_UI: 'explain-ui',
	TRANSLATE_UI: 'translate-ui',
	CUSTOM: 'custom',
};

const PROMPT_LABELS = {
	[PROMPT_MODES.EXPLAIN_UI]: 'Explain',
	[PROMPT_MODES.TRANSLATE_UI]: 'Translate',
	[PROMPT_MODES.CUSTOM]: 'Custom',
};

const DEFAULT_PROMPTS = {
	[PROMPT_MODES.EXPLAIN_UI]: 'Explain this UI concisely in 2-3 sentences.',
	[PROMPT_MODES.TRANSLATE_UI]: 'Translate to English:',
};

export function useExplainTool({ geminiApiKey }) {
	const [promptMode, setPromptMode] = useState(PROMPT_MODES.EXPLAIN_UI);
	const [customPrompt, setCustomPrompt] = useState('');
	const [response, setResponse] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [selectionState, setSelectionState] = useState({ selectedCount: 0, exportableCount: 0 });
	const [hasTextNode, setHasTextNode] = useState(false);
	const [sendTextOnly, setSendTextOnly] = useState(false);

	useEffect(() => {
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'request-selection-state',
				},
			},
			'*',
		);

		const handleMessage = (event) => {
			const message = event.data?.pluginMessage;

			if (!message) return;

			if (message.type === 'selection-state-updated') {
				setSelectionState({
					selectedCount: message.selectedCount,
					exportableCount: message.exportableCount,
				});
				setHasTextNode(message.hasTextNode || false);
			}

			if (message.type === 'explain-start') {
				// Streaming started
				setPreviewUrl(message.previewUrl || null);
				return;
			}

			if (message.type === 'explain-stream') {
				// Streaming update
				setResponse(message.text || '');
				return;
			}

			if (message.type === 'explain-response') {
				setIsLoading(false);
				if (message.error) {
					setError(message.error);
				} else {
					setResponse(message.response || '');
				}
				return;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	const captureAndExplain = useCallback(async () => {
		if (!geminiApiKey?.trim()) {
			setError('Please configure your Gemini API key in Settings.');
			return;
		}

		const prompt = promptMode === PROMPT_MODES.CUSTOM
			? customPrompt.trim()
			: DEFAULT_PROMPTS[promptMode];

		if (!prompt.trim()) {
			setError('Please enter a custom prompt.');
			return;
		}

		setIsLoading(true);
		setError(null);
		setResponse('');
		setPreviewUrl(null);

		// Capture the current selection
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'capture-selection',
				},
			},
			'*',
		);

		// Listen for the captured selection
		const handleCapture = (event) => {
			const message = event.data?.pluginMessage;
			if (!message || message.type !== 'selection-captured') return;

			if (message.selectedCount === 0) {
				setIsLoading(false);
				setError('Please select at least one layer in Figma.');
				window.removeEventListener('message', handleCapture);
				return;
			}

			// Use the first asset for preview
			const firstAsset = message.assets?.[0];
			if (firstAsset) {
				window.parent.postMessage(
					{
						pluginMessage: {
							type: 'refresh-selection-context',
							nodeId: firstAsset.nodeId,
							scale: 2,
						},
					},
					'*',
				);
			}

			// Send to explain handler
			window.parent.postMessage(
				{
					pluginMessage: {
						type: 'explain-request',
						prompt,
						apiKey: geminiApiKey.trim(),
						assets: message.assets,
						textOnly: sendTextOnly,
					},
				},
				'*',
			);

			window.removeEventListener('message', handleCapture);
		};

		window.addEventListener('message', handleCapture);

		setTimeout(() => {
			window.removeEventListener('message', handleCapture);
		}, 5000);
	}, [geminiApiKey, promptMode, customPrompt, sendTextOnly]);

	useEffect(() => {
		const handlePreviewLoaded = (event) => {
			const message = event.data?.pluginMessage;
			if (message?.type === 'selection-context-refreshed') {
				setPreviewUrl(message.previewUrl);
			}
		};

		window.addEventListener('message', handlePreviewLoaded);
		return () => window.removeEventListener('message', handlePreviewLoaded);
	}, []);

	const clearResponse = useCallback(() => {
		setResponse('');
		setError(null);
		setPreviewUrl(null);
	}, []);

	return {
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
		promptModes: PROMPT_MODES,
		promptLabels: PROMPT_LABELS,
		hasTextNode,
		sendTextOnly,
		setSendTextOnly,
	};
}
