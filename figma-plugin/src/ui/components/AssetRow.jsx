import { useState } from 'react';

/**
 * AssetRow component - displays a queued asset with view/edit modes
 *
 * @param {object} asset - asset object with id, name, type, scale, status, previewUrl
 * @param {boolean} isEditing - whether this asset is in edit mode
 * @param {function} onStartEdit - () => void - called to enter edit mode
 * @param {function} onCancelEdit - () => void - called to cancel edit mode
 * @param {function} onSaveEdit - (updatedAsset) => void - called to save changes
 * @param {function} onRemove - (assetId) => void
 * @param {function} onAIRename - (assetId) => void - optional AI rename handler
 * @param {function} onPreview - (previewUrl) => void - called when preview image is clicked
 */
export function AssetRow({ asset, isEditing, onStartEdit, onCancelEdit, onSaveEdit, onRemove, onAIRename, onPreview }) {
	const isBusy = asset.status === 'processing' || asset.status === 'renaming';

	// Edit mode - show editable inputs
	if (isEditing) {
		const [editName, setEditName] = useState(asset.name);
		const [editType, setEditType] = useState(asset.type);
		const [editScale, setEditScale] = useState(asset.scale);

		// SVG only supports 1x, PNG/JPEG support 1x-4x
		const availableScales = editType === 'svg' ? [1] : [1, 2, 3, 4];

		// Reset scale if switching to SVG (which only supports 1x)
		const handleTypeChange = (e) => {
			const newType = e.target.value;
			setEditType(newType);
			if (newType === 'svg') {
				setEditScale(1);
			}
		};

		const handleSave = () => {
			onSaveEdit({ ...asset, name: editName, type: editType, scale: editScale });
		};

		return (
			<div className="p-[12px] rounded-[14px] bg-[color-mix(in_srgb,var(--figma-color-bg)_94%,white_2%)] border border-[var(--figma-color-border)]">
				<div className="flex flex-col gap-3">
					{/* Name - full width */}
					<div className="flex flex-col gap-1.5 min-w-0">
						<label
							className="text-[10px] font-bold text-[var(--figma-color-text-secondary)] uppercase tracking-[0.06em]"
							htmlFor={`asset-name-${asset.id}`}
						>
							Name
						</label>
						<input
							id={`asset-name-${asset.id}`}
							className="w-full min-h-[34px] px-[11px] border border-[var(--figma-color-border)] rounded-[10px] bg-[var(--figma-color-bg)] outline-none text-[inherit] font-[inherit] focus:border-[var(--figma-color-bg-brand)] focus:shadow-[0_0_0_1px_var(--figma-color-bg-brand)]"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
						/>
					</div>

					{/* Type and Resolution - side by side */}
					<div className="flex gap-2.5">
						<div className="flex flex-col gap-1.5 min-w-0 flex-1">
							<label
								className="text-[10px] font-bold text-[var(--figma-color-text-secondary)] uppercase tracking-[0.06em]"
								htmlFor={`asset-type-${asset.id}`}
							>
								Type
							</label>
							<select
								id={`asset-type-${asset.id}`}
								className="w-full min-h-[34px] px-[11px] border border-[var(--figma-color-border)] rounded-[10px] bg-[var(--figma-color-bg)] outline-none text-[inherit] font-[inherit] focus:border-[var(--figma-color-bg-brand)] focus:shadow-[0_0_0_1px_var(--figma-color-bg-brand)]"
								value={editType}
								onChange={handleTypeChange}
							>
								<option value="png">png</option>
								<option value="svg">svg</option>
								<option value="jpeg">jpeg</option>
							</select>
						</div>
						<div className="flex flex-col gap-1.5 min-w-0 flex-1">
							<label
								className="text-[10px] font-bold text-[var(--figma-color-text-secondary)] uppercase tracking-[0.06em]"
								htmlFor={`asset-scale-${asset.id}`}
							>
								Resolution
							</label>
							<select
								id={`asset-scale-${asset.id}`}
								className="w-full min-h-[34px] px-[11px] border border-[var(--figma-color-border)] rounded-[10px] bg-[var(--figma-color-bg)] outline-none text-[inherit] font-[inherit] focus:border-[var(--figma-color-bg-brand)] focus:shadow-[0_0_0_1px_var(--figma-color-bg-brand)]"
								value={editScale}
								onChange={(e) => setEditScale(Number(e.target.value))}
							>
								{availableScales.map((scale) => (
									<option key={scale} value={scale}>
										{scale}x
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Cancel and Save - side by side */}
					<div className="flex gap-2">
						<button
							className="min-h-[34px] px-3 rounded-[8px] text-[12px] font-medium cursor-pointer transition-colors inline-flex items-center justify-center bg-[var(--figma-color-bg-secondary)] text-[var(--figma-color-text-secondary)] border border-[var(--figma-color-border)] hover:bg-[var(--figma-color-bg-tertiary)] hover:text-[var(--figma-color-text)]"
							onClick={onCancelEdit}
						>
							Cancel
						</button>
						<button
							className="min-h-[34px] px-3 rounded-[8px] text-[12px] font-medium cursor-pointer transition-colors inline-flex items-center justify-center bg-[var(--figma-color-bg-brand)] text-[var(--figma-color-bg)]"
							onClick={handleSave}
						>
							Save
						</button>
					</div>
				</div>
			</div>
		);
	}

	// View mode - simple display-only list item
	return (
		<div className="relative flex items-center justify-between p-[10px_12px] rounded-[10px] bg-[color-mix(in_srgb,var(--figma-color-bg)_96%,white_1%)] border border-[color-mix(in_srgb,var(--figma-color-border)_60%,white_4%)] hover:border-[var(--figma-color-border)] transition-colors">
			{/* Preview thumbnail */}
			<div className="mr-3 shrink-0">
				<div
					className="w-8 h-8 rounded-md bg-[var(--figma-color-bg-secondary)] flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-[var(--figma-color-bg-brand)] transition-all"
					onClick={() => onPreview && onPreview(asset.previewUrl)}
					title="View full size"
				>
					{asset.previewUrl ? (
						<img src={asset.previewUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
					) : (
						<svg className="w-4 h-4 text-[var(--figma-color-text-tertiary)]" viewBox="0 0 16 16" fill="none">
							<rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
						</svg>
					)}
				</div>
			</div>

			{/* Asset info */}
			<div className="flex-1 min-w-0 flex items-center gap-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-[12px] font-medium text-[var(--figma-color-text)] truncate">
							{asset.name}
						</span>
					</div>
					<div className="text-[10px] text-[var(--figma-color-text-secondary)]">
						{asset.type} · x{asset.scale}
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-1.5 ml-3">
				{isBusy ? (
					<span className="min-h-[28px] px-2 flex items-center gap-1 text-[10px] text-[var(--figma-color-text-secondary)]">
						<svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" fill="none">
							<circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="24" strokeDashoffset="8" />
						</svg>
					</span>
				) : typeof onAIRename === 'function' && (
					<button
						className="min-h-[28px] px-2 rounded-full text-[10px] font-medium cursor-pointer transition-colors inline-flex items-center justify-center text-[var(--figma-color-text-secondary)] hover:bg-[var(--figma-color-bg-tertiary)] hover:text-[var(--figma-color-text)]"
						onClick={() => onAIRename(asset.id, asset.name)}
						title="Retry AI Rename"
					>
						<svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
							<path d="M13 8a5 5 0 11-1.17-3.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
							<path d="M11.5 3.5l.5.5 1 1-1 1-.5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					</button>
				)}
				<button
					className="min-h-[28px] px-2 rounded-full cursor-pointer transition-colors inline-flex items-center justify-center text-[var(--figma-color-text-secondary)] hover:bg-[var(--figma-color-bg-tertiary)] hover:text-[var(--figma-color-text)]"
					onClick={onStartEdit}
					title="Edit Asset"
				>
					<svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
						<path d="M11.5 2.5l2 2L5 13l-2.5.5.5-2.5L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
				<button
					className="min-h-[28px] px-2 rounded-full cursor-pointer transition-colors inline-flex items-center justify-center text-[#c2410c] hover:bg-[rgba(194,65,12,0.1)]"
					onClick={() => onRemove(asset.id)}
					title="Remove Asset"
				>
					<svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
						<path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M12 4v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</button>
			</div>
		</div>
	);
}
