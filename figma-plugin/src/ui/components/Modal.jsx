function Modal({ children }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/40" />
			{/* Dialog */}
			<div className="relative bg-[var(--figma-color-bg)] rounded-xl shadow-2xl border border-[var(--figma-color-border)] p-5 max-w-sm w-full">
				{children}
			</div>
		</div>
	);
}

export { Modal };
