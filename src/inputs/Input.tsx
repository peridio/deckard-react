import React, { forwardRef } from 'react';
import './Input.styles.css';

export type InputVariant = 'default' | 'search' | 'inline';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  className?: string;
  error?: boolean;
  success?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      className = '',
      error = false,
      success = false,
      ...props
    },
    ref
  ) => {
    const baseClass = 'input';
    const variantClass = `input-${variant}`;
    const sizeClass = `input-${size}`;
    const errorClass = error ? 'input-error' : '';
    const successClass = success ? 'input-success' : '';

    const classes = [
      baseClass,
      variantClass,
      sizeClass,
      errorClass,
      successClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <input ref={ref} className={classes} {...props} />;
  }
);

Input.displayName = 'Input';

// Self-contained styles
export const inputStyles = `
/* Input Component Styles */
/* All styles are scoped to .schema-container to prevent global conflicts */

/* ===== BASE INPUT STYLES ===== */

.schema-container .input {
  display: block;
  width: 100%;
  background: transparent;
  border: 1px solid var(--schema-border-strong);
  border-radius: var(--schema-radius-sm);
  color: var(--schema-text);
  font-family: var(--schema-font-base);
  transition: all var(--schema-transition);
  box-sizing: border-box;
}

/* ===== INPUT SIZES ===== */

.schema-container .input-sm {
  padding: 0.375rem var(--schema-space-sm);
  font-size: var(--schema-text-xs);
  min-height: 1.75rem;
}

.schema-container .input-md {
  padding: var(--schema-space-sm) var(--schema-space-md);
  font-size: var(--schema-text-base);
  min-height: 2.25rem;
}

.schema-container .input-lg {
  padding: var(--schema-space-md) var(--schema-space-lg);
  font-size: var(--schema-text-base);
  min-height: 2.75rem;
}

/* ===== INPUT VARIANTS ===== */

.schema-container .input-default {
  /* Default styling is handled by base input */
}

.schema-container .input-search {
  border-radius: var(--schema-radius-md);
  padding-left: 2.5rem;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z'/%3e%3c/svg%3e");
  background-position: left 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem 1rem;
}

.schema-container .input-inline {
  display: inline-block;
  width: auto;
  min-width: 8rem;
}

/* ===== INPUT STATES ===== */

.schema-container .input::placeholder {
  color: var(--schema-text-muted);
  opacity: 1;
}

.schema-container .input:focus {
  outline: none;
  background: var(--schema-accent-hover);
  box-shadow: inset 3px 0 0 var(--schema-border-focus);
  border-color: var(--schema-border-focus);
}

.schema-container .input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--schema-surface);
}

.schema-container .input-error {
  border-color: var(--schema-danger);
  background: rgba(239, 68, 68, 0.05);
}

.schema-container .input-error:focus {
  box-shadow: inset 3px 0 0 var(--schema-danger);
  border-color: var(--schema-danger);
}

.schema-container .input-success {
  border-color: var(--schema-success);
  background: rgba(16, 185, 129, 0.05);
}

.schema-container .input-success:focus {
  box-shadow: inset 3px 0 0 var(--schema-success);
  border-color: var(--schema-success);
}

/* ===== DARK MODE ADJUSTMENTS ===== */

@media (prefers-color-scheme: dark) {
  .schema-container .input-search {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%9ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z'/%3e%3c/svg%3e");
  }
}

/* ===== ACCESSIBILITY ===== */

@media (prefers-contrast: high) {
  .schema-container .input {
    border-width: 2px;
  }

  .schema-container .input:focus {
    box-shadow: inset 4px 0 0 var(--schema-border-focus);
  }
}

@media (prefers-reduced-motion: reduce) {
  .schema-container .input {
    transition: none;
  }
}

/* ===== RESPONSIVE DESIGN ===== */

@media (max-width: 640px) {
  .schema-container .input-search {
    padding-left: var(--schema-space-md);
    background-image: none;
  }
}
`;

export default Input;
