import React from 'react';
import './ResponsiveSchemaLayout.styles.css';

interface ResponsiveSchemaLayoutProps {
  leftContent: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  hasSplit?: boolean;
}

const ResponsiveSchemaLayout: React.FC<ResponsiveSchemaLayoutProps> = ({
  leftContent,
  rightContent,
  className = '',
  hasSplit = false,
}) => {
  const shouldSplit = hasSplit && rightContent;

  return (
    <div
      className={`responsive-schema-layout ${shouldSplit ? 'responsive-schema-layout-split' : ''} ${className}`}
      data-has-split={shouldSplit}
    >
      <div className="responsive-schema-layout-left">{leftContent}</div>
      {shouldSplit && rightContent && (
        <div className="responsive-schema-layout-right">{rightContent}</div>
      )}
    </div>
  );
};

export default ResponsiveSchemaLayout;
