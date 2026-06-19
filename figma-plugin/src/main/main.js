export default function () {
	figma.showUI(__html__, { width: 420, height: 720, themeColors: true });
	postSelectionState();
	figma.on('selectionchange', postSelectionState);

	figma.ui.onmessage = async (message) => {
		try {
			if (message.type === 'capture-selection') {
				const selection = await getCurrentSelectionAssets();
				figma.ui.postMessage({
					type: 'selection-captured',
					...selection,
				});
				return;
			}

			if (message.type === 'refresh-selection-context') {
				const preview = await getSelectionContextByNodeId(message.nodeId, message.scale);
				figma.ui.postMessage({
					type: 'selection-context-refreshed',
					...preview,
					requestedScale: message.scale,
				});
				return;
			}

			if (message.type === 'request-selection-state') {
				postSelectionState();
				return;
			}

			if (message.type === 'export-queue') {
				const assets = await exportQueuedAssets(message.assets, message.relativeDir);
				figma.ui.postMessage({
					type: 'asset-queue-ready',
					assets,
				});
			}

			if (message.type === 'load-gemini-key') {
				const storedKey = await figma.clientStorage.getAsync('geminiApiKey');
				figma.ui.postMessage({
					type: 'gemini-key-loaded',
					apiKey: storedKey || '',
				});
				return;
			}

			if (message.type === 'load-exporter-settings') {
				const storedSettings = await figma.clientStorage.getAsync('assetExporterSettings');
				figma.ui.postMessage({
					type: 'exporter-settings-loaded',
					settings: sanitizeExporterSettings(storedSettings),
				});
				return;
			}

			if (message.type === 'save-gemini-key') {
				await figma.clientStorage.setAsync('geminiApiKey', message.apiKey);
				return;
			}

			if (message.type === 'save-exporter-settings') {
				const nextSettings = sanitizeExporterSettings(message.settings);
				await figma.clientStorage.setAsync('assetExporterSettings', nextSettings);
				figma.ui.postMessage({
					type: 'exporter-settings-saved',
					settings: nextSettings,
				});
				return;
			}

			if (message.type === 'explain-request') {
				await handleExplainRequest(message, figma.ui);
				return;
			}
		} catch (error) {
			if (message.type === 'refresh-selection-context') {
				figma.ui.postMessage({
					type: 'preview-error',
					nodeId: message.nodeId,
					requestedScale: message.scale,
					error: error instanceof Error ? error.message : 'Plugin action failed.',
				});
				return;
			}

			figma.ui.postMessage({
				type: mapErrorType(message.type),
				error: error instanceof Error ? error.message : 'Plugin action failed.',
			});
		}
	};
}

async function getCurrentSelectionAssets() {
	const selectedNodes = getSelectedExportableNodes();
	const assets = selectedNodes.map((node) => buildSelectionStub(node));

	return {
		assets,
		selectedCount: figma.currentPage.selection.length,
	};
}

async function getSelectionContextByNodeId(nodeId, scale = 2) {
	const node = await getExportableNode(nodeId);
	return buildSelectionContext(node, scale);
}

function buildSelectionStub(node) {
	return {
		nodeId: node.id,
		name: node.name || 'figmaAsset',
		width: getRoundedDimension(node.width, 1),
		height: getRoundedDimension(node.height, 1),
	};
}

async function buildSelectionContext(node, scale = 2) {
	const preview = await exportNodePreview(node, scale);
	const preview2x = scale === 2 ? preview : await exportNodePreview(node, 2);

	return {
		nodeId: node.id,
		name: node.name || 'figmaAsset',
		previewUrl: preview.previewUrl,
		previewUrl2x: preview2x.previewUrl,
		width: preview.width,
		height: preview.height,
	};
}

async function exportQueuedAssets(assets, relativeDir) {
	if (!Array.isArray(assets) || assets.length === 0) {
		throw new Error('Add at least one asset before exporting.');
	}

	const exportedAssets = [];

	for (const asset of assets) {
		const node = await getExportableNode(asset.nodeId);
		const format = normalizeFormat(asset.type);
		const bytes = await node.exportAsync({
			format,
			constraint: {
				type: 'SCALE',
				value: normalizeScale(asset.scale),
			},
		});

		exportedAssets.push({
			fileName: sanitizeFileName(asset.name || node.name || 'figma-asset'),
			extension: asset.type,
			relativeDir: buildRelativeDir(relativeDir),
			base64Data: bytesToBase64(bytes),
		});
	}

	return exportedAssets;
}

async function handleExplainRequest(message, ui) {
	const { prompt, apiKey, assets, textOnly } = message;

	if (!assets || !assets.length) {
		ui.postMessage({ type: 'explain-response', error: 'No assets selected.' });
		return;
	}

	try {
		const node = await getNodeById(assets[0].nodeId);
		const textContent = getTextContent(node);

		// Send initial ready message
		ui.postMessage({ type: 'explain-start', previewUrl: null });

		if (textContent && textOnly) {
			// Text only mode - just translate/explain the text directly
			await callGeminiTextAPI(apiKey, prompt, textContent, ui);
		} else if (textContent) {
			// Text node with image context
			const bytes = await node.exportAsync({
				format: 'PNG',
				constraint: { type: 'SCALE', value: 2 },
			});
			const base64Image = bytesToBase64(bytes);
			await callGeminiAPI(apiKey, prompt, base64Image, ui);
		} else {
			// Image only
			const bytes = await node.exportAsync({
				format: 'PNG',
				constraint: { type: 'SCALE', value: 2 },
			});
			const base64Image = bytesToBase64(bytes);
			await callGeminiAPI(apiKey, prompt, base64Image, ui);
		}
	} catch (error) {
		ui.postMessage({ type: 'explain-response', error: error.message || 'Failed to analyze.' });
	}
}

const GEMINI_MODEL = 'gemma-4-31b-it';

async function callGeminiAPI(apiKey, prompt, base64Image, ui) {
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-goog-api-key': apiKey,
		},
		body: JSON.stringify({
			contents: [{ parts: [
				{ text: prompt },
				{ inline_data: { mime_type: 'image/png', data: base64Image } }
			]}]
		}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error?.message || `API error: ${response.status}`);
	}

	const data = await response.json();
	const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
	ui.postMessage({ type: 'explain-response', response: text });
}

async function callGeminiTextAPI(apiKey, prompt, textContent, ui) {
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-goog-api-key': apiKey,
		},
		body: JSON.stringify({
			contents: [{ parts: [
				{ text: `${prompt} ${textContent}` }
			]}]
		}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error?.message || `API error: ${response.status}`);
	}

	const data = await response.json();
	const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
	ui.postMessage({ type: 'explain-response', response: text });
}

function getTextContent(node) {
	// Figma text nodes have characters property
	if (node && typeof node.characters === 'string' && node.characters.trim().length > 0) {
		return node.characters.trim();
	}
	return null;
}

async function getNodeById(nodeId) {
	const node = await figma.getNodeByIdAsync(nodeId);
	if (!node) {
		throw new Error('Node not found.');
	}
	return node;
}

async function exportNodePreview(node, scale = 2) {
	const bytes = await node.exportAsync({
		format: 'PNG',
		constraint: {
			type: 'SCALE',
			value: normalizeScale(scale),
		},
	});
	const width = getRoundedDimension(node.width, scale);
	const height = getRoundedDimension(node.height, scale);

	return {
		previewUrl: `data:image/png;base64,${bytesToBase64(bytes)}`,
		width,
		height,
	};
}

function getSelectedExportableNodes() {
	const selectedNodes = figma.currentPage.selection;

	if (!selectedNodes.length) {
		throw new Error('Select at least one layer in Figma to continue.');
	}

	const exportableNodes = selectedNodes.filter((node) => typeof node.exportAsync === 'function');

	if (!exportableNodes.length) {
		throw new Error('None of the selected layers can be exported as images.');
	}

	return exportableNodes;
}

async function getExportableNode(nodeId) {
	const node = await figma.getNodeByIdAsync(nodeId);

	if (!node) {
		throw new Error('The referenced Figma layer is no longer available.');
	}

	if (typeof node.exportAsync !== 'function') {
		throw new Error('This Figma layer cannot be exported as an image.');
	}

	return node;
}


function buildRelativeDir(relativeDir) {
	return typeof relativeDir === 'string' && relativeDir.trim() ? relativeDir.trim() : 'figma-exports';
}

function sanitizeFileName(value) {
	return String(value)
		.trim()
		.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '') || 'figma-asset';
}

function normalizeScale(value) {
	const numericScale = Number(value);

	if (!Number.isFinite(numericScale) || numericScale <= 0) {
		return 2;
	}

	return numericScale;
}

function normalizeFormat(type) {
	const normalizedType = String(type || '').toLowerCase().trim();

	if (normalizedType === 'svg') {
		return 'SVG';
	}

	if (normalizedType === 'jpeg' || normalizedType === 'jpg') {
		return 'JPEG';
	}

	return 'PNG';
}

function getRoundedDimension(value, scale) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return 0;
	}

	return Math.max(1, Math.round(value * normalizeScale(scale)));
}

function sanitizeExporterSettings(settings) {
	const nextSettings = settings && typeof settings === 'object' ? settings : {};
	const defaultType = normalizeExporterType(nextSettings.defaultType);

	return {
		relativeDir: typeof nextSettings.relativeDir === 'string' && nextSettings.relativeDir.trim()
			? nextSettings.relativeDir.trim()
			: 'figma-exports',
		defaultType,
		defaultScale: normalizeExporterScale(nextSettings.defaultScale, defaultType),
		autoAIRename: nextSettings.autoAIRename === true,
	};
}

function normalizeExporterType(value) {
	const normalizedType = String(value || '').toLowerCase().trim();

	if (normalizedType === 'svg' || normalizedType === 'jpeg') {
		return normalizedType;
	}

	return 'png';
}

function normalizeExporterScale(value, assetType = 'png') {
	const numericScale = Number(value);
	const availableScales = assetType === 'svg' ? [1] : [1, 2, 3, 4];

	if (availableScales.includes(numericScale)) {
		return numericScale;
	}

	return assetType === 'svg' ? 1 : 2;
}

function mapErrorType(actionType) {
	if (actionType === 'capture-selection') {
		return 'selection-error';
	}

	if (actionType === 'refresh-selection-context') {
		return 'preview-error';
	}

	if (actionType === 'load-exporter-settings' || actionType === 'save-exporter-settings') {
		return 'settings-error';
	}

	if (actionType === 'explain-request') {
		return 'explain-error';
	}

	return 'export-error';
}

function postSelectionState() {
	const selectedNodes = figma.currentPage.selection;
	const selectedCount = selectedNodes.length;
	const exportableCount = selectedNodes.filter((node) => typeof node.exportAsync === 'function').length;
	const hasTextNode = selectedNodes.some((node) => node && typeof node.characters === 'string' && node.characters.trim().length > 0);

	figma.ui.postMessage({
		type: 'selection-state-updated',
		selectedCount,
		exportableCount,
		hasTextNode,
	});
}

function bytesToBase64(bytes) {
	let binary = '';
	const chunkSize = 0x8000;

	for (let index = 0; index < bytes.length; index += chunkSize) {
		const chunk = bytes.subarray(index, index + chunkSize);
		binary += String.fromCharCode(...chunk);
	}

	return btoa(binary);
}
