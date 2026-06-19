import { useState } from 'react';

const HOVER_PREVIEW_WIDTH = 320;
const HOVER_PREVIEW_MAX_HEIGHT = 360;

/**
 * HoverPreview component - replaces PreviewHover from App.jsx
 * Uses Tailwind for popover positioning instead of CSS classes
 *
 * @param {string|undefined} previewUrl
 * @param {string} alt
 * @param {'default'|'large'} size
 * @param {string} className
 * @param {React.ReactNode} children
 */
export function HoverPreview({ previewUrl, alt, size = 'default', className = '', children }) {
	const [isOpen, setIsOpen] = useState(false);

	const showPopover = () => {
		if (!previewUrl) return;
		setIsOpen(true);
	};

	const hidePopover = () => setIsOpen(false);

	const popoverClasses = size === 'large' ? 'w-64 max-h-72' : 'w-44';

	return (
		<div
			className={`relative inline-flex items-center ${className}`}
			onMouseEnter={showPopover}
			onMouseLeave={hidePopover}
		>
			{children}
			{previewUrl && isOpen && (
				<div
					className={`absolute left-0 top-full mt-1 p-2 rounded-lg bg-[var(--figma-color-bg-secondary)] border border-[var(--figma-color-border)] shadow-lg z-50 ${popoverClasses}`}
				>
					<img
						src={previewUrl}
						alt={alt}
						className="w-full h-full object-contain rounded-md"
					/>
				</div>
			)}
		</div>
	);
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
