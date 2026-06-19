import { Panel } from '../components/Panel.jsx';

function ToolIcon({ icon }) {
	if (icon === 'settings') {
		return (
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
				<path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
			</svg>
		);
	}

	return (
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 3h8l4 4v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
			<path d="M8 3v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
			<path d="M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
		</svg>
	);
}

export function ToolListView({ tools, onSelectTool }) {
	return (
		<div className="flex flex-col gap-3">
			<Panel variant="hero">
				<p className="m-0 mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--figma-color-text-secondary)]">
					Figma Plugin
				</p>
				<h1 className="m-0 mb-2 text-[18px] font-bold leading-[1.15]">Utils Tools</h1>
				<p className="m-0 text-[var(--figma-color-text-secondary)] leading-6">
					Select a tool to get started.
				</p>
			</Panel>

			{tools.map((tool) => (
				<button
					key={tool.id}
					onClick={() => onSelectTool(tool.id)}
					className="w-full text-left p-0 border-none bg-transparent cursor-pointer group"
				>
					<Panel variant="tool" className="transition-shadow group-hover:shadow-[0_0_0_1px_var(--figma-color-border)]">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-[var(--figma-color-bg-secondary)] flex items-center justify-center">
								<ToolIcon icon={tool.icon} />
							</div>
							<div className="flex-1 min-w-0">
								<h2 className="m-0 mb-1 text-[14px] font-bold leading-[1.15]">{tool.title}</h2>
								<p className="m-0 text-[var(--figma-color-text-secondary)] leading-5">
									{tool.description}
								</p>
							</div>
							<svg className="w-4 h-4 text-[var(--figma-color-text-secondary)]" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</div>
					</Panel>
				</button>
			))}
		</div>
	);
}
