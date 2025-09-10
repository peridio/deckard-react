import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  FaMapPin,
  FaLink,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import './PropertyRow.styles.css';
import { SchemaProperty, PropertyState, JsonSchema } from '../types';
import { getSchemaType, hasExamples, extractProperties } from '../utils.js';
import ExamplesPanel from './ExamplesPanel';
import { Badge, Tooltip } from '../components';
import Row from '../Row';
import PropertyDetails from './PropertyDetails';
import Rows from '../Rows';

interface PropertyRowProps {
  property: SchemaProperty;
  propertyKey: string;
  state: PropertyState;
  onToggle: () => void;
  onCopy: (text: string, element: HTMLElement) => void;
  onCopyLink: (propertyKey: string, element: HTMLElement) => void;
  collapsible: boolean;
  includeExamples: boolean;
  examplesOnFocusOnly: boolean;
  propertyStates?: Record<string, PropertyState>;
  rootSchema?: JsonSchema;
  toggleProperty?: (key: string) => void;
  focusedProperty?: string | null;
  onFocusChange?: (propertyKey: string | null) => void;
}

const PropertyRow: React.FC<PropertyRowProps> = ({
  property,
  propertyKey,
  state,
  onToggle,
  onCopy,
  onCopyLink,
  collapsible,
  includeExamples,
  examplesOnFocusOnly,
  propertyStates,
  rootSchema,
  toggleProperty,
  focusedProperty,
  onFocusChange,
}) => {
  const [isActiveRoute, setIsActiveRoute] = useState(false);

  // Extract nested properties if this property has them
  const nestedProperties = useMemo(() => {
    if (
      (!property.schema.properties && !property.schema.patternProperties) ||
      !rootSchema
    )
      return [];
    const props = extractProperties(
      property.schema,
      property.path,
      property.depth + 1,
      rootSchema,
      []
    );
    // Sort nested properties alphabetically by name
    return props.sort((a: SchemaProperty, b: SchemaProperty) =>
      a.name.localeCompare(b.name)
    );
  }, [property.schema, property.path, property.depth, rootSchema]);

  const hasNestedProperties = nestedProperties.length > 0;

  // Check if current URL hash matches this property's link
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkActiveRoute = () => {
      const hash = window.location.hash.replace('#', '');
      setIsActiveRoute(hash === propertyKey);
    };

    checkActiveRoute();

    const handleHashChange = () => checkActiveRoute();
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [propertyKey]);

  const schemaType = getSchemaType(property.schema, rootSchema);

  const handleHeaderClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (collapsible) {
        onToggle();
      }
      // Set this property as focused when clicking header
      onFocusChange?.(propertyKey);
    },
    [collapsible, onToggle, propertyKey, onFocusChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (collapsible) {
          onToggle();
        }
      }
    },
    [collapsible, onToggle]
  );

  const handleLinkClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Expand the row if it's collapsed (but don't collapse if expanded)
      if (!state.expanded) {
        onToggle();
      }
      // Set this property as focused when clicking link
      onFocusChange?.(propertyKey);
      onCopyLink(propertyKey, e.currentTarget as HTMLElement);
    },
    [onCopyLink, propertyKey, state.expanded, onToggle, onFocusChange]
  );

  const handleFieldClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't interfere with button clicks or text selection
      if (
        (e.target as HTMLElement).closest('button') ||
        (typeof window !== 'undefined' && window.getSelection()?.toString())
      ) {
        return;
      }

      // Don't interfere with header clicks (expand/collapse functionality)
      if ((e.target as HTMLElement).closest('.row-header-container')) {
        return;
      }

      // Stop propagation to prevent conflicts with header click handler
      e.stopPropagation();

      // Set this property as focused
      onFocusChange?.(propertyKey);

      // Focus the property container
      const propertyContainer = e.currentTarget as HTMLElement;
      propertyContainer.setAttribute('tabindex', '-1');
      propertyContainer.focus();
    },
    [propertyKey, onFocusChange]
  );

  const renderPropertyDetails = useCallback(() => {
    return (
      <PropertyDetails
        property={property}
        onCopy={onCopy}
        rootSchema={rootSchema}
        onCopyLink={onCopyLink}
        propertyStates={propertyStates}
        toggleProperty={toggleProperty}
        focusedProperty={focusedProperty}
        onFocusChange={onFocusChange}
      />
    );
  }, [
    property,
    onCopy,
    rootSchema,
    onCopyLink,
    propertyStates,
    toggleProperty,
    focusedProperty,
    onFocusChange,
  ]);

  const propertyClasses = [
    'property',
    property.depth > 0 ? 'nested-property' : '',
    state.expanded ? 'expanded' : '',
    property.depth > 0 ? `depth-${Math.min(property.depth, 3)}` : '',
    includeExamples && hasExamples(property.schema) ? 'has-examples' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Row
      className={`${propertyClasses} ${focusedProperty === propertyKey ? 'focused' : ''}`}
      id={propertyKey.replace(/\./g, '-')}
      data-property-key={propertyKey}
      onClick={handleFieldClick}
    >
      <div
        className="row-header-container property-header-container"
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        tabIndex={collapsible ? 0 : -1}
        role={collapsible ? 'button' : undefined}
        aria-expanded={state.expanded}
        aria-label={
          state.expanded
            ? `Collapse ${property.name}`
            : `Expand ${property.name}`
        }
        style={{
          cursor: collapsible ? 'pointer' : 'default',
        }}
      >
        <div className="row-controls property-controls">
          {isActiveRoute && (
            <Tooltip content="Current active route" placement="top">
              <span
                className="row-button active-route-indicator"
                aria-label={`${property.name} is the current active route`}
              >
                <FaMapPin />
              </span>
            </Tooltip>
          )}
          <button
            className="row-button link-button"
            onClick={handleLinkClick}
            title="Copy link to this field"
            aria-label={`Copy link to ${property.name} field`}
          >
            <FaLink />
          </button>
          <button
            className="row-button expand-button"
            onClick={handleHeaderClick}
            tabIndex={-1}
            aria-hidden="true"
          >
            {state.expanded ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        </div>

        <div className="row-content property-content">
          <div className="row-inline property-inline">
            <span
              className={`property-name ${property.schema.__isPatternProperty ? 'pattern-property' : ''}`}
            >
              {property.schema.__isPatternProperty ? (
                <Tooltip
                  content={
                    <div>
                      <strong>Pattern Property</strong>
                      <br />
                      This represents dynamic field names. Unlike fixed property
                      names, this can match multiple different field names in
                      your data.
                    </div>
                  }
                  placement="top"
                >
                  <Badge variant="pattern" size="sm">
                    {property.name}
                  </Badge>
                </Tooltip>
              ) : (
                property.name
              )}
            </span>
            {schemaType && (
              <Badge variant="type" size="sm">
                {schemaType}
              </Badge>
            )}
            {property.required && (
              <Badge variant="required" size="sm">
                required
              </Badge>
            )}
            {!state.expanded && property.schema.description && (
              <span className="property-description-inline">
                {property.schema.description}
              </span>
            )}
          </div>
        </div>
      </div>

      {state.expanded && (
        <>
          <div
            className={`schema-details ${includeExamples && hasExamples(property.schema) && (examplesOnFocusOnly ? focusedProperty === propertyKey : true) ? 'schema-details-split' : ''}`}
            data-has-examples={hasExamples(property.schema)}
            data-include-examples={includeExamples}
            data-split-active={
              includeExamples &&
              hasExamples(property.schema) &&
              (examplesOnFocusOnly ? focusedProperty === propertyKey : true)
            }
          >
            {includeExamples &&
            hasExamples(property.schema) &&
            (examplesOnFocusOnly ? focusedProperty === propertyKey : true) ? (
              <>
                <div className="schema-details-left">
                  {renderPropertyDetails()}
                </div>
                <div
                  className="schema-details-right"
                  data-debug="examples-panel-container"
                >
                  <ExamplesPanel
                    currentProperty={property.schema}
                    rootSchema={rootSchema}
                    propertyPath={property.path || [propertyKey]}
                    onCopy={onCopy}
                  />
                </div>
              </>
            ) : (
              renderPropertyDetails()
            )}
          </div>

          {hasNestedProperties && (
            <Rows
              className="nested-properties"
              properties={nestedProperties}
              propertyStates={propertyStates || {}}
              onToggle={propertyKey => toggleProperty?.(propertyKey)}
              onCopy={onCopy}
              onCopyLink={onCopyLink}
              collapsible={collapsible}
              includeExamples={includeExamples}
              examplesOnFocusOnly={examplesOnFocusOnly}
              rootSchema={rootSchema}
              toggleProperty={toggleProperty}
              focusedProperty={focusedProperty}
              onFocusChange={onFocusChange}
            />
          )}
        </>
      )}
    </Row>
  );
};

export default PropertyRow;
