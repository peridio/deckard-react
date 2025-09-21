import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  FaChevronDown,
  FaChevronRight,
  FaLink,
  FaMapPin,
} from 'react-icons/fa';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { FaSitemap } from 'react-icons/fa';
import { SchemaProperty, PropertyState, JsonSchema } from '../types';
import { getSchemaType, hasExamples } from '../utils';
import ExamplesPanel from './ExamplesPanel';
import { Badge, Tooltip } from '../components';
import PropertyDetails from './PropertyDetails';

const getTypeDescription = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'string':
      return 'Text data - can contain letters, numbers, and symbols.';
    case 'number':
      return 'Numeric data - integers and decimal numbers.';
    case 'integer':
      return 'Whole number data - no decimal places allowed.';
    case 'boolean':
      return 'True or false value.';
    case 'array':
      return 'List of items - can contain multiple values.';
    case 'object':
      return 'Structured data with properties and values.';
    case 'null':
      return 'Represents no value or empty data.';
    case 'oneof':
      return 'Must match exactly one of the defined schemas.';
    case 'anyof':
      return 'Must match at least one of the defined schemas.';
    case 'enum':
      return 'Must be one of a specific set of predefined values.';
    default:
      if (type.includes('|')) {
        return 'Can be one of multiple data types.';
      }
      return 'The expected data type for this property.';
  }
};

const getEnumId = (schema: JsonSchema): string | null => {
  // Check for preserved original $ref (from resolved schemas)
  if (schema.__originalRef && typeof schema.__originalRef === 'string') {
    const match = schema.__originalRef.match(/#\/definitions\/(.+)$/);
    if (match && match[1].trim()) {
      return match[1];
    }
  }

  // Check for direct $ref (unresolved schemas)
  if (schema.$ref && typeof schema.$ref === 'string') {
    const match = schema.$ref.match(/#\/definitions\/(.+)$/);
    if (match && match[1].trim()) {
      return match[1];
    }
  }

  return null;
};

const getEnumDescription = (
  schema: JsonSchema,
  rootSchema?: JsonSchema
): string => {
  // If schema has preserved __originalRef or $ref, resolve it to get the description
  const refToUse = schema.__originalRef || schema.$ref;
  if (refToUse && rootSchema) {
    const enumId = getEnumId(schema);
    if (enumId && rootSchema.definitions && rootSchema.definitions[enumId]) {
      const resolvedSchema = rootSchema.definitions[enumId];
      if (resolvedSchema.description) {
        return resolvedSchema.description;
      }
    }
  }

  // Fallback to direct schema description
  if (schema.description) {
    return schema.description;
  }

  return 'No description provided for this enumerated type.';
};

interface PropertyFieldProps {
  property: SchemaProperty;
  propertyKey: string;
  state: PropertyState;
  onToggle: () => void;
  onCopy: (text: string, element: HTMLElement) => void;
  onCopyLink: (propertyKey: string, element: HTMLElement) => void;
  collapsible: boolean;
  includeExamples: boolean;
  examplesOnFocusOnly: boolean;
  _propertyStates?: Record<string, PropertyState>;
  rootSchema?: JsonSchema;
  _toggleProperty?: (key: string) => void;
  focusedProperty?: string | null;
  onFocusChange?: (propertyKey: string | null) => void;
  options?: { defaultExampleLanguage?: 'json' | 'yaml' | 'toml' };
  searchQuery?: string;
}

const PropertyField: React.FC<PropertyFieldProps> = ({
  property,
  propertyKey,
  state,
  onToggle,
  onCopy,
  onCopyLink,
  collapsible,
  includeExamples,
  examplesOnFocusOnly,
  _propertyStates,
  rootSchema,
  _toggleProperty,
  focusedProperty,
  onFocusChange,
  options,
  searchQuery,
}) => {
  const [isActiveRoute, setIsActiveRoute] = useState(false);

  // Check if schema is valid
  const hasValidSchema = property.schema != null;

  // Check if current URL hash matches this property's link
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkActiveRoute = () => {
      const hash = window.location.hash.replace('#', '');
      // Convert hash format (with dashes) to property key format (with dots)
      const fieldKey = hash.replace(/-/g, '.');
      setIsActiveRoute(fieldKey === propertyKey);
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
      if (collapsible && hasValidSchema) {
        onToggle();
      }
      // Set this property as focused when clicking header
      onFocusChange?.(propertyKey);
    },
    [collapsible, onToggle, propertyKey, onFocusChange, hasValidSchema]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (collapsible && hasValidSchema) {
          onToggle();
        }
      }
    },
    [collapsible, onToggle, hasValidSchema]
  );

  const handleLinkClick = useCallback(
    (e: React.MouseEvent) => {
      // Allow middle-click and cmd+click to navigate without expanding
      if (e.button === 1 || e.ctrlKey || e.metaKey) {
        return; // Let browser handle navigation
      }

      // Set this property as focused when clicking link
      onFocusChange?.(propertyKey);
      // Expand the field if it's not already expanded
      if (collapsible && hasValidSchema && !state.expanded) {
        onToggle();
      }
    },
    [
      onFocusChange,
      propertyKey,
      collapsible,
      hasValidSchema,
      state.expanded,
      onToggle,
    ]
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
      if ((e.target as HTMLElement).closest('.property-header-container')) {
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

  // Generate the anchor URL for the link
  const linkHref = useMemo(() => {
    if (typeof window === 'undefined') return '#';
    const anchor = `#${propertyKey}`;
    return `${window.location.origin}${window.location.pathname}${anchor}`;
  }, [propertyKey]);

  const renderPropertyDetails = useCallback(() => {
    return (
      <PropertyDetails
        property={property}
        onCopy={onCopy}
        rootSchema={rootSchema}
        onCopyLink={onCopyLink}
        propertyStates={_propertyStates}
        toggleProperty={_toggleProperty}
        focusedProperty={focusedProperty}
        onFocusChange={onFocusChange}
        options={options}
        searchQuery={searchQuery}
      />
    );
  }, [
    property,
    onCopy,
    rootSchema,
    onCopyLink,
    _propertyStates,
    _toggleProperty,
    focusedProperty,
    onFocusChange,
    options,
    searchQuery,
  ]);

  const propertyClasses = [
    'property',
    property.depth > 0 ? 'nested-property' : '',
    state.expanded ? 'expanded' : '',
    property.depth > 0 ? `depth-${Math.min(property.depth, 3)}` : '',
    includeExamples &&
    hasValidSchema &&
    hasExamples(property.schema, rootSchema)
      ? 'has-examples'
      : '',
    !hasValidSchema ? 'invalid-schema' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`${propertyClasses} ${focusedProperty === propertyKey ? 'focused' : ''}`}
      id={propertyKey.replace(/\./g, '-')}
      data-property-key={propertyKey}
      onClick={handleFieldClick}
    >
      <div
        className="row-header-container property-header-container"
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        tabIndex={collapsible && hasValidSchema ? 0 : -1}
        role={collapsible && hasValidSchema ? 'button' : undefined}
        aria-expanded={hasValidSchema ? state.expanded : undefined}
        aria-label={
          hasValidSchema && state.expanded
            ? `Collapse ${property.name}`
            : hasValidSchema
              ? `Expand ${property.name}`
              : `${property.name} - Invalid schema`
        }
        style={{
          cursor: collapsible && hasValidSchema ? 'pointer' : 'default',
        }}
      >
        <div className="property-controls">
          {isActiveRoute && (
            <Tooltip
              title="Current active route"
              content="This field is currently focused via URL hash."
              placement="top"
              clickableBounds={true}
            >
              <span
                className="active-route-indicator"
                aria-label={`${property.name} is the current active route`}
              >
                <FaMapPin />
              </span>
            </Tooltip>
          )}
          {searchQuery && state.matchesSearch && !isActiveRoute && (
            <Tooltip
              title={
                state.isDirectMatch && state.hasNestedMatches
                  ? 'Direct and nested search match'
                  : state.isDirectMatch
                    ? 'Direct search match'
                    : 'Indirect search match'
              }
              content={
                state.isDirectMatch && state.hasNestedMatches
                  ? 'This property matches your search query and also contains nested matches.'
                  : state.isDirectMatch
                    ? 'This property matches your search query.'
                    : 'This property has nested properties that match your search.'
              }
              placement="top"
            >
              <span
                className={`row-button search-hit-indicator ${
                  state.isDirectMatch && state.hasNestedMatches
                    ? 'both-hit'
                    : state.isDirectMatch
                      ? 'direct-hit'
                      : 'indirect-hit'
                }`}
                aria-label={`${property.name} ${
                  state.isDirectMatch && state.hasNestedMatches
                    ? 'matches search and contains nested matches'
                    : state.isDirectMatch
                      ? 'matches current search'
                      : 'contains nested search matches'
                }`}
              >
                {state.isDirectMatch && state.hasNestedMatches ? (
                  <FaSitemap />
                ) : state.isDirectMatch ? (
                  <FaFolder />
                ) : (
                  <FaFolderOpen />
                )}
              </span>
            </Tooltip>
          )}
          <a
            href={linkHref}
            className="link-button"
            onClick={handleLinkClick}
            title="Link to this field."
            aria-label={`Link to ${property.name} field`}
          >
            <FaLink />
          </a>
          {collapsible && hasValidSchema && (
            <button
              className="row-button expand-button"
              onClick={handleHeaderClick}
              tabIndex={-1}
              aria-hidden="true"
            >
              {state.expanded ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          )}
          {!hasValidSchema && (
            <span
              className="invalid-schema-indicator"
              title="Invalid schema data."
            >
              ⚠️
            </span>
          )}
        </div>

        <div className="property-content">
          <div className="property-inline">
            <span
              className={`property-name ${property.schema.__isPatternProperty ? 'pattern-property' : ''}`}
            >
              {property.schema.__isPatternProperty ? (
                <Tooltip
                  title="Pattern property"
                  content="This represents dynamic field names. Unlike fixed property names, this can match multiple different field names in your data."
                  placement="top"
                  nonInteractive={true}
                >
                  <Badge variant="pattern" size="sm">
                    {property.name}
                  </Badge>
                </Tooltip>
              ) : (
                property.name
              )}
            </span>
            {property.schema.enum || getEnumId(property.schema) ? (
              <Tooltip
                title="Data type"
                content={getEnumDescription(property.schema, rootSchema)}
                placement="top"
                nonInteractive={true}
              >
                <Badge variant="custom-type" size="sm">
                  {getEnumId(property.schema) || 'enum'}
                </Badge>
              </Tooltip>
            ) : (
              schemaType && (
                <Tooltip
                  title="Data type"
                  content={getTypeDescription(schemaType)}
                  placement="top"
                  nonInteractive={true}
                >
                  <Badge variant="type" size="sm">
                    {schemaType}
                  </Badge>
                </Tooltip>
              )
            )}
            {property.required && (
              <Tooltip
                title="Required property"
                content="This property must be present in valid data."
                placement="top"
                nonInteractive={true}
              >
                <Badge className="required-badge" variant="required">
                  required
                </Badge>
              </Tooltip>
            )}
            {!state.expanded &&
              hasValidSchema &&
              property.schema.description && (
                <span className="property-description-inline">
                  {property.schema.description}
                </span>
              )}
            {!state.expanded && !hasValidSchema && (
              <span className="property-description-inline invalid-schema-description">
                Schema data is undefined or invalid
              </span>
            )}
          </div>
        </div>
      </div>

      {state.expanded && hasValidSchema && (
        <div
          className={`schema-details ${includeExamples && hasExamples(property.schema, rootSchema) && !property.schema.oneOf && (examplesOnFocusOnly ? focusedProperty === propertyKey : true) ? 'schema-details-split' : ''}`}
          data-has-examples={hasExamples(property.schema, rootSchema)}
          data-include-examples={includeExamples}
          data-split-active={
            includeExamples &&
            hasExamples(property.schema, rootSchema) &&
            !property.schema.oneOf &&
            (examplesOnFocusOnly ? focusedProperty === propertyKey : true)
          }
        >
          {includeExamples &&
          hasExamples(property.schema, rootSchema) &&
          !property.schema.oneOf &&
          (examplesOnFocusOnly ? focusedProperty === propertyKey : true) ? (
            <>
              <div className="schema-details-left">
                {renderPropertyDetails()}
              </div>
              <div
                className="schema-details-right"
                data-debug="examples-panel-container"
              >
                {rootSchema && (
                  <ExamplesPanel
                    currentProperty={property.schema}
                    rootSchema={rootSchema}
                    propertyPath={property.path || [propertyKey]}
                    onCopy={onCopy}
                    options={options}
                  />
                )}
              </div>
            </>
          ) : (
            renderPropertyDetails()
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyField;
