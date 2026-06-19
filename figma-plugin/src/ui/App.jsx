import { useEffect, useRef, useState } from 'react';
import { ToolListView } from './tools/ToolListView.jsx';
import { SettingsTool } from './tools/SettingsTool.jsx';
import { AssetExporterTool } from './tools/AssetExporterTool.jsx';
import { TOOL_DEFINITIONS } from './tools/toolRegistry.js';
import {
	DEFAULT_DIR,
	DEFAULT_SCALE,
	DEFAULT_TYPE,
	normalizeAssetScale,
	normalizeAssetType,
} from './tools/assetExporterUtils.js';

const DEFAULT_VIEW = 'tools';

const TOOL_COMPONENTS = {
	settings: SettingsTool,
	'asset-exporter': AssetExporterTool,
};

function App() {
	const [view, setView] = useState(DEFAULT_VIEW);
	const [geminiApiKey, setGeminiApiKey] = useState('');
	const geminiApiKeyRef = useRef('');
	const [geminiSaveStatus, setGeminiSaveStatus] = useState('idle');
	const [exporterSettings, setExporterSettings] = useState({
		relativeDir: DEFAULT_DIR,
		defaultType: DEFAULT_TYPE,
		defaultScale: DEFAULT_SCALE,
		autoAIRename: true,
	});
	const [exporterSaveStatus, setExporterSaveStatus] = useState('idle');

	useEffect(() => {
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'load-gemini-key',
				},
			},
			'*',
		);

		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'load-exporter-settings',
				},
			},
			'*',
		);
	}, []);

	useEffect(() => {
		const handleMessage = (event) => {
			const message = event.data?.pluginMessage;

			if (!message) {
				return;
			}

			if (message.type === 'gemini-key-loaded') {
				const nextKey = message.apiKey || '';
				setGeminiApiKey(nextKey);
				geminiApiKeyRef.current = nextKey;
				return;
			}

			if (message.type === 'exporter-settings-loaded' || message.type === 'exporter-settings-saved') {
				const nextSettings = message.settings || {};
				const defaultType = normalizeAssetType(nextSettings.defaultType);
				setExporterSettings({
					relativeDir: typeof nextSettings.relativeDir === 'string' && nextSettings.relativeDir.trim()
						? nextSettings.relativeDir.trim()
						: DEFAULT_DIR,
					defaultType,
					defaultScale: normalizeAssetScale(nextSettings.defaultScale, defaultType),
					autoAIRename: nextSettings.autoAIRename !== false,
				});

				if (message.type === 'exporter-settings-saved') {
					setExporterSaveStatus('saved');
					window.setTimeout(() => setExporterSaveStatus('idle'), 2000);
				}
			}
		};

		window.addEventListener('message', handleMessage);

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, []);

	const handleSaveGeminiKey = () => {
		const trimmedKey = geminiApiKey.trim();
		geminiApiKeyRef.current = trimmedKey;
		setGeminiSaveStatus('saving');
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'save-gemini-key',
					apiKey: trimmedKey,
				},
			},
			'*',
		);
		setGeminiSaveStatus('saved');
		setTimeout(() => setGeminiSaveStatus('idle'), 2000);
	};

	const handleSaveExporterSettings = (settings) => {
		const defaultType = normalizeAssetType(settings.defaultType);
		const nextSettings = {
			relativeDir: typeof settings.relativeDir === 'string' && settings.relativeDir.trim()
				? settings.relativeDir.trim()
				: DEFAULT_DIR,
			defaultType,
			defaultScale: normalizeAssetScale(settings.defaultScale, defaultType),
			autoAIRename: settings.autoAIRename !== false,
		};

		setExporterSettings(nextSettings);
		setExporterSaveStatus('saving');
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'save-exporter-settings',
					settings: nextSettings,
				},
			},
			'*',
		);
	};

	const SelectedTool = TOOL_COMPONENTS[view] || null;
	return (
		<div className="min-h-screen p-[14px]">
			<div className="flex flex-col gap-3">
				{view === DEFAULT_VIEW ? (
					<ToolListView tools={TOOL_DEFINITIONS} onSelectTool={setView} />
				) : SelectedTool ? (
					<SelectedTool
						onBack={() => setView(DEFAULT_VIEW)}
						exporterSettings={exporterSettings}
						exporterSaveStatus={exporterSaveStatus}
						onSaveExporterSettings={handleSaveExporterSettings}
						geminiApiKey={geminiApiKey}
						setGeminiApiKey={setGeminiApiKey}
						geminiSaveStatus={geminiSaveStatus}
						onSaveGeminiKey={handleSaveGeminiKey}
					/>
				) : (
					<ToolListView tools={TOOL_DEFINITIONS} onSelectTool={setView} />
				)}
			</div>
		</div>
	);
}

export default App;
