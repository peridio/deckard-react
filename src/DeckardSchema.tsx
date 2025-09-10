import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HiChevronDown, HiChevronRight, HiLink } from 'react-icons/hi2';
import {
  JsonSchema,
  DeckardOptions,
  PropertyState,
  SearchState,
  SchemaProperty,
  PropertyConstraint,
} from './types';
import { schemaStyles } from './styles';

interface DeckardSchemaProps {
  schema: JsonSchema;
  options?: DeckardOptions;
  className?: string;
}

const DEFAULT_OPTIONS: DeckardOptions = {
  includeHeader: true,
  includePropertiesTitle: true,
  includeDefinitions: false,
  includeExamples: false,
  searchable: true,
  collapsible: true,
  autoExpand: false,
  theme: 'auto',
};

export const DeckardSchema: React.FC<DeckardSchemaProps> = ({
  schema,
  options = {},
  className = '',
}) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [propertyStates, setPropertyStates] = useState<
    Record<string, PropertyState>
  >({});
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    visible: false,
    results: 0,
  });

  const properties = useMemo(() => {
    const props = extractProperties(schema, [], 0, schema);
    // Sort properties alphabetically by name
    return props.sort((a, b) => a.name.localeCompare(b.name));
  }, [schema]);

  const filteredProperties = useMemo(() => {
    if (!searchState.query) return properties;

    return properties.filter(prop => {
      const searchText =
        `${prop.name} ${prop.schema.description || ''} ${getSchemaType(prop.schema)}`.toLowerCase();
      return searchText.includes(searchState.query.toLowerCase());
    });
  }, [properties, searchState.query]);

  // Initialize property states - all properties are expandable now
  // Initialize property states for all properties including nested ones
  useEffect(() => {
    const newStates: Record<string, PropertyState> = {};

    const initializePropertyStates = (
      schema: JsonSchema,
      path: string[],
      depth: number,
      rootSchema: JsonSchema
    ) => {
      const properties = extractProperties(schema, path, depth, rootSchema);

      properties.forEach(property => {
        const key = property.path.join('.');
        newStates[key] = {
          expanded: Boolean(mergedOptions.autoExpand),
          hasDetails: true, // All fields are expandable now
          matchesSearch: true,
        };

        // Recursively initialize nested properties
        if (property.schema.properties || property.schema.patternProperties) {
          initializePropertyStates(
            property.schema,
            property.path,
            depth + 1,
            rootSchema
          );
        }
      });
    };

    // Initialize all properties (top-level and nested)
    initializePropertyStates(schema, [], 0, schema);
    setPropertyStates(newStates);
  }, [schema, mergedOptions.autoExpand]);

  // Update search results
  useEffect(() => {
    setSearchState(prev => ({
      ...prev,
      results: filteredProperties.length,
    }));
  }, [filteredProperties.length]);

  const toggleProperty = useCallback((propertyKey: string) => {
    setPropertyStates(prev => ({
      ...prev,
      [propertyKey]: {
        ...prev[propertyKey],
        expanded: !prev[propertyKey]?.expanded,
      },
    }));
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchState(prev => ({ ...prev, query }));

      // Auto-expand matching properties when searching
      if (query && mergedOptions.collapsible) {
        const newStates = { ...propertyStates };
        filteredProperties.forEach(prop => {
          const key = prop.path.join('.');
          if (newStates[key]?.hasDetails) {
            newStates[key] = { ...newStates[key], expanded: true };
          }
        });
        setPropertyStates(newStates);
      }
    },
    [propertyStates, filteredProperties, mergedOptions.collapsible]
  );

  const expandAll = useCallback(() => {
    const newStates = { ...propertyStates };
    Object.keys(newStates).forEach(key => {
      if (newStates[key].hasDetails) {
        newStates[key] = { ...newStates[key], expanded: true };
      }
    });
    setPropertyStates(newStates);
  }, [propertyStates]);

  const collapseAll = useCallback(() => {
    const newStates = { ...propertyStates };
    Object.keys(newStates).forEach(key => {
      newStates[key] = { ...newStates[key], expanded: false };
    });
    setPropertyStates(newStates);
  }, [propertyStates]);

  const clearSearch = useCallback(() => {
    setSearchState(prev => ({ ...prev, query: '' }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search shortcut: /
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const searchInput = document.querySelector(
          '.search-input'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Expand all: Ctrl/Cmd + E
      if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !e.shiftKey) {
        e.preventDefault();
        expandAll();
      }

      // Collapse all: Ctrl/Cmd + Shift + E
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        collapseAll();
      }

      // Clear search: Escape
      if (e.key === 'Escape') {
        clearSearch();
      }
    };

    if (mergedOptions.searchable) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [expandAll, collapseAll, clearSearch, mergedOptions.searchable]);

  const copyToClipboard = useCallback(
    async (text: string, element: HTMLElement) => {
      try {
        await navigator.clipboard.writeText(text);

        // Clear any existing timeout for this element
        const existingTimeout = element.dataset.copyTimeout;
        if (existingTimeout) {
          clearTimeout(Number(existingTimeout));
        }

        // Store original styles only if we haven't already
        if (!element.dataset.originalBg) {
          element.dataset.originalBg = element.style.backgroundColor || '';
          element.dataset.originalTextColor = element.style.color || '';
        }

        // Visual feedback
        element.style.backgroundColor = '#10b981';
        element.style.color = 'white';

        // Set new timeout and store its ID
        const timeoutId = setTimeout(() => {
          element.style.backgroundColor = element.dataset.originalBg || '';
          element.style.color = element.dataset.originalTextColor || '';
          delete element.dataset.originalBg;
          delete element.dataset.originalTextColor;
          delete element.dataset.copyTimeout;
        }, 1000);

        element.dataset.copyTimeout = timeoutId.toString();
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    },
    []
  );

  const copyFieldLink = useCallback(
    async (propertyKey: string, element: HTMLElement) => {
      const anchor = `#${propertyKey.replace(/\./g, '-')}`;
      const url = `${window.location.origin}${window.location.pathname}${anchor}`;

      try {
        await navigator.clipboard.writeText(url);

        // Clear any existing timeout for this element
        const existingTimeout = element.dataset.copyTimeout;
        if (existingTimeout) {
          clearTimeout(Number(existingTimeout));
        }

        // Store original color only if we haven't already
        if (!element.dataset.originalColor) {
          element.dataset.originalColor = element.style.color || '';
        }

        // Visual feedback
        element.style.color = '#10b981';

        // Set new timeout and store its ID
        const timeoutId = setTimeout(() => {
          element.style.color = element.dataset.originalColor || '';
          delete element.dataset.originalColor;
          delete element.dataset.copyTimeout;
        }, 1000);

        element.dataset.copyTimeout = timeoutId.toString();
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    },
    []
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: schemaStyles }} />
      <div className={`schema-container ${className}`}>
        {mergedOptions.includeHeader && schema.title && (
          <div className="schema-header">
            <h1>{schema.title}</h1>
            {schema.description && (
              <p className="schema-description">{schema.description}</p>
            )}
          </div>
        )}

        {mergedOptions.searchable && (
          <div className="schema-search">
            <input
              type="search"
              className="search-input"
              placeholder="Search properties... (press /)"
              value={searchState.query}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
        )}

        {mergedOptions.includePropertiesTitle && <h2>Properties</h2>}

        <div className="properties-section">
          <div className="properties-list">
            {filteredProperties.map(property => {
              const propertyKey = property.path.join('.');
              const state = propertyStates[propertyKey];
              if (!state) return null;

              return (
                <PropertyComponent
                  key={propertyKey}
                  property={property}
                  propertyKey={propertyKey}
                  state={state}
                  onToggle={() => toggleProperty(propertyKey)}
                  onCopy={copyToClipboard}
                  onCopyLink={copyFieldLink}
                  collapsible={Boolean(mergedOptions.collapsible)}
                  includeExamples={Boolean(mergedOptions.includeExamples)}
                  propertyStates={propertyStates}
                  rootSchema={schema}
                  toggleProperty={toggleProperty}
                />
              );
            })}
          </div>
        </div>

        {mergedOptions.includeDefinitions && schema.definitions && (
          <div className="definitions-section">
            <h2>Definitions</h2>
            {Object.entries(schema.definitions).map(([name, def]) => (
              <div key={name} className="definition">
                <h3>{name}</h3>
                <DeckardSchema
                  schema={def}
                  options={{
                    ...mergedOptions,
                    includeHeader: false,
                    includeDefinitions: false,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

interface PropertyComponentProps {
  property: SchemaProperty;
  propertyKey: string;
  state: PropertyState;
  onToggle: () => void;
  onCopy: (text: string, element: HTMLElement) => void;
  onCopyLink: (propertyKey: string, element: HTMLElement) => void;
  collapsible: boolean;
  includeExamples: boolean;
  propertyStates?: Record<string, PropertyState>;
  rootSchema?: JsonSchema;
  toggleProperty?: (key: string) => void;
}

const PropertyComponent: React.FC<PropertyComponentProps> = ({
  property,
  propertyKey,
  state,
  onToggle,
  onCopy,
  onCopyLink,
  collapsible,
  includeExamples,
  propertyStates,
  rootSchema,
  toggleProperty,
}) => {
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
      rootSchema
    );
    // Sort nested properties alphabetically by name
    return props.sort((a, b) => a.name.localeCompare(b.name));
  }, [property.schema, property.path, property.depth, rootSchema]);

  const hasNestedProperties = nestedProperties.length > 0;
  const handleHeaderClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (collapsible) {
        onToggle();
      }
    },
    [collapsible, onToggle]
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

  const handleCodeClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      const text = e.currentTarget.textContent || '';
      if (text.length > 2) {
        onCopy(text, e.currentTarget);
      }
    },
    [onCopy]
  );

  const handleLinkClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Expand the row if it's collapsed (but don't collapse if expanded)
      if (!state.expanded) {
        onToggle();
      }
      onCopyLink(propertyKey, e.currentTarget as HTMLElement);
    },
    [onCopyLink, propertyKey, state.expanded, onToggle]
  );

  const propertyClasses = [
    'property',
    property.depth > 0 ? 'nested-property' : '',
    state.expanded ? 'expanded' : '',
    property.depth > 0 ? `depth-${Math.min(property.depth, 3)}` : '',
    includeExamples && hasExamples(property.schema) ? 'has-examples' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const schemaType = getSchemaType(property.schema);
  const constraints = getConstraints(property.schema);

  return (
    <div className={propertyClasses} id={propertyKey.replace(/\./g, '-')}>
      <div
        className="property-header-container"
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
        <div className="property-controls">
          <button
            className="link-button"
            onClick={handleLinkClick}
            title="Copy link to this field"
            aria-label={`Copy link to ${property.name} field`}
          >
            <HiLink />
          </button>
          <button
            className="expand-button"
            onClick={handleHeaderClick}
            tabIndex={-1}
            aria-hidden="true"
          >
            {state.expanded ? <HiChevronDown /> : <HiChevronRight />}
          </button>
        </div>

        <div className="property-content">
          <div className="property-inline">
            <span
              className={`property-name ${property.schema.__isPatternProperty ? 'pattern-property' : ''}`}
            >
              {property.schema.__isPatternProperty ? (
                <span className="pattern-placeholder">{property.name}</span>
              ) : (
                property.name
              )}
            </span>
            {schemaType && <span className="type-badge">{schemaType}</span>}
            {property.required && (
              <span className="required-badge">required</span>
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
        <div className="schema-details">
          {property.schema.__isPatternProperty && property.schema.__pattern && (
            <div className="pattern-info">
              <code className="pattern-code">{property.schema.__pattern}</code>
            </div>
          )}
          {property.schema.description && (
            <div className="property-description-block">
              {property.schema.description}
            </div>
          )}

          {constraints.length > 0 && (
            <div className="constraints">
              {constraints.map((constraint, index) => (
                <span key={index} className="constraint">
                  {constraint.label}: {String(constraint.value)}
                </span>
              ))}
            </div>
          )}

          {property.schema.enum && (
            <div className="enum-values">
              <span className="enum-label">enum:</span>
              {property.schema.enum.map((value, index) => (
                <code
                  key={index}
                  className="enum-value"
                  onClick={handleCodeClick}
                  title="Click to copy"
                >
                  {JSON.stringify(value)}
                </code>
              ))}
            </div>
          )}

          {property.schema.default !== undefined && (
            <div className="default-value">
              <code onClick={handleCodeClick} title="Click to copy">
                {JSON.stringify(property.schema.default)}
              </code>
            </div>
          )}

          {includeExamples && property.schema.examples && (
            <div className="property-examples">
              <div className="examples-label">examples:</div>
              {property.schema.examples.map((example, index) => (
                <div key={index} className="highlighted-code">
                  <code onClick={handleCodeClick} title="Click to copy">
                    {JSON.stringify(example, null, 2)}
                  </code>
                </div>
              ))}
            </div>
          )}

          {hasNestedProperties && (
            <div className="nested-properties">
              {nestedProperties.map(nestedProp => {
                const nestedKey = nestedProp.path.join('.');
                const nestedState = propertyStates?.[nestedKey];
                return (
                  <PropertyComponent
                    key={nestedKey}
                    property={nestedProp}
                    propertyKey={nestedKey}
                    state={
                      nestedState || {
                        expanded: false,
                        hasDetails: true,
                        matchesSearch: true,
                      }
                    }
                    onToggle={() => toggleProperty?.(nestedKey)}
                    onCopy={onCopy}
                    onCopyLink={onCopyLink}
                    collapsible={collapsible}
                    includeExamples={includeExamples}
                    propertyStates={propertyStates}
                    rootSchema={rootSchema}
                    toggleProperty={toggleProperty}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions

// JSON Schema $ref resolver
function resolveReference(
  ref: string,
  rootSchema: JsonSchema
): JsonSchema | null {
  if (!ref.startsWith('#/')) {
    return null;
  }

  const path = ref.substring(2).split('/');
  let current: JsonSchema | unknown = rootSchema;

  for (const segment of path) {
    if (!current || typeof current !== 'object') {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current || null;
}

function resolveSchema(schema: JsonSchema, rootSchema: JsonSchema): JsonSchema {
  if (schema.$ref) {
    const resolved = resolveReference(schema.$ref, rootSchema);
    if (resolved) {
      const { $ref: _$ref, ...rest } = schema;
      return {
        ...resolved,
        ...rest,
        description: schema.description || resolved.description,
      };
    }
  }
  return schema;
}

function extractProperties(
  schema: JsonSchema,
  path: string[],
  depth: number,
  rootSchema: JsonSchema
): SchemaProperty[] {
  const properties: SchemaProperty[] = [];

  const resolvedSchema = resolveSchema(schema, rootSchema);
  const _required = new Set(resolvedSchema.required || []);

  // Handle regular properties
  if (resolvedSchema.properties) {
    Object.entries(resolvedSchema.properties).forEach(([name, propSchema]) => {
      const currentPath = [...path, name];
      const resolvedPropSchema = resolveSchema(propSchema, rootSchema);
      properties.push({
        name,
        schema: resolvedPropSchema,
        required: _required.has(name),
        path: currentPath,
        depth,
      });
    });
  }

  // Handle pattern properties
  if (resolvedSchema.patternProperties) {
    Object.entries(resolvedSchema.patternProperties).forEach(
      ([pattern, propSchema], index) => {
        // Use a safe key for pattern properties to avoid special characters
        const currentPath = [...path, `__pattern_${index}`];
        const resolvedPropSchema = resolveSchema(propSchema, rootSchema);

        // Create a synthetic schema that includes pattern information
        const syntheticSchema = {
          ...resolvedPropSchema,
          // Keep original description without pattern info
          description: resolvedPropSchema.description,
          // Add a custom property to identify this as a pattern property
          __isPatternProperty: true,
          __pattern: pattern,
        };

        properties.push({
          name: `{name}`,
          schema: syntheticSchema,
          required: false, // Pattern properties are never required individually
          path: currentPath,
          depth,
        });
      }
    );
  }

  return properties;
}

// Removed NestedPropertyComponent as we now use PropertyComponent recursively

// Remove this function since all properties are expandable now

function hasExamples(schema: JsonSchema): boolean {
  return !!(schema.examples && schema.examples.length > 0);
}

function getSchemaType(schema: JsonSchema): string {
  if (schema.type) {
    if (Array.isArray(schema.type)) {
      return schema.type.join(' | ');
    }
    return schema.type;
  }

  // Handle oneOf, anyOf, allOf schemas
  if (schema.oneOf) {
    const types = schema.oneOf
      .map(subSchema => getSchemaType(subSchema))
      .filter(Boolean)
      .filter((type, index, arr) => arr.indexOf(type) === index); // Remove duplicates
    return types.length > 0 ? types.join(' | ') : 'oneOf';
  }

  if (schema.anyOf) {
    const types = schema.anyOf
      .map(subSchema => getSchemaType(subSchema))
      .filter(Boolean)
      .filter((type, index, arr) => arr.indexOf(type) === index); // Remove duplicates
    return types.length > 0 ? types.join(' | ') : 'anyOf';
  }

  if (schema.allOf) {
    const types = schema.allOf
      .map(subSchema => getSchemaType(subSchema))
      .filter(Boolean)
      .filter((type, index, arr) => arr.indexOf(type) === index); // Remove duplicates
    return types.length > 0 ? types.join(' & ') : 'allOf';
  }

  if (schema.properties) return 'object';
  if (schema.items) return 'array';
  if (schema.enum) return 'enum';

  return '';
}

function getConstraints(schema: JsonSchema): PropertyConstraint[] {
  const constraints: PropertyConstraint[] = [];

  if (schema.format) {
    constraints.push({ type: 'format', label: 'format', value: schema.format });
  }

  if (schema.pattern) {
    constraints.push({
      type: 'pattern',
      label: 'pattern',
      value: schema.pattern,
    });
  }

  if (schema.minimum !== undefined) {
    constraints.push({ type: 'range', label: 'min', value: schema.minimum });
  }

  if (schema.maximum !== undefined) {
    constraints.push({ type: 'range', label: 'max', value: schema.maximum });
  }

  if (schema.minLength !== undefined) {
    constraints.push({
      type: 'length',
      label: 'minLength',
      value: schema.minLength,
    });
  }

  if (schema.maxLength !== undefined) {
    constraints.push({
      type: 'length',
      label: 'maxLength',
      value: schema.maxLength,
    });
  }

  if (schema.minItems !== undefined) {
    constraints.push({
      type: 'items',
      label: 'minItems',
      value: schema.minItems,
    });
  }

  if (schema.maxItems !== undefined) {
    constraints.push({
      type: 'items',
      label: 'maxItems',
      value: schema.maxItems,
    });
  }

  if (schema.multipleOf !== undefined) {
    constraints.push({
      type: 'multipleOf',
      label: 'multipleOf',
      value: schema.multipleOf,
    });
  }

  return constraints;
}

export default DeckardSchema;
