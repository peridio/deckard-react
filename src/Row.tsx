import React from 'react';

interface RowProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  'data-property-key'?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const Row: React.FC<RowProps> = ({
  children,
  className = '',
  id,
  'data-property-key': dataPropertyKey,
  onClick,
}) => {
  const rowClasses = ['row', className].filter(Boolean).join(' ');

  return (
    <div
      className={rowClasses}
      id={id}
      data-property-key={dataPropertyKey}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Row;
