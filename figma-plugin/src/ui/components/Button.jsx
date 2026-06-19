/**
 * Button component - replaces primary-button, ghost-button, danger-button + modifiers
 *
 * @param {'primary'|'ghost'|'danger'} variant
 * @param {'compact'|'large'|'wide'|undefined} size
 * @param {boolean} disabled
 * @param {function} onClick
 * @param {React.ReactNode} children
 * @param {string} className
 * @param {object} rest - other button props (type, etc.)
 */
export function Button({ variant = 'primary', size, disabled, onClick, children, className = '', ...rest }) {
	const base =
		'inline-flex items-center justify-center min-h-[34px] px-3 rounded-full font-bold cursor-pointer transition-all duration-[120ms]';

	const variants = {
		primary: 'bg-[var(--figma-color-bg-brand)] text-[var(--figma-color-text-onbrand)]',
		ghost: 'bg-[var(--figma-color-bg)] text-[var(--figma-color-text)] border border-[var(--figma-color-border)]',
		danger: 'bg-[rgba(194,65,12,0.1)] text-[#c2410c] border border-[rgba(194,65,12,0.26)]',
	};

	const sizes = {
		compact: 'min-h-[28px] px-[10px]',
		large: 'w-full min-h-[42px] text-[13px]',
		wide: 'min-w-[92px]',
	};

	const state = disabled ? 'opacity-60 cursor-default transform-none hover:translate-y-0' : 'hover:translate-y-[-1px]';

	const classes = [base, variants[variant], size ? sizes[size] : '', state, className].filter(Boolean).join(' ');

	return (
		<button className={classes} onClick={onClick} disabled={disabled} {...rest}>
			{children}
		</button>
	);
}
