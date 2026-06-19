import { Button } from '../components/Button.jsx';
import { FloatingAlert } from '../components/FloatingAlert.jsx';
import { Modal } from '../components/Modal.jsx';
import { Panel } from '../components/Panel.jsx';
import { AssetRow } from '../components/AssetRow.jsx';
import { useAssetExporter } from './useAssetExporter.js';

export function AssetExporterTool({ onBack, geminiApiKey, exporterSettings }) {
	const {
		DEFAULT_DIR,
		alert,
		assets,
		confirmAction,
		currentSelectionLabel,
		defaultAssetScale,
		defaultAssetType,
		dismissAlert,
		editingAssetId,
		exportProgress,
		isAdding,
		isExporting,
		previewAsset,
		relativeDir,
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
	} = useAssetExporter({ geminiApiKey, exporterSettings });

	const exportProgressPercent = exportProgress.total > 0
		? Math.max(8, Math.min(100, Math.round((exportProgress.current / exportProgress.total) * 100)))
		: 8;

	return (
		<div className="flex flex-col gap-3">
			{alert ? (
				<FloatingAlert
					message={alert.message}
					tone={alert.tone}
					onDismiss={dismissAlert}
				/>
			) : null}

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
					<h1 className="m-0 text-[18px] font-bold leading-[1.15]">Asset Exporter</h1>
				</div>
			</div>

			<Panel variant="accent">
				<div className="flex items-center justify-between gap-2">
					<div className="min-w-0">
						<h2 className="m-0 text-[13px] font-bold leading-[1.15]">{currentSelectionLabel}</h2>
						<p className="m-0 mt-1 text-[11px] leading-[1.4] text-[var(--figma-color-text-secondary)]">
							Exports to <span className="font-medium text-[var(--figma-color-text)]">{relativeDir || DEFAULT_DIR}</span> using {defaultAssetType} at {defaultAssetScale}x by default.
						</p>
					</div>
					<Button variant="primary" onClick={handleAddAsset} disabled={isAdding || selectionState.exportableCount === 0}>
						{isAdding
							? 'Adding...'
							: selectionState.exportableCount > 1
								? `Add ${selectionState.exportableCount}`
								: 'Add'}
					</Button>
				</div>
			</Panel>

			<Panel>
				<div className="flex items-center justify-between gap-2.5 mb-3">
					<div>
						<p className="m-0 mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--figma-color-text-secondary)]">
							Assets
						</p>
						<h2 className="m-0 text-[14px] font-bold leading-[1.15]">{selectedCountLabel}</h2>
					</div>
					<div className="flex gap-2">
						<Button
							variant="ghost"
							onClick={() => setConfirmAction('clear')}
							disabled={assets.length === 0}
						>
							Clear
						</Button>
						<Button
							variant="primary"
							onClick={() => setConfirmAction('export')}
							disabled={isExporting || assets.length === 0}
						>
							{isExporting ? 'Exporting...' : 'Export'}
						</Button>
					</div>
				</div>

				{assets.length === 0 ? (
					<p className="m-0 text-[var(--figma-color-text-secondary)] leading-6">
						Added assets will show up here with inline editing and hover preview.
					</p>
				) : (
					<div className="flex flex-col gap-2.5">
						{assets.map((asset) => (
							<AssetRow
								key={asset.id}
								asset={asset}
								isEditing={editingAssetId === asset.id}
								onStartEdit={() => setEditingAssetId(asset.id)}
								onCancelEdit={handleCancelAssetEdit}
								onSaveEdit={handleSaveAssetEdit}
								onRemove={handleRemoveAsset}
								onAIRename={handleAIRename}
								onPreview={() => handlePreviewAsset(asset)}
							/>
						))}
					</div>
				)}
			</Panel>

			{confirmAction && (
				<Modal>
					<div className="flex flex-col gap-3">
						<p className="m-0 text-[14px] font-bold leading-[1.15]">
							{confirmAction === 'clear'
								? `Clear all ${assets.length} asset${assets.length === 1 ? '' : 's'}?`
								: `Export ${assets.length} asset${assets.length === 1 ? '' : 's'} to "${relativeDir}"?`}
						</p>
						<div className="flex gap-2 justify-end">
							<Button variant="ghost" onClick={() => setConfirmAction(null)}>
								Cancel
							</Button>
							<Button
								variant="primary"
								onClick={() => {
									if (confirmAction === 'clear') {
										handleClearQueue();
									} else {
										handleExportQueue();
										setConfirmAction(null);
									}
								}}
							>
								Confirm
							</Button>
						</div>
					</div>
				</Modal>
			)}

			{previewAsset && (
				<Modal>
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<p className="m-0 text-[14px] font-bold leading-[1.15]">{previewAsset.name}</p>
							<button
								className="min-h-[28px] px-2 rounded-full cursor-pointer transition-colors inline-flex items-center justify-center text-[var(--figma-color-text-secondary)] hover:bg-[var(--figma-color-bg-tertiary)] hover:text-[var(--figma-color-text)]"
								onClick={() => setPreviewAsset(null)}
								title="Close"
							>
								<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
									<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
								</svg>
							</button>
						</div>
						<div className="relative min-h-[200px] max-h-[70vh] overflow-auto rounded-lg bg-[var(--figma-color-bg-secondary)]">
							{previewAsset.currentPreviewUrl ? (
								<div className="flex min-h-[200px] min-w-full items-center justify-center p-3">
									<img
										src={previewAsset.currentPreviewUrl}
										alt="Asset preview"
										className="block h-auto w-auto max-w-full object-contain"
										style={{
											maxHeight: 'calc(70vh - 120px)',
											transform: `scale(${previewAsset.zoom || 1})`,
											transformOrigin: 'center center',
										}}
									/>
								</div>
							) : (
								<div className="flex items-center justify-center text-[var(--figma-color-text-secondary)] text-[12px]">
									Loading preview...
								</div>
							)}
						</div>
						<div className="flex items-center justify-center gap-2">
							<button
								className="min-h-[28px] px-2 rounded-full cursor-pointer transition-colors inline-flex items-center justify-center text-[var(--figma-color-text-secondary)] hover:bg-[var(--figma-color-bg-tertiary)] hover:text-[var(--figma-color-text)] border border-[var(--figma-color-border)]"
								onClick={() => setPreviewAsset((asset) => ({ ...asset, zoom: Math.max(0.5, (asset.zoom || 1) - 0.25) }))}
								title="Zoom out"
							>
								<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
									<circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
									<path d="M5 7h4M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
								</svg>
							</button>
							<span className="text-[11px] text-[var(--figma-color-text-secondary)] min-w-[40px] text-center">
								{Math.round((previewAsset.zoom || 1) * 100)}%
							</span>
							<button
								className="min-h-[28px] px-2 rounded-full cursor-pointer transition-colors inline-flex items-center justify-center text-[var(--figma-color-text-secondary)] hover:bg-[var(--figma-color-bg-tertiary)] hover:text-[var(--figma-color-text)] border border-[var(--figma-color-border)]"
								onClick={() => setPreviewAsset((asset) => ({ ...asset, zoom: Math.min(4, (asset.zoom || 1) + 0.25) }))}
								title="Zoom in"
							>
								<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
									<circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
									<path d="M5 7h4M7 5v4M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
								</svg>
							</button>
							<button
								className="min-h-[28px] px-2 rounded-full cursor-pointer transition-colors inline-flex items-center justify-center text-[var(--figma-color-text-secondary)] hover:bg-[var(--figma-color-bg-tertiary)] hover:text-[var(--figma-color-text)] border border-[var(--figma-color-border)]"
								onClick={() => setPreviewAsset((asset) => ({ ...asset, zoom: 1 }))}
								title="Reset zoom"
							>
								<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
									<rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
									<path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
								</svg>
							</button>
						</div>
					</div>
				</Modal>
			)}

			{isExporting && exportProgress.visible ? (
				<Modal>
					<div className="flex flex-col gap-3">
						<div>
							<p className="m-0 mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--figma-color-text-secondary)]">
								Exporting
							</p>
							<h3 className="m-0 text-[15px] font-bold leading-[1.2]">
								{exportProgress.current >= exportProgress.total && exportProgress.total > 0
									? 'Finishing export...'
									: `Exporting ${exportProgress.total} asset${exportProgress.total === 1 ? '' : 's'}`}
							</h3>
						</div>
						<div className="h-2 overflow-hidden rounded-full bg-[var(--figma-color-bg-secondary)]">
							<div
								className="h-full rounded-full bg-[var(--figma-color-bg-brand)] transition-[width] duration-200 ease-out"
								style={{ width: `${exportProgressPercent}%` }}
							/>
						</div>
						<div className="flex items-center justify-between gap-2 text-[11px] leading-[1.4] text-[var(--figma-color-text-secondary)]">
							<p className="m-0">{exportProgress.detail}</p>
							<p className="m-0 whitespace-nowrap">
								{Math.min(exportProgress.current, exportProgress.total)} / {exportProgress.total}
							</p>
						</div>
					</div>
				</Modal>
			) : null}
		</div>
	);
}
