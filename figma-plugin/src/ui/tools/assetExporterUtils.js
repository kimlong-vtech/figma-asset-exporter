const GEMINI_MODEL = 'gemma-4-31b-it';
const GEMINI_PREVIEW_MAX_SIZE = 128;
const GEMINI_PREVIEW_QUALITY = 0.72;
const SERVER_BASE_URL = 'http://localhost:32123';

export const DEFAULT_DIR = 'figma-exports';
export const DEFAULT_TYPE = 'png';
export const DEFAULT_SCALE = 2;
export const SERVER_EXPORT_URL = `${SERVER_BASE_URL}/export`;
export const STORAGE_KEY_DIR = 'figma-export-relative-dir';
export const STORAGE_KEY_TYPE = 'figma-export-default-type';
export const STORAGE_KEY_SCALE = 'figma-export-default-scale';

export function readStoredValue(key, fallback) {
	try {
		return window.localStorage.getItem(key) || fallback;
	} catch {
		return fallback;
	}
}

export function writeStoredValue(key, value) {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// Keep the UI usable if storage is unavailable.
	}
}

export function normalizeAssetType(value) {
	const normalizedType = String(value || '').toLowerCase().trim();

	if (normalizedType === 'svg' || normalizedType === 'jpeg') {
		return normalizedType;
	}

	return DEFAULT_TYPE;
}

export function getAvailableScalesForType(assetType) {
	return normalizeAssetType(assetType) === 'svg' ? [1] : [1, 2, 3, 4];
}

export function normalizeAssetScale(value, assetType = DEFAULT_TYPE) {
	const numericScale = Number(value);
	const availableScales = getAvailableScalesForType(assetType);

	if (availableScales.includes(numericScale)) {
		return numericScale;
	}

	return availableScales.includes(DEFAULT_SCALE) ? DEFAULT_SCALE : availableScales[0];
}

export async function preparePreviewForGemini(dataUrl) {
	try {
		const resizedDataUrl = await resizeImageDataUrl(dataUrl, GEMINI_PREVIEW_MAX_SIZE, GEMINI_PREVIEW_QUALITY);
		return parseImageDataUrl(resizedDataUrl);
	} catch {
		return parseImageDataUrl(dataUrl);
	}
}

function resizeImageDataUrl(dataUrl, maxDimension, quality) {
	return new Promise((resolve, reject) => {
		const image = new Image();

		image.onload = () => {
			const width = image.naturalWidth || image.width;
			const height = image.naturalHeight || image.height;

			if (!width || !height) {
				reject(new Error('Preview image is empty.'));
				return;
			}

			const scale = Math.min(1, maxDimension / Math.max(width, height));
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(width * scale));
			canvas.height = Math.max(1, Math.round(height * scale));

			const context = canvas.getContext('2d');

			if (!context) {
				reject(new Error('Canvas rendering is unavailable.'));
				return;
			}

			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			resolve(canvas.toDataURL('image/jpeg', quality));
		};

		image.onerror = () => {
			reject(new Error('Unable to resize preview image.'));
		};

		image.src = dataUrl;
	});
}

function parseImageDataUrl(value) {
	const match = String(value || '').match(/^data:(image\/(?:png|jpeg|jpg));base64,(.+)$/);

	if (!match) {
		throw new Error('Preview image format is not supported.');
	}

	return {
		mimeType: match[1] === 'image/jpg' ? 'image/jpeg' : match[1],
		base64: match[2],
	};
}

export function sanitizeDraftName(value) {
	const trimmedValue = String(value || '').trim();

	if (!trimmedValue) {
		return 'assetName';
	}

	return trimmedValue
		.replace(/[^a-zA-Z0-9]+(.)/g, (_, character) => character.toUpperCase())
		.replace(/^[A-Z]/, (character) => character.toLowerCase())
		.replace(/[^a-zA-Z0-9]/g, '') || 'assetName';
}

export function makeUniqueName(baseName, existingNames) {
	const name = String(baseName || 'asset').trim();
	if (!name) {
		return 'assetName';
	}

	if (!existingNames.includes(name)) {
		return name;
	}

	let counter = 1;
	let uniqueName = `${name}-${counter}`;
	while (existingNames.includes(uniqueName)) {
		counter++;
		uniqueName = `${name}-${counter}`;
	}

	return uniqueName;
}

export function getCachedPreviewForScale(asset) {
	if (asset.type === 'svg') return asset.previewUrl1x || asset.previewUrl2x || asset.previewUrl;
	if (asset.scale === 1) return asset.previewUrl1x || asset.previewUrl2x || asset.previewUrl;
	if (asset.scale === 2) return asset.previewUrl2x || asset.previewUrl;
	if (asset.scale >= 3) return asset[`previewUrl${asset.scale}x`] || asset.previewUrl2x || asset.previewUrl;
	return asset.previewUrl2x || asset.previewUrl;
}

export function refreshPreviewAtScale(asset) {
	window.parent.postMessage(
		{
			pluginMessage: {
				type: 'refresh-selection-context',
				nodeId: asset.nodeId,
				scale: asset.scale,
				assetType: asset.type,
			},
		},
		'*',
	);
}

export async function requestGeminiNameSuggestions({
	apiKey,
	nodeName,
	assetType,
	nodePreview,
	existingNames = [],
	lastAttemptedName = null,
}) {
	const contextParts = [];
	if (existingNames.length > 0) {
		contextParts.push(`Existing asset names in queue (do NOT use these): ${existingNames.join(', ')}`);
	}
	if (lastAttemptedName) {
		contextParts.push(`Last attempted name (do NOT use this again): ${lastAttemptedName}`);
	}
	const contextText = contextParts.length > 0 ? '\n\n' + contextParts.join('\n') : '';

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': apiKey,
			},
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{
								text: [
									'You are naming a selected Figma layer.',
									'Use the image to name the asset.',
									'Suggestions must be distinct, concise, descriptive, lowercase camelCase, and must not include file extensions.',
									'Provide 3 different suggestions.',
								].join(' ') + contextText,
							},
							{
								text: `Asset type: ${assetType || DEFAULT_TYPE}. Current node name: ${nodeName || 'unnamedAsset'}.`,
							},
							{
								inline_data: {
									mime_type: nodePreview.mimeType,
									data: nodePreview.base64,
								},
							},
						],
					},
				],
				generationConfig: {
					responseMimeType: 'application/json',
					responseSchema: {
						type: 'object',
						properties: {
							suggestions: {
								type: 'array',
								items: {
									type: 'string',
								},
							},
						},
						required: ['suggestions'],
					},
				},
			}),
		},
	);
	const result = await response.json();

	if (!response.ok) {
		throw new Error(result.error?.message || 'Gemini rename failed.');
	}

	const text = extractGeminiText(result);
	const parsedResult = parseGeminiSuggestions(text);

	return {
		suggestions: parsedResult,
	};
}

function extractGeminiText(result) {
	return (
		result?.candidates?.[0]?.content?.parts
			?.map((part) => part.text || '')
			.join('\n')
			.trim() || ''
	);
}

function parseGeminiSuggestions(text) {
	if (!text) {
		return [];
	}

	try {
		const parsed = JSON.parse(text);
		if (Array.isArray(parsed?.suggestions)) {
			return parsed.suggestions.map(sanitizeDraftName).filter(Boolean);
		}
	} catch {
		const match = text.match(/\{[\s\S]*\}/);
		if (match) {
			try {
				const parsed = JSON.parse(match[0]);
				if (Array.isArray(parsed?.suggestions)) {
					return parsed.suggestions.map(sanitizeDraftName).filter(Boolean);
				}
			} catch {
				return text
					.split('\n')
					.map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
					.filter(Boolean)
					.slice(0, 3)
					.map(sanitizeDraftName)
					.filter(Boolean);
			}
		}
	}

	return text
		.split('\n')
		.map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
		.filter(Boolean)
		.slice(0, 3)
		.map(sanitizeDraftName)
		.filter(Boolean);
}
