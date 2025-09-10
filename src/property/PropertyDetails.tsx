import React, { useState, useCallback } from 'react';
import { HiBarsArrowDown } from 'react-icons/hi2';
import { FaCopy } from 'react-icons/fa';
import {
  SchemaProperty,
  PropertyConstraint,
  JsonSchema,
  PropertyState,
} from '../types';
import { getConstraints, getUnsupportedFeatures } from '../utils.js';
import {
  Badge,
  BadgeGroup,
  OneOfSelector,
  AllOfSelector,
  SchemaWarning,
} from '../components';
import CodeSnippet from './CodeSnippet';

interface PropertyDetailsProps {
  property: SchemaProperty;
  onCopy: (text: string, element: HTMLElement) => void;
  rootSchema?: JsonSchema;
  onCopyLink?: (propertyKey: string, element: HTMLElement) => void;
  propertyStates?: Record<string, PropertyState>;
  toggleProperty?: (key: string) => void;
  focusedProperty?: string | null;
  onFocusChange?: (propertyKey: string | null) => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  property,
  onCopy,
  rootSchema,
  onCopyLink,
  propertyStates,
  toggleProperty,
  focusedProperty,
  onFocusChange,
}) => {
  const constraints = getConstraints(property.schema);

  const _handleCodeClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      const text = e.currentTarget.textContent || '';
      if (text.length > 2) {
        onCopy(text, e.currentTarget);
      }
    },
    [onCopy]
  );

  // CodeBlock component with copy and wrap controls
  const CodeBlock: React.FC<{
    content: string;
  }> = ({ content }) => {
    const [isWrapped, setIsWrapped] = useState(false);

    const handleCopy = useCallback(() => {
      onCopy(content, document.createElement('div'));
    }, [content]);

    const toggleWrap = useCallback(() => {
      setIsWrapped(prev => !prev);
    }, []);

    return (
      <div
        className={`code-block-container ${isWrapped ? 'wrap-enabled' : ''}`}
      >
        <div className="code-controls">
          <button
            className="code-control-button"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <FaCopy />
          </button>
          <button
            className={`code-control-button ${isWrapped ? 'wrap-enabled' : ''}`}
            onClick={toggleWrap}
            title="Toggle line wrap"
          >
            <HiBarsArrowDown />
          </button>
        </div>
        <pre>
          <code>{content}</code>
        </pre>
      </div>
    );
  };

  return (
    <>
      {property.schema.__isPatternProperty && property.schema.__pattern && (
        <div className="pattern-info">
          <Badge variant="label" size="xs" uppercase>
            Pattern:
          </Badge>
          <CodeSnippet
            code={property.schema.__pattern}
            variant="pattern"
            size="xs"
            copyable={true}
          />
        </div>
      )}

      {property.schema.description && (
        <div className="property-description-block">
          {property.schema.description}
        </div>
      )}

      {/* Handle oneOf scenarios */}
      {property.schema.oneOf && rootSchema && (
        <OneOfSelector
          oneOfOptions={property.schema.oneOf}
          rootSchema={rootSchema}
          _onCopy={onCopy}
          onCopyLink={onCopyLink}
          propertyStates={propertyStates}
          toggleProperty={toggleProperty}
          focusedProperty={focusedProperty}
          onFocusChange={onFocusChange}
        />
      )}

      {/* Handle allOf scenarios */}
      {property.schema.allOf && rootSchema && (
        <AllOfSelector
          allOfOptions={property.schema.allOf}
          rootSchema={rootSchema}
          _onCopy={onCopy}
          onCopyLink={onCopyLink}
          propertyStates={propertyStates}
          toggleProperty={toggleProperty}
          focusedProperty={focusedProperty}
          onFocusChange={onFocusChange}
          propertyPath={property.path}
        />
      )}

      {/* Handle unsupported features with warnings */}
      {getUnsupportedFeatures(property.schema).map(feature => {
        const getFeatureInfo = (feature: string) => {
          switch (feature) {
            case 'anyOf':
              return {
                description:
                  'The anyOf schema feature is not currently supported. This means the property can match any one of the specified schemas, but the documentation cannot display all possible variations.',
                suggestion:
                  'Consider using oneOf if only one schema should match, or allOf if all schemas should be combined.',
              };
            case 'if/then/else':
              return {
                description:
                  'Conditional schema validation (if/then/else) is not supported for documentation display.',
                suggestion:
                  'Consider restructuring the schema to avoid conditional logic, or use oneOf with clear schema distinctions.',
              };
            case 'not':
              return {
                description:
                  'The not schema feature is not supported for documentation display.',
                suggestion:
                  'Consider restructuring the schema to use positive validation constraints instead of negation.',
              };
            case 'contains':
              return {
                description:
                  'The contains schema feature for arrays is not supported for documentation display.',
                suggestion:
                  'Consider using items or additionalItems to define array element schemas.',
              };
            case 'contentEncoding':
              return {
                description:
                  'Content encoding specifications are not displayed in the documentation.',
                suggestion:
                  "This is a validation-only feature and doesn't affect the schema structure display.",
              };
            case 'contentMediaType':
              return {
                description:
                  'Content media type specifications are not displayed in the documentation.',
                suggestion:
                  "This is a validation-only feature and doesn't affect the schema structure display.",
              };
            case 'propertyNames':
              return {
                description:
                  'Property name validation schemas are not supported for documentation display.',
                suggestion:
                  'Consider using patternProperties for dynamic property names.',
              };
            case 'unevaluatedProperties':
              return {
                description:
                  'Unevaluated properties handling is not supported for documentation display.',
                suggestion:
                  'Consider using additionalProperties for simpler property handling.',
              };
            case 'unevaluatedItems':
              return {
                description:
                  'Unevaluated items handling is not supported for documentation display.',
                suggestion:
                  'Consider using additionalItems for simpler array item handling.',
              };
            default:
              return {
                description: `The "${feature}" schema feature is not currently supported and will not be rendered.`,
                suggestion:
                  'Check the JSON Schema documentation for alternative approaches.',
              };
          }
        };

        const info = getFeatureInfo(feature);
        return (
          <SchemaWarning
            key={feature}
            feature={feature}
            description={info.description}
            suggestion={info.suggestion}
          />
        );
      })}

      {constraints.length > 0 && (
        <div className="constraints">
          {constraints.map((constraint: PropertyConstraint, index: number) => (
            <CodeSnippet
              key={index}
              code={`${constraint.label}: ${String(constraint.value)}`}
              variant="constraint"
              size="xs"
              copyable={false}
            />
          ))}
        </div>
      )}

      {property.schema.enum && (
        <BadgeGroup
          values={property.schema.enum}
          onValueClick={value => {
            onCopy(JSON.stringify(value), document.createElement('div'));
          }}
          badgeVariant="enum"
          badgeSize="xs"
        />
      )}

      {property.schema.default !== undefined && (
        <div className="default-value">
          <CodeBlock content={JSON.stringify(property.schema.default)} />
        </div>
      )}
    </>
  );
};

export default PropertyDetails;
