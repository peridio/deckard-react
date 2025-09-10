import React from 'react';
import './Badge.styles.css';

export type BadgeVariant =
  | 'default'
  | 'required'
  | 'type'
  | 'pattern'
  | 'label'
  | 'enum'
  | 'reference'
  | 'disabled'
  | 'warning'
  | 'schema-type';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  uppercase?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  title?: string;
  'aria-label'?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
  disabled = false,
  uppercase = false,
  clickable = false,
  onClick,
  title,
  'aria-label': ariaLabel,
}) => {
  const baseClass = 'badge';
  const variantClass = `badge-${variant}`;
  const sizeClass = `badge-${size}`;
  const disabledClass = disabled ? 'badge-disabled' : '';
  const uppercaseClass = uppercase ? 'badge-uppercase' : '';
  const clickableClass = clickable ? 'badge-clickable' : '';

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    disabledClass,
    uppercaseClass,
    clickableClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (clickable && !disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (
      clickable &&
      !disabled &&
      onClick &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <span
      className={classes}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable && !disabled ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
};

// Container component for multiple badges (replaces EnumValues)
export interface BadgeGroupProps {
  values: unknown[];
  label?: string;
  showLabel?: boolean;
  onValueClick?: (value: unknown) => void;
  className?: string;
  badgeVariant?: BadgeVariant;
  badgeSize?: BadgeSize;
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({
  values,
  label = 'enum',
  showLabel = true,
  onValueClick,
  className = '',
  badgeVariant = 'enum',
  badgeSize = 'xs',
}) => {
  if (!values || values.length === 0) {
    return null;
  }

  const containerClasses = ['badge-group', className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {showLabel && (
        <Badge variant="label" size="xs" uppercase>
          {label}:
        </Badge>
      )}
      {values.map((value, index) => (
        <Badge
          key={index}
          variant={badgeVariant}
          size={badgeSize}
          clickable={!!onValueClick}
          onClick={() => onValueClick?.(value)}
          title={onValueClick ? 'Click to copy' : undefined}
          aria-label={
            onValueClick ? `Copy value ${JSON.stringify(value)}` : undefined
          }
        >
          {JSON.stringify(value)}
        </Badge>
      ))}
    </div>
  );
};

export default Badge;
