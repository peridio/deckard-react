import React from 'react';
import './Button.styles.css';

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
        <div className="btn-spinner" aria-hidden="true">
          ⟳
        </div>
      ) : null}
      <div className={loading ? 'btn-content-loading' : 'btn-content'}>
        {children}
      </div>
    </button>
  );
};

export default Button;
