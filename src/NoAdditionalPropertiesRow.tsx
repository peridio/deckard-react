import React from 'react';
import Row from './Row';

interface NoAdditionalPropertiesRowProps {
  className?: string;
}

const NoAdditionalPropertiesRow: React.FC<NoAdditionalPropertiesRowProps> = ({
  className = '',
}) => {
  const rowClasses = ['no-additional-properties', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Row className={rowClasses}>
      <div className="row-header-container">
        <div className="row-controls">
          <button
            className="row-button link-button"
            disabled
            tabIndex={-1}
            title="No link available for this informational row"
          >
            <span className="disabled-icon">×</span>
          </button>
        </div>
        <div className="row-content">
          <div className="row-inline">
            <span className="property-name disabled">
              <em>no additional properties</em>
            </span>
          </div>
        </div>
      </div>
    </Row>
  );
};

export default NoAdditionalPropertiesRow;
