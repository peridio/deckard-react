import React from 'react';

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
  disabled = false,
  loading = false,
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const loadingClass = loading ? 'btn-loading' : '';
  const disabledClass = disabled || loading ? 'btn-disabled' : '';

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    loadingClass,
    disabledClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="btn-spinner" aria-hidden="true">
          ⟳
        </span>
      ) : null}
      <span className={loading ? 'btn-content-loading' : 'btn-content'}>
        {children}
      </span>
    </button>
  );
};

// Self-contained styles
export const buttonStyles = `
/* Button Component Styles */
/* All styles are scoped to .schema-container to prevent global conflicts */

/* ===== BASE BUTTON STYLES ===== */

.schema-container .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--schema-space-xs);
  background: none;
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--schema-transition);
  text-decoration: none;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

/* ===== BUTTON SIZES ===== */

.schema-container .btn-xs {
  padding: 0.125rem var(--schema-space-xs);
  font-size: var(--schema-text-xs);
  min-height: 1.25rem;
}

.schema-container .btn-sm {
  padding: var(--schema-space-xs) var(--schema-space-sm);
  font-size: var(--schema-text-xs);
  min-height: 1.5rem;
}

.schema-container .btn-md {
  padding: var(--schema-space-sm) var(--schema-space-md);
  font-size: var(--schema-text-sm);
  min-height: 2rem;
}

.schema-container .btn-lg {
  padding: var(--schema-space-md) var(--schema-space-lg);
  font-size: var(--schema-text-base);
  min-height: 2.5rem;
}

/* ===== BUTTON VARIANTS ===== */

.schema-container .btn-default {
  color: var(--schema-text-secondary);
  background: transparent;
  border-color: var(--schema-border);
}

.schema-container .btn-default:hover:not(.btn-disabled) {
  background: var(--schema-surface-hover);
  color: var(--schema-text);
  border-color: var(--schema-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.schema-container .btn-primary {
  background: var(--schema-accent);
  color: var(--schema-text-inverse);
  border-color: var(--schema-accent);
}

.schema-container .btn-primary:hover:not(.btn-disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.schema-container .btn-secondary {
  background: var(--schema-surface);
  color: var(--schema-text);
  border-color: var(--schema-border-strong);
}

.schema-container .btn-secondary:hover:not(.btn-disabled) {
  background: var(--schema-surface-hover);
  border-color: var(--schema-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.schema-container .btn-ghost {
  background: transparent;
  color: var(--schema-text-secondary);
  border: none;
}

.schema-container .btn-ghost:hover:not(.btn-disabled) {
  background: var(--schema-surface-hover);
  color: var(--schema-text);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* ===== BUTTON STATES ===== */

.schema-container .btn:active:not(.btn-disabled) {
  transform: translateY(0);
  box-shadow: none;
  transition: none;
}

.schema-container .btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--schema-accent-soft);
  border-color: var(--schema-accent);
}

.schema-container .btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.schema-container .btn-loading {
  pointer-events: none;
}

/* ===== LOADING STATE ===== */

.schema-container .btn-spinner {
  display: inline-block;
  animation: btn-spin 1s linear infinite;
  font-size: inherit;
}

.schema-container .btn-content-loading {
  opacity: 0.7;
}

@keyframes btn-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ===== DARK MODE ADJUSTMENTS ===== */

@media (prefers-color-scheme: dark) {
  .schema-container .btn:hover:not(.btn-disabled) {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .schema-container .btn-primary:hover:not(.btn-disabled) {
    background: rgba(59, 130, 246, 0.9);
  }
}

/* ===== ACCESSIBILITY ===== */

@media (prefers-contrast: high) {
  .schema-container .btn {
    border-width: 2px;
    font-weight: 600;
  }
}

@media (prefers-reduced-motion: reduce) {
  .schema-container .btn:hover:not(.btn-disabled) {
    transform: none;
    box-shadow: none;
  }

  .schema-container .btn:active:not(.btn-disabled) {
    transform: none;
    box-shadow: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .schema-container .btn {
    transition: none;
  }

  .schema-container .btn:active:not(.btn-disabled) {
    transform: none;
  }

  .schema-container .btn-spinner {
    animation: none;
  }
}
`;

export default Button;
