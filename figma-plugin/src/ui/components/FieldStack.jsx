/**
 * FieldStack component - replaces field-stack, field-label, field-row, field-grid
 *
 * @param {string} label
 * @param {string} htmlFor
 * @param {string} className
 * @param {React.ReactNode} children
 */
export function FieldStack({ label, htmlFor, className = '', children }) {
	return (
		<div className={`flex flex-col gap-1.5 ${className}`}>
			{label && (
				<label
					className="text-[10px] font-bold text-[var(--figma-color-text-secondary)] uppercase tracking-[0.06em]"
					htmlFor={htmlFor}
				>
					{label}
				</label>
			)}
			{children}
		</div>
	);
}
