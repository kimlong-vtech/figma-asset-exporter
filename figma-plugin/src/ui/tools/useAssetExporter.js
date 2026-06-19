import { useEffect, useMemo, useRef, useState } from 'react';
import {
	DEFAULT_DIR,
	SERVER_EXPORT_URL,
	getCachedPreviewForScale,
	makeUniqueName,
	normalizeAssetScale,
	normalizeAssetType,
	preparePreviewForGemini,
	refreshPreviewAtScale,
	requestGeminiNameSuggestions,
	sanitizeDraftName,
} from './assetExporterUtils.js';

export function useAssetExporter({ geminiApiKey, exporterSettings }) {
	const [relativeDir, setRelativeDir] = useState(() => exporterSettings.relativeDir || DEFAULT_DIR);
	const [defaultAssetType, setDefaultAssetType] = useState(() =>
		normalizeAssetType(exporterSettings.defaultType),
	);
	const [defaultAssetScale, setDefaultAssetScale] = useState(() =>
		normalizeAssetScale(exporterSettings.defaultScale, exporterSettings.defaultType),
	);
	const [isAdding, setIsAdding] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [confirmAction, setConfirmAction] = useState(null);
	const [assets, setAssets] = useState([]);
	const assetsRef = useRef([]);
	const alertTimeoutRef = useRef(null);
	const [editingAssetId, setEditingAssetId] = useState(null);
	const [previewAsset, setPreviewAsset] = useState(null);
	const [selectionState, setSelectionState] = useState({ selectedCount: 0, exportableCount: 0 });
	const [alert, setAlert] = useState(null);
	const [exportProgress, setExportProgress] = useState({
		current: 0,
		detail: '',
		total: 0,
		visible: false,
	});

	const selectedCountLabel = useMemo(() => {
		if (assets.length === 1) {
			return '1 asset';
		}

		return `${assets.length} assets`;
	}, [assets.length]);

	const currentSelectionLabel = useMemo(() => {
		if (selectionState.selectedCount === 0) {
			return 'No layers selected';
		}

		if (selectionState.selectedCount === 1) {
			return '1 layer selected';
		}

		return `${selectionState.selectedCount} layers selected`;
	}, [selectionState.selectedCount]);

	useEffect(() => {
		assetsRef.current = assets;
	}, [assets]);

	useEffect(() => () => {
		if (alertTimeoutRef.current) {
			window.clearTimeout(alertTimeoutRef.current);
		}
	}, []);

	useEffect(() => {
		const nextType = normalizeAssetType(exporterSettings.defaultType);
		setRelativeDir(exporterSettings.relativeDir || DEFAULT_DIR);
		setDefaultAssetType(nextType);
		setDefaultAssetScale(normalizeAssetScale(exporterSettings.defaultScale, nextType));
	}, [exporterSettings]);

	useEffect(() => {
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'request-selection-state',
				},
			},
			'*',
		);
	}, []);

	const wait = (ms) => new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});

	const dismissAlert = () => {
		if (alertTimeoutRef.current) {
			window.clearTimeout(alertTimeoutRef.current);
			alertTimeoutRef.current = null;
		}
		setAlert(null);
	};

	const showAlert = (message, tone = 'info', duration = 4200) => {
		dismissAlert();
		setAlert({
			id: `${Date.now()}`,
			message,
			tone,
		});

		if (duration > 0) {
			alertTimeoutRef.current = window.setTimeout(() => {
				setAlert(null);
				alertTimeoutRef.current = null;
			}, duration);
		}
	};

	const requestGeminiNameSuggestionsWithRetry = async (params, maxAttempts = 3) => {
		let lastError = null;

		for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
			try {
				return await requestGeminiNameSuggestions(params);
			} catch (error) {
				lastError = error;
				if (attempt < maxAttempts) {
					await wait(1000);
				}
			}
		}

		throw lastError instanceof Error ? lastError : new Error('AI rename failed.');
	};

	useEffect(() => {
		const handleMessage = async (event) => {
			const message = event.data?.pluginMessage;

			if (!message) {
				return;
			}

			if (message.type === 'selection-state-updated') {
				setSelectionState({
					selectedCount: Number(message.selectedCount) || 0,
					exportableCount: Number(message.exportableCount) || 0,
				});
				return;
			}

			if (message.type === 'selection-captured') {
				setIsAdding(false);
				const incomingAssets = Array.isArray(message.assets) ? message.assets : [];
				if (!incomingAssets.length) {
					return;
				}

				const existingNodeIds = new Set(assetsRef.current.map((asset) => asset.nodeId));
				const existingNames = assetsRef.current.map((asset) => asset.name);
				const nextAssets = [];
				let duplicateCount = 0;

				incomingAssets.forEach((capturedAsset, index) => {
					if (existingNodeIds.has(capturedAsset.nodeId)) {
						duplicateCount += 1;
						return;
					}

					const baseName = sanitizeDraftName(capturedAsset.name);
					const uniqueName = makeUniqueName(
						baseName,
						existingNames.concat(nextAssets.map((asset) => asset.name)),
					);
					const nextAsset = {
						nodeId: capturedAsset.nodeId,
						name: uniqueName,
						type: defaultAssetType,
						scale: normalizeAssetScale(defaultAssetScale, defaultAssetType),
						previewUrl: capturedAsset.previewUrl2x || capturedAsset.previewUrl || '',
						previewUrl2x: capturedAsset.previewUrl2x || capturedAsset.previewUrl || '',
						width: capturedAsset.width,
						height: capturedAsset.height,
						id: `${capturedAsset.nodeId}-${Date.now()}-${index}`,
						status: 'processing',
					};

					existingNodeIds.add(capturedAsset.nodeId);
					nextAssets.push(nextAsset);
				});

				if (!nextAssets.length) {
					if (duplicateCount > 0) {
						showAlert('Asset already existed', 'error');
					}
					return;
				}

				setAssets((currentAssets) => [...nextAssets, ...currentAssets]);

				if (duplicateCount > 0) {
					showAlert('Asset already existed', 'error');
				}

				nextAssets.forEach((nextAsset) => {
					refreshPreviewAtScale(nextAsset);
				});
				return;
			}

			if (message.type === 'selection-context-refreshed') {
				const { nodeId, previewUrl, requestedScale } = message;
				const asset = assetsRef.current.find((currentAsset) => currentAsset.nodeId === nodeId);

				if (!asset) {
					return;
				}

				const hasExistingPreview = Boolean(
					asset.previewUrl
					|| asset.previewUrl1x
					|| asset.previewUrl2x
					|| asset[`previewUrl${requestedScale}x`],
				);

				setAssets((currentAssets) =>
					currentAssets.map((currentAsset) => {
						if (currentAsset.nodeId !== nodeId) {
							return currentAsset;
						}

						const updatedAsset = { ...currentAsset };
						if (requestedScale === 1) {
							updatedAsset.previewUrl1x = previewUrl;
						} else if (requestedScale === 2) {
							updatedAsset.previewUrl2x = previewUrl;
						} else {
							updatedAsset[`previewUrl${requestedScale}x`] = previewUrl;
						}

						updatedAsset.previewUrl = updatedAsset.previewUrl2x
							|| updatedAsset.previewUrl1x
							|| updatedAsset.previewUrl
							|| previewUrl;

						if (!geminiApiKey.trim() || exporterSettings.autoAIRename === false) {
							updatedAsset.status = 'ready';
						}

						return updatedAsset;
					}),
				);

				setPreviewAsset((currentPreview) => {
					if (currentPreview && currentPreview.nodeId === nodeId) {
						return { ...currentPreview, currentPreviewUrl: previewUrl };
					}

					return currentPreview;
				});

				if (!hasExistingPreview && geminiApiKey.trim() && exporterSettings.autoAIRename !== false) {
					queueGeminiRename(asset.id, {
						apiKey: geminiApiKey.trim(),
						nodeName: asset.name,
						assetType: asset.type,
						previewUrl,
					});
				}
				return;
			}

			if (message.type === 'asset-queue-ready') {
				setExportProgress((currentProgress) => ({
					...currentProgress,
					detail: 'Uploading assets to VS Code...',
				}));
				await uploadAssetQueue(message.assets);
				return;
			}

			if (message.type === 'preview-error') {
				setAssets((currentAssets) =>
					currentAssets.map((asset) =>
						asset.nodeId === message.nodeId ? { ...asset, status: 'failed' } : asset,
					),
				);
				showAlert(message.error, 'error', 6000);
				return;
			}

			if (message.type === 'selection-error' || message.type === 'export-error') {
				setIsAdding(false);
				setIsExporting(false);
				setExportProgress({
					current: 0,
					detail: '',
					total: 0,
					visible: false,
				});
				showAlert(message.error, 'error', 6000);
			}
		};

		window.addEventListener('message', handleMessage);

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [defaultAssetScale, defaultAssetType, geminiApiKey]);

	const queueGeminiRename = (assetId, { apiKey, nodeName, assetType, previewUrl }) => {
		setAssets((currentAssets) =>
			currentAssets.map((asset) =>
				asset.id === assetId ? { ...asset, status: 'renaming' } : asset,
			),
		);

		preparePreviewForGemini(previewUrl)
			.then((nodePreview) =>
				requestGeminiNameSuggestionsWithRetry({
					apiKey,
					nodeName,
					assetType,
					nodePreview,
					existingNames: assetsRef.current
						.filter((asset) => asset.id !== assetId)
						.map((asset) => asset.name),
					lastAttemptedName: null,
				}),
			)
			.then((result) => {
				const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
				const baseName = suggestions[0] || nodeName;
				const newName = makeUniqueName(
					baseName,
					assetsRef.current.filter((asset) => asset.id !== assetId).map((asset) => asset.name),
				);

				setAssets((currentAssets) =>
					currentAssets.map((asset) =>
						asset.id === assetId
							? { ...asset, name: newName, status: 'ready', nameSuggestions: suggestions }
							: asset,
					),
				);
			})
			.catch(() => {
				setAssets((currentAssets) =>
					currentAssets.map((asset) =>
						asset.id === assetId ? { ...asset, status: 'failed' } : asset,
					),
				);
			});
	};

	const handleAIRename = (assetId, lastAttemptedName = null) => {
		const asset = assetsRef.current.find((currentAsset) => currentAsset.id === assetId);
		if (!asset) {
			return;
		}

		if (!asset.previewUrl2x && !asset.previewUrl) {
			return;
		}

		const effectiveApiKey = geminiApiKey.trim();
		if (!effectiveApiKey) {
			return;
		}

		setAssets((currentAssets) =>
			currentAssets.map((currentAsset) =>
				currentAsset.id === assetId ? { ...currentAsset, status: 'renaming' } : currentAsset,
			),
		);

		preparePreviewForGemini(asset.previewUrl2x || asset.previewUrl)
			.then((nodePreview) =>
				requestGeminiNameSuggestionsWithRetry({
					apiKey: effectiveApiKey,
					nodeName: asset.name,
					assetType: asset.type,
					nodePreview,
					existingNames: assetsRef.current
						.filter((currentAsset) => currentAsset.id !== assetId)
						.map((currentAsset) => currentAsset.name),
					lastAttemptedName,
				}),
			)
			.then((result) => {
				const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
				const baseName = suggestions[0] || asset.name;
				const newName = makeUniqueName(
					baseName,
					assetsRef.current.filter((currentAsset) => currentAsset.id !== assetId).map((currentAsset) => currentAsset.name),
				);

				setAssets((currentAssets) =>
					currentAssets.map((currentAsset) =>
						currentAsset.id === assetId
							? { ...currentAsset, name: newName, status: 'ready', nameSuggestions: suggestions }
							: currentAsset,
					),
				);
			})
			.catch(() => {
				setAssets((currentAssets) =>
					currentAssets.map((currentAsset) =>
						currentAsset.id === assetId ? { ...currentAsset, status: 'failed' } : currentAsset,
					),
				);
			});
	};

	const handleAddAsset = () => {
		setIsAdding(true);
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'capture-selection',
					scale: 2,
				},
			},
			'*',
		);
	};

	const handleSaveAssetEdit = (updatedAsset) => {
		const existingNames = assetsRef.current
			.filter((asset) => asset.id !== updatedAsset.id)
			.map((asset) => asset.name);
		const uniqueName = makeUniqueName(updatedAsset.name, existingNames);

		setAssets((currentAssets) =>
			currentAssets.map((asset) =>
				asset.id === updatedAsset.id
					? { ...asset, name: uniqueName, type: updatedAsset.type, scale: updatedAsset.scale }
					: asset,
			),
		);
		setEditingAssetId(null);
	};

	const handleCancelAssetEdit = () => {
		setEditingAssetId(null);
	};

	const handlePreviewAsset = (asset) => {
		setPreviewAsset({
			...asset,
			currentPreviewUrl: getCachedPreviewForScale(asset),
			zoom: 1,
		});
		refreshPreviewAtScale(asset);
	};

	const handleRemoveAsset = (assetId) => {
		setAssets((currentAssets) => currentAssets.filter((asset) => asset.id !== assetId));
	};

	const handleClearQueue = () => {
		setAssets([]);
		setConfirmAction(null);
	};

	const handleExportQueue = () => {
		if (!assetsRef.current.length) {
			showAlert('Add at least one asset before exporting.', 'warning');
			return;
		}

		const total = assetsRef.current.length;
		setIsExporting(true);
		setExportProgress({
			current: 0,
			detail: `Preparing ${total} asset${total === 1 ? '' : 's'} for export...`,
			total,
			visible: true,
		});
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'export-queue',
					relativeDir,
					assets: assetsRef.current.map((asset) => ({
						nodeId: asset.nodeId,
						name: asset.name,
						type: asset.type,
						scale: asset.scale,
					})),
				},
			},
			'*',
		);
	};

	const uploadAssetQueue = async (queuedAssets) => {
		try {
			const savedPaths = [];
			const total = queuedAssets.length;

			for (const [index, asset] of queuedAssets.entries()) {
				const preparedAsset = asset;

				setExportProgress({
					current: index,
					detail: `Saving ${asset.fileName}.${asset.extension} to VS Code...`,
					total,
					visible: true,
				});

				const response = await fetch(SERVER_EXPORT_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(preparedAsset),
				});
				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || `VS Code rejected ${asset.fileName}.${asset.extension}.`);
				}

				savedPaths.push(result.relativePath);
				setExportProgress({
					current: index + 1,
					detail: `Saved ${index + 1} of ${total} asset${total === 1 ? '' : 's'}.`,
					total,
					visible: true,
				});
			}

			showAlert(`Exported ${savedPaths.length} asset${savedPaths.length === 1 ? '' : 's'} to "${relativeDir}".`, 'success', 5000);
		} catch (error) {
			showAlert(
				error instanceof Error
					? `${error.message}\nMake sure the VS Code extension is running and the workspace folder is open.`
					: 'Export failed.',
				'error',
				7000,
			);
		} finally {
			setIsExporting(false);
			setExportProgress({
				current: 0,
				detail: '',
				total: 0,
				visible: false,
			});
		}
	};

	return {
		DEFAULT_DIR,
		alert,
		assets,
		confirmAction,
		defaultAssetScale,
		defaultAssetType,
		dismissAlert,
		editingAssetId,
		exportProgress,
		isAdding,
		isExporting,
		previewAsset,
		relativeDir,
		currentSelectionLabel,
		selectedCountLabel,
		selectionState,
		setConfirmAction,
		setEditingAssetId,
		setPreviewAsset,
		handleAIRename,
		handleAddAsset,
		handleCancelAssetEdit,
		handleClearQueue,
		handleExportQueue,
		handlePreviewAsset,
		handleRemoveAsset,
		handleSaveAssetEdit,
	};
}
