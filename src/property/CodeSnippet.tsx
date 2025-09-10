import React, { useCallback } from 'react';
import './CodeSnippet.styles.css';

export type CodeSnippetVariant = 'inline' | 'block' | 'constraint' | 'pattern';
export type CodeSnippetSize = 'xs' | 'sm' | 'md';

export interface CodeSnippetProps {
  code: string;
  variant?: CodeSnippetVariant;
  size?: CodeSnippetSize;
  className?: string;
  copyable?: boolean;
  onCodeClick?: (code: string) => void;
  language?: string;
  title?: string;
  maxWidth?: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({
  code,
  variant = 'inline',
  size = 'xs',
  className = '',
  copyable = true,
  onCodeClick,
  language: _language,
  title,
  maxWidth,
}) => {
  const handleClick = useCallback(() => {
    if (copyable && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    onCodeClick?.(code);
  }, [code, copyable, onCodeClick]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const baseClass = 'code-snippet';
  const variantClass = `code-snippet-${variant}`;
  const sizeClass = `code-snippet-${size}`;

  const classes = [baseClass, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  const style = maxWidth ? { maxWidth } : undefined;

  const commonProps = {
    className: classes,
    style,
    title: copyable ? title || 'Click to copy' : title,
  };

  const interactiveProps = copyable
    ? {
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        tabIndex: 0,
        role: 'button',
        'aria-label': `Copy code: ${code}`,
      }
    : {};

  if (variant === 'block') {
    return (
      <pre {...commonProps} {...interactiveProps}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <code {...commonProps} {...interactiveProps}>
      {code}
    </code>
  );
};

export default CodeSnippet;
