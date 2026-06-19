import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { FieldStack } from '../components/FieldStack.jsx';
import { Panel } from '../components/Panel.jsx';
import {
	DEFAULT_DIR,
	getAvailableScalesForType,
	normalizeAssetScale,
	normalizeAssetType,
} from './assetExporterUtils.js';

export function SettingsTool({
	onBack,
	exporterSettings,
	exporterSaveStatus,
	onSaveExporterSettings,
	geminiApiKey,
	setGeminiApiKey,
	geminiSaveStatus,
	onSaveGeminiKey,
}) {
	const [exportRelativeDir, setExportRelativeDir] = useState(exporterSettings.relativeDir || DEFAULT_DIR);
	const [defaultExportType, setDefaultExportType] = useState(() =>
		normalizeAssetType(exporterSettings.defaultType),
	);
	const [defaultExportScale, setDefaultExportScale] = useState(() =>
		normalizeAssetScale(exporterSettings.defaultScale, exporterSettings.defaultType),
	);

	const scaleOptions = useMemo(() => getAvailableScalesForType(defaultExportType), [defaultExportType]);

	useEffect(() => {
		const nextType = normalizeAssetType(exporterSettings.defaultType);
		setExportRelativeDir(exporterSettings.relativeDir || DEFAULT_DIR);
		setDefaultExportType(nextType);
		setDefaultExportScale(normalizeAssetScale(exporterSettings.defaultScale, nextType));
	}, [exporterSettings]);

	useEffect(() => {
		if (defaultExportType !== 'svg') {
			return;
		}

		setDefaultExportScale(1);
	}, [defaultExportType]);

	const handleSaveExporterSettings = () => {
		const nextDir = exportRelativeDir.trim() || DEFAULT_DIR;
		const nextType = normalizeAssetType(defaultExportType);
		const nextScale = normalizeAssetScale(defaultExportScale, nextType);

		setExportRelativeDir(nextDir);
		setDefaultExportType(nextType);
		setDefaultExportScale(nextScale);
		onSaveExporterSettings({
			relativeDir: nextDir,
			defaultType: nextType,
			defaultScale: nextScale,
		});
	};

	return (
		<div className="flex flex-col gap-3">
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
				<h1 className="m-0 text-[18px] font-bold leading-[1.15]">Settings</h1>
			</div>

			<Panel variant="hero">
				<p className="m-0 text-[var(--figma-color-text-secondary)] leading-6">
					Configure your plugin preferences.
				</p>
			</Panel>

			<Panel>
				<h2 className="m-0 mb-3 text-[13px] font-bold leading-[1.15]">Asset Exporter</h2>
				<p className="m-0 mb-3 text-[var(--figma-color-text-secondary)] leading-5 text-[12px]">
					Choose the default folder, export type, and resolution used when assets are added to the queue.
				</p>
				<div className="flex flex-col gap-3">
					<FieldStack label="Default export folder" htmlFor="asset-export-folder-settings">
						<input
							id="asset-export-folder-settings"
							type="text"
							className="w-full min-h-[34px] px-[11px] border border-[var(--figma-color-border)] rounded-[10px] bg-[color-mix(in_srgb,var(--figma-color-bg)_94%,white_2%)] outline-none text-[inherit] font-[inherit]"
							value={exportRelativeDir}
							onChange={(event) => setExportRelativeDir(event.target.value)}
							placeholder="figma-exports"
						/>
					</FieldStack>
					<div className="flex gap-2.5">
						<FieldStack label="Default type" htmlFor="asset-export-type-settings" className="flex-1">
							<select
								id="asset-export-type-settings"
								className="w-full min-h-[34px] px-[11px] border border-[var(--figma-color-border)] rounded-[10px] bg-[color-mix(in_srgb,var(--figma-color-bg)_94%,white_2%)] outline-none text-[inherit] font-[inherit]"
								value={defaultExportType}
								onChange={(event) => {
									const nextType = normalizeAssetType(event.target.value);
									setDefaultExportType(nextType);
									setDefaultExportScale((currentScale) => normalizeAssetScale(currentScale, nextType));
								}}
							>
								<option value="png">png</option>
								<option value="svg">svg</option>
								<option value="jpeg">jpeg</option>
							</select>
						</FieldStack>
						<FieldStack label="Default resolution" htmlFor="asset-export-scale-settings" className="flex-1">
							<select
								id="asset-export-scale-settings"
								className="w-full min-h-[34px] px-[11px] border border-[var(--figma-color-border)] rounded-[10px] bg-[color-mix(in_srgb,var(--figma-color-bg)_94%,white_2%)] outline-none text-[inherit] font-[inherit]"
								value={defaultExportScale}
								onChange={(event) => setDefaultExportScale(Number(event.target.value))}
							>
								{scaleOptions.map((scale) => (
									<option key={scale} value={scale}>
										{scale}x
									</option>
								))}
							</select>
						</FieldStack>
					</div>
					<p className="m-0 text-[10px] leading-[1.4] text-[var(--figma-color-text-secondary)]">
						The folder is relative to your open VS Code workspace. SVG exports are fixed to 1x.
					</p>
					<div className="flex justify-end">
						<Button variant="primary" onClick={handleSaveExporterSettings} disabled={exporterSaveStatus === 'saving'}>
							{exporterSaveStatus === 'saved'
								? '✓ Saved!'
								: exporterSaveStatus === 'saving'
									? 'Saving...'
									: 'Save exporter defaults'}
						</Button>
					</div>
				</div>
			</Panel>

			<Panel>
				<h2 className="m-0 mb-3 text-[13px] font-bold leading-[1.15]">API Keys</h2>
				<p className="m-0 mb-3 text-[var(--figma-color-text-secondary)] leading-5 text-[12px]">
					Configure API keys for AI-powered features. These keys will be used by all tools that support AI features.
				</p>
				<FieldStack label="Gemini API key" htmlFor="gemini-api-key-settings">
					<div className="flex gap-2.5">
						<input
							id="gemini-api-key-settings"
							type="password"
							className="flex-1 w-full min-h-[34px] px-[11px] border border-[var(--figma-color-border)] rounded-[10px] bg-[color-mix(in_srgb,var(--figma-color-bg)_94%,white_2%)] outline-none text-[inherit] font-[inherit]"
							value={geminiApiKey}
							onChange={(event) => setGeminiApiKey(event.target.value)}
							placeholder="Paste your Gemini API key"
						/>
						<Button variant="primary" onClick={onSaveGeminiKey} disabled={geminiSaveStatus === 'saving'}>
							{geminiSaveStatus === 'saved' ? '✓ Saved!' : geminiSaveStatus === 'saving' ? 'Saving...' : 'Save'}
						</Button>
					</div>
				</FieldStack>
				{geminiApiKey && (
					<p className="m-0 mt-2 text-[10px] leading-[1.4] text-[var(--figma-color-text-secondary)]">
						Gemini API key is configured and will be used for AI-powered naming suggestions.
					</p>
				)}
			</Panel>
		</div>
	);
}
