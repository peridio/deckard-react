import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  FaMapPin,
  FaLink,
  FaChevronDown,
  FaChevronRight,
  FaEyeSlash,
} from 'react-icons/fa';
import { FaFolder, FaFolderOpen, FaSitemap } from 'react-icons/fa';
import './PropertyRow.styles.css';
import { SchemaProperty, PropertyState, JsonSchema } from '../types';
import {
  getSchemaType,
  hasExamples,
  extractProperties,
  hashToPropertyKey,
  propertyKeyToHash,
  resolveSchema,
  extractOneOfIndexFromPath,
} from '../utils';
import ExamplesPanel from './ExamplesPanel';
import { Badge, Tooltip, OneOfSelector } from '../components';
import Row from '../Row';
import PropertyDetails from './PropertyDetails';
import Rows from '../Rows';

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
  options?: { defaultExampleLanguage?: 'json' | 'yaml' | 'toml' };
  searchQuery?: string;
  examplesHidden?: boolean;
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
  options,
  searchQuery,
  examplesHidden = false,
}) => {
  const [isActiveRoute, setIsActiveRoute] = useState(false);
  const [selectedOneOfOption, setSelectedOneOfOption] =
    useState<JsonSchema | null>(null);
  const [selectedOneOfIndex, setSelectedOneOfIndex] = useState<number>(0);

  // Check if schema is valid
  const hasValidSchema = property.schema != null;

  // Initialize selectedOneOfOption for oneOf properties with hash-based selection
  useEffect(() => {
    if (
      property.schema.oneOf &&
      property.schema.oneOf.length > 0 &&
      rootSchema
    ) {
      // Determine initial selected index from URL hash
      let initialSelectedIndex = 0;
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash) {
          const propertyKeyFromHash = hashToPropertyKey(hash);
          const hashIndex = extractOneOfIndexFromPath(propertyKeyFromHash);
          if (hashIndex >= 0 && hashIndex < property.schema.oneOf.length) {
            initialSelectedIndex = hashIndex;
          }
        }
      }

      const selectedOption = property.schema.oneOf[initialSelectedIndex];
      const resolvedOption = resolveSchema(selectedOption, rootSchema);
      setSelectedOneOfOption(resolvedOption);
      setSelectedOneOfIndex(initialSelectedIndex);
    }
  }, [property.schema.oneOf, rootSchema]);

  // Listen for hash changes to update oneOf selection
  useEffect(() => {
    if (
      !property.schema.oneOf ||
      property.schema.oneOf.length === 0 ||
      !rootSchema ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const propertyKeyFromHash = hashToPropertyKey(hash);
      const hashIndex = extractOneOfIndexFromPath(propertyKeyFromHash);

      // Only update if the hash is for this property and has a different oneOf index
      if (
        propertyKeyFromHash.startsWith(propertyKey) &&
        hashIndex >= 0 &&
        hashIndex < property.schema.oneOf!.length
      ) {
        const selectedOption = property.schema.oneOf![hashIndex];
        const resolvedOption = resolveSchema(selectedOption, rootSchema);
        setSelectedOneOfOption(resolvedOption);
        setSelectedOneOfIndex(hashIndex);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [property.schema.oneOf, rootSchema, propertyKey]);

  // Determine if this property should be in split layout
  // For oneOf properties, only show split layout if the selected option has examples
  const isInSplitLayout = useMemo(() => {
    if (!includeExamples || examplesHidden) return false;
    if (examplesOnFocusOnly && focusedProperty !== propertyKey) return false;

    // For oneOf properties, check if selected option has examples
    if (property.schema.oneOf) {
      // If we have a selectedOneOfOption, use it
      if (selectedOneOfOption) {
        return hasExamples(selectedOneOfOption, rootSchema);
      }
      // If selectedOneOfOption is not set yet (timing issue),
      // fall back to checking if any oneOf option has examples
      return hasExamples(property.schema, rootSchema);
    }

    // For regular properties, use existing logic
    return hasExamples(property.schema, rootSchema);
  }, [
    includeExamples,
    examplesHidden,
    examplesOnFocusOnly,
    focusedProperty,
    propertyKey,
    property.schema,
    selectedOneOfOption,
    rootSchema,
  ]);

  // Extract nested properties if this property has them
  const nestedProperties = useMemo(() => {
    if (!rootSchema || !hasValidSchema) return [];

    // Don't extract nested properties if schema has oneOf or allOf
    // as these are handled by OneOfSelector/AllOfSelector components
    // The oneOf nested properties will be handled by the sibling container
    if (property.schema.oneOf || property.schema.allOf) {
      return [];
    }

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
  }, [
    property.schema,
    property.path,
    property.depth,
    rootSchema,
    hasValidSchema,
  ]);

  const hasNestedProperties = nestedProperties.length > 0;

  // Handle oneOf selection changes
  const handleOneOfSelectionChange = useCallback(
    (selectedIndex: number, selectedOption: JsonSchema) => {
      setSelectedOneOfOption(selectedOption);
      setSelectedOneOfIndex(selectedIndex);
    },
    []
  );

  // Extract oneOf nested properties for sibling container rendering
  const oneOfNestedProperties = useMemo(() => {
    if (
      !rootSchema ||
      !hasValidSchema ||
      !property.schema.oneOf ||
      !selectedOneOfOption
    ) {
      return [];
    }

    // Always extract nested properties if the selected option has them
    if (selectedOneOfOption.properties) {
      const selectedIndex = property.schema.oneOf.findIndex(
        option =>
          option === selectedOneOfOption ||
          (option.$ref &&
            selectedOneOfOption.$ref &&
            option.$ref === selectedOneOfOption.$ref)
      );

      return extractProperties(
        selectedOneOfOption,
        [...property.path, 'oneOf', selectedIndex.toString()],
        property.depth + 1,
        rootSchema,
        []
      );
    }

    return [];
  }, [
    property.schema.oneOf,
    selectedOneOfOption,
    rootSchema,
    hasValidSchema,
    property.path,
    property.depth,
  ]);

  const hasOneOfNestedProperties = oneOfNestedProperties.length > 0;

  // Check if current URL hash matches this property's link
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkActiveRoute = () => {
      const hash = window.location.hash;
      // Convert hash format to property key format, properly handling pattern properties
      const fieldKey = hashToPropertyKey(hash);

      // Check for exact match
      if (fieldKey === propertyKey) {
        setIsActiveRoute(true);
        return;
      }

      // Check for oneOf selection match (e.g., "property.oneOf.0" should match "property")
      if (property.schema.oneOf && property.schema.oneOf.length > 0) {
        const oneOfRegex = new RegExp(
          `^${propertyKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.oneOf\\.[0-9]+$`
        );
        if (oneOfRegex.test(fieldKey)) {
          setIsActiveRoute(true);
          return;
        }
      }

      setIsActiveRoute(false);
    };

    checkActiveRoute();

    const handleHashChange = () => checkActiveRoute();
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [propertyKey, property.schema.oneOf]);

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

  // Generate the anchor URL for the link
  const linkHref = useMemo(() => {
    if (typeof window === 'undefined') return '#';

    // Include oneOf selection in the anchor if this property has oneOf options
    let linkPropertyKey = propertyKey;
    if (property.schema.oneOf && property.schema.oneOf.length > 0) {
      linkPropertyKey = `${propertyKey}.oneOf.${selectedOneOfIndex}`;
    }

    const anchor = `#${propertyKeyToHash(linkPropertyKey)}`;
    return `${window.location.origin}${window.location.pathname}${anchor}`;
  }, [propertyKey, property.schema.oneOf, selectedOneOfIndex]);

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
        options={options}
        searchQuery={searchQuery}
        inSplitLayout={isInSplitLayout}
        onOneOfSelectionChange={handleOneOfSelectionChange}
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
    options,
    searchQuery,
    isInSplitLayout,
    handleOneOfSelectionChange,
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
    <Row
      className={`${propertyClasses} ${focusedProperty === propertyKey ? 'focused' : ''}`}
      id={propertyKeyToHash(propertyKey)}
      data-property-key={propertyKey}
      onClick={handleFieldClick}
    >
      {/* Hidden anchor for oneOf selection to enable native browser scrolling */}
      {property.schema.oneOf && property.schema.oneOf.length > 0 && (
        <span
          id={propertyKeyToHash(`${propertyKey}.oneOf.${selectedOneOfIndex}`)}
          style={{ position: 'absolute', visibility: 'hidden' }}
          aria-hidden="true"
        />
      )}
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
        <div className="row-controls property-controls">
          {searchQuery && state.matchesSearch && (
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
          {examplesHidden && hasExamples(property.schema, rootSchema) && (
            <Tooltip
              title="Examples hidden"
              content="Examples are available for this property but are currently hidden. Press 'e' to show examples."
              placement="top"
            >
              <span
                className="examples-hidden-indicator"
                aria-label={`${property.name} has examples that are currently hidden`}
              >
                <FaEyeSlash />
              </span>
            </Tooltip>
          )}
          <Tooltip
            title={isActiveRoute ? 'Current active route' : 'Link to field'}
            content={
              isActiveRoute
                ? 'This field is currently focused via URL hash.'
                : 'Navigate to this field via URL.'
            }
            placement="top"
          >
            <a
              href={linkHref}
              className={`row-button link-button ${isActiveRoute ? 'active-route' : ''}`}
              onClick={handleLinkClick}
              aria-label={
                isActiveRoute
                  ? `${property.name} is the current active route`
                  : `Link to ${property.name} field`
              }
            >
              {isActiveRoute ? <FaMapPin /> : <FaLink />}
            </a>
          </Tooltip>
          {collapsible && hasValidSchema && (
            <Tooltip
              title={state.expanded ? 'Collapse property' : 'Expand property'}
              content={
                state.expanded
                  ? 'Hide property details and nested properties.'
                  : 'Show property details and nested properties.'
              }
              placement="top"
            >
              <button
                className="row-button expand-button"
                onClick={handleHeaderClick}
                tabIndex={-1}
                aria-hidden="true"
              >
                {state.expanded ? <FaChevronDown /> : <FaChevronRight />}
              </button>
            </Tooltip>
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

        <div className="row-content property-content">
          <div className="row-inline property-inline">
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
                <Badge variant="required" size="sm">
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
        <>
          <div className="property-content-container">
            <div
              className={`schema-details ${isInSplitLayout ? 'schema-details-split' : ''}`}
              data-has-examples={hasExamples(property.schema, rootSchema)}
              data-include-examples={includeExamples}
              data-split-active={isInSplitLayout}
            >
              {isInSplitLayout ? (
                <>
                  <div className="schema-details-left">
                    {renderPropertyDetails()}
                  </div>
                  <div
                    className="schema-details-right"
                    data-debug="examples-panel-container"
                  >
                    {rootSchema &&
                      hasExamples(
                        selectedOneOfOption || property.schema,
                        rootSchema
                      ) &&
                      !(
                        property.schema.__isPatternProperty &&
                        !hasExamples(property.schema, rootSchema)
                      ) && (
                        <ExamplesPanel
                          currentProperty={
                            property.schema.__isPatternProperty
                              ? {
                                  ...property.schema,
                                  // Remove oneOf to prevent fallback to oneOf examples
                                  // when pattern property itself has no examples
                                  oneOf:
                                    (property.schema.examples?.length ?? 0) > 0
                                      ? property.schema.oneOf
                                      : undefined,
                                }
                              : selectedOneOfOption || property.schema
                          }
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
            {/* Sibling container for full-width nested properties */}
            {(hasNestedProperties ||
              hasOneOfNestedProperties ||
              property.schema.oneOf) && (
              <div className="nested-fields-sibling">
                {hasNestedProperties && (
                  <Rows
                    className="nested-properties"
                    properties={nestedProperties}
                    propertyStates={propertyStates || {}}
                    onToggle={propertyKey => toggleProperty?.(propertyKey)}
                    onCopy={onCopy}
                    onCopyLink={onCopyLink}
                    collapsible={collapsible}
                    includeExamples={includeExamples && !examplesHidden}
                    examplesOnFocusOnly={examplesOnFocusOnly}
                    rootSchema={rootSchema}
                    toggleProperty={toggleProperty}
                    focusedProperty={focusedProperty}
                    onFocusChange={onFocusChange}
                    options={options}
                    searchQuery={searchQuery}
                    examplesHidden={examplesHidden}
                  />
                )}
                {property.schema.oneOf && rootSchema && (
                  <div className="oneof-selector-sibling-container">
                    <OneOfSelector
                      oneOfOptions={property.schema.oneOf}
                      rootSchema={rootSchema}
                      propertyPath={property.path}
                      _onCopy={onCopy}
                      onCopyLink={onCopyLink}
                      propertyStates={propertyStates}
                      toggleProperty={toggleProperty}
                      focusedProperty={focusedProperty}
                      onFocusChange={onFocusChange}
                      options={options}
                      searchQuery={searchQuery}
                      initialSelectedIndex={(() => {
                        if (typeof window === 'undefined') return 0;
                        const hash = window.location.hash;
                        if (!hash) return 0;
                        const propertyKeyFromHash = hashToPropertyKey(hash);
                        const hashIndex =
                          extractOneOfIndexFromPath(propertyKeyFromHash);
                        if (
                          hashIndex >= 0 &&
                          hashIndex < property.schema.oneOf.length
                        ) {
                          return hashIndex;
                        }
                        return 0;
                      })()}
                      hideDescription={false}
                      disableNestedExamples={examplesHidden}
                      renderNestedProperties={true}
                      onSelectionChange={handleOneOfSelectionChange}
                      isActiveRoute={isActiveRoute}
                      propertyKey={propertyKey}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Row>
  );
};

export default PropertyRow;
