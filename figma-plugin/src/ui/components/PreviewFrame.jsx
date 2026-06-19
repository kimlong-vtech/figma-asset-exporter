/**
 * PreviewFrame component - replaces preview-frame, preview-frame--compact,
 * mini-preview-frame, mini-preview-frame--inline, preview-image
 *
 * @param {string|undefined} src
 * @param {string} alt
 * @param {'compact'|'mini'|'inline'|'parent'|undefined} size
 * @param {string} className
 * @param {React.ReactNode} children - fallback content when no src
 */
export function PreviewFrame({ src, alt = '', size, className = '', children }) {
	const base =
		'flex items-center justify-center rounded-[10px] bg-[var(--figma-color-bg-secondary)] overflow-hidden';

	const sizes = {
		compact: 'min-h-[110px]',
		mini: 'min-h-[80px]',
		inline: 'min-h-[72px]',
		parent: 'relative min-h-[80px] flex-1',
	};

	const imgClass = 'block w-full h-full object-contain';

	const classes = [base, size ? sizes[size] : 'min-h-[144px]', className].filter(Boolean).join(' ');

	if (src) {
		return (
			<div className={classes}>
				<img src={src} alt={alt} className={imgClass} />
			</div>
		);
	}

	return (
		<div className={classes}>
			{children || <p className="m-0 text-[var(--figma-color-text-secondary)]">No preview yet.</p>}
		</div>
	);
}
