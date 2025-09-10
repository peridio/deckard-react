import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Badge } from './Badge';
import './SchemaWarning.styles.css';

interface SchemaWarningProps {
  feature: string;
  description?: string;
  suggestion?: string;
  className?: string;
}

const SchemaWarning: React.FC<SchemaWarningProps> = ({
  feature,
  description,
  suggestion,
  className = '',
}) => {
  return (
    <div className={`schema-warning ${className}`}>
      <div className="schema-warning-header">
        <FaExclamationTriangle className="schema-warning-icon" />
        <Badge variant="warning" size="sm">
          Unsupported Feature
        </Badge>
        <code className="schema-warning-feature">{feature}</code>
      </div>

      <div className="schema-warning-content">
        <p className="schema-warning-description">
          {description ||
            `The "${feature}" schema feature is not currently supported and will not be rendered.`}
        </p>

        {suggestion && (
          <p className="schema-warning-suggestion">
            <strong>Suggestion:</strong> {suggestion}
          </p>
        )}
      </div>
    </div>
  );
};

export default SchemaWarning;
