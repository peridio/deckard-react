import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  JsonSchema,
  DeckardOptions,
  PropertyState,
  SearchState,
  SchemaProperty,
} from './types';
import { TooltipGlobalManagerProvider } from './components';
import './DeckardSchema.styles.css';
import './Row.styles.css';
import './property/PropertyRow.styles.css';
import './NoAdditionalPropertiesRow.styles.css';
import './inputs/Input.styles.css';
import './components/Divider.styles.css';
import './components/Badge.styles.css';
import './property/CodeSnippet.styles.css';
import './property/ExamplesPanel.styles.css';
import './Rows.styles.css';
import './components/Settings.styles.css';
import './inputs/RadioGroup.styles.css';
import { extractProperties, getSchemaType, resolveSchema } from './utils';
import Rows from './Rows';
import { Input } from './inputs';
import { Settings } from './components';

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
  examplesOnFocusOnly: true,
  searchable: true,
  collapsible: true,
  autoExpand: false,
  theme: 'auto',
  defaultExampleLanguage: 'yaml',
};

// Load settings from localStorage
const loadStoredSettings = (siteKey?: string): Partial<DeckardOptions> => {
  try {
    if (typeof window === 'undefined') return {};
    const key = siteKey || window.location.hostname;
    const storageKey = `deckard-settings-${key}`;

    const stored = localStorage.getItem(storageKey);
    const parsedSettings = stored ? JSON.parse(stored) : {};

    // Ensure searchable is explicitly enabled by default if not set
    if (parsedSettings.searchable === undefined) {
      parsedSettings.searchable = true;
    }
    return parsedSettings;
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
    return { searchable: true };
  }
};

// WeakMap to track timeouts for copy feedback, preventing race conditions
const copyTimeouts = new WeakMap<HTMLElement, NodeJS.Timeout>();

// Add CSS classes for copy feedback
const copyFeedbackStyles = `
.deckard-copy-success {
  background-color: #3b82f6 !important;
  color: white !important;
  transition: all 0.15s ease-in-out;
}

.deckard-link-copy-success {
  color: #3b82f6 !important;
  transition: all 0.15s ease-in-out;
}

.deckard-icon-copy-success {
  color: #3b82f6 !important;
  transition: all 0.15s ease-in-out;
}
`;

// Inject styles once
if (
  typeof document !== 'undefined' &&
  !document.getElementById('deckard-copy-styles')
) {
  const styleElement = document.createElement('style');
  styleElement.id = 'deckard-copy-styles';
  styleElement.textContent = copyFeedbackStyles;
  document.head.appendChild(styleElement);
}

export const DeckardSchema: React.FC<DeckardSchemaProps> = ({
  schema,
  options = {},
  className,
}) => {
  // Load settings from localStorage and merge with provided options
  const storedSettings = loadStoredSettings(
    typeof window !== 'undefined' ? window.location.hostname : 'default'
  );

  const [currentOptions, setCurrentOptions] = useState<DeckardOptions>(() => {
    const merged = {
      ...DEFAULT_OPTIONS,
      ...storedSettings,
      ...options, // Props override localStorage settings
    };

    // Ensure searchable is always explicitly set
    if (merged.searchable === undefined || merged.searchable === null) {
      merged.searchable = true;
    }

    return merged;
  });

  // Update stored settings when currentOptions changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const siteKey = window.location.hostname;
        const storageKey = `deckard-settings-${siteKey}`;
        localStorage.setItem(storageKey, JSON.stringify(currentOptions));
      } catch (error) {
        console.warn('Failed to persist settings to localStorage:', error);
      }
    }
  }, [currentOptions]);

  const mergedOptions = currentOptions;

  // Extract specific values to avoid dependency issues
  const {
    autoExpand,
    collapsible,
    searchable,
    includeHeader,
    includePropertiesTitle,
    includeExamples,
    examplesOnFocusOnly,
    includeDefinitions,
  } = mergedOptions;

  const [propertyStates, setPropertyStates] = useState<
    Record<string, PropertyState>
  >({});
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    visible: false,
    results: 0,
  });
  const [focusedProperty, setFocusedProperty] = useState<string | null>(null);

  const properties = useMemo(() => {
    const props = extractProperties(schema, [], 0, schema, []);
    // Sort properties alphabetically by name
    return props.sort((a, b) => a.name.localeCompare(b.name));
  }, [schema]);

  const filteredProperties = useMemo(() => {
    if (!searchState.query) return properties;

    const query = searchState.query.toLowerCase();

    return properties.filter(prop => {
      // Search field names
      if (prop.name.toLowerCase().includes(query)) return true;

      // Search descriptions
      if (prop.schema.description?.toLowerCase().includes(query)) return true;

      // Search schema type
      if (getSchemaType(prop.schema, schema).toLowerCase().includes(query))
        return true;

      // Search examples
      if (prop.schema.examples) {
        for (const example of prop.schema.examples) {
          const exampleText =
            typeof example === 'string' ? example : JSON.stringify(example);
          if (exampleText.toLowerCase().includes(query)) return true;
        }
      }

      return false;
    });
  }, [properties, searchState.query, schema]);

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
      const properties = extractProperties(schema, path, depth, rootSchema, []);

      properties.forEach(property => {
        const key = property.path.join('.');
        newStates[key] = {
          expanded: Boolean(autoExpand),
          hasDetails: true, // All fields are expandable now
          matchesSearch: true, // Always true initially
          isDirectMatch: false,
          hasNestedMatches: false,
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
  }, [schema, autoExpand, searchState.query]);

  // Handle URL hash navigation - only on mount
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash) {
      const fieldKey = hash.substring(1).replace(/-/g, '.');

      // Update property states to expand path to target
      setPropertyStates(prev => {
        const newStates = { ...prev };

        // Expand all parent paths to make the target field visible
        const pathParts = fieldKey.split('.');
        for (let i = 1; i <= pathParts.length; i++) {
          const parentPath = pathParts.slice(0, i).join('.');
          if (newStates[parentPath]) {
            newStates[parentPath] = {
              ...newStates[parentPath],
              expanded: true,
            };
          }
        }

        return newStates;
      });

      // Set the focused property state for proper styling
      setFocusedProperty(fieldKey);

      // Focus and scroll to the target property after React renders
      setTimeout(() => {
        if (typeof document !== 'undefined') {
          const targetElement = document.getElementById(
            fieldKey.replace(/\./g, '-')
          );
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
            targetElement.focus({ preventScroll: true });
          }
        }
      }, 100);
    }
  }, []); // Empty dependency array - only run on mount

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

      // When searching, collapse everything first, then expand matches
      if (query && collapsible) {
        const newStates = { ...propertyStates };
        const queryLower = query.toLowerCase();

        // First, collapse everything
        Object.keys(newStates).forEach(key => {
          if (newStates[key]) {
            newStates[key] = {
              ...newStates[key],
              expanded: false,
              matchesSearch: false,
              isDirectMatch: false,
              hasNestedMatches: false,
            };
          }
        });

        // Then find and mark direct matches
        const directMatches = new Set<string>();
        Object.keys(newStates).forEach(key => {
          const pathSegments = key.split('.');

          // Find the property in the schema to check for matches
          let currentSchema = schema;

          for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];
            if (currentSchema.properties?.[segment]) {
              currentSchema = currentSchema.properties[segment];
              if (i === pathSegments.length - 1) {
                // Check if this property matches search
                const matches =
                  segment.toLowerCase().includes(queryLower) ||
                  currentSchema.description
                    ?.toLowerCase()
                    .includes(queryLower) ||
                  getSchemaType(currentSchema, schema)
                    .toLowerCase()
                    .includes(queryLower) ||
                  (currentSchema.examples &&
                    currentSchema.examples.some(example => {
                      const exampleText =
                        typeof example === 'string'
                          ? example
                          : JSON.stringify(example);
                      return exampleText.toLowerCase().includes(queryLower);
                    })) ||
                  false;

                if (matches) {
                  directMatches.add(key);
                }
              }
            }
          }
        });

        // Mark direct matches and propagate up parent chain

        directMatches.forEach(matchKey => {
          // Mark the direct match
          if (newStates[matchKey]) {
            newStates[matchKey] = {
              ...newStates[matchKey],
              expanded: true,
              matchesSearch: true,
              isDirectMatch: true,
            };
          }

          // Propagate up the parent chain
          const pathSegments = matchKey.split('.');
          for (let i = pathSegments.length - 1; i > 0; i--) {
            const parentKey = pathSegments.slice(0, i).join('.');
            if (newStates[parentKey]) {
              newStates[parentKey] = {
                ...newStates[parentKey],
                expanded: true,
                matchesSearch: true,
                hasNestedMatches: true,
              };
            }
          }
        });

        setPropertyStates(newStates);
      } else if (!query) {
        // When clearing search, reset to default state
        const newStates = { ...propertyStates };
        Object.keys(newStates).forEach(key => {
          if (newStates[key]) {
            newStates[key] = {
              ...newStates[key],
              expanded: Boolean(autoExpand),
              matchesSearch: true,
              isDirectMatch: false,
              hasNestedMatches: false,
            };
          }
        });
        setPropertyStates(newStates);
      }
    },
    [propertyStates, collapsible, schema, autoExpand]
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

  // Navigation helpers
  const focusProperty = useCallback((propertyKey: string) => {
    setFocusedProperty(propertyKey);
    setTimeout(() => {
      if (typeof document === 'undefined' || typeof window === 'undefined') {
        return;
      }

      const element = document.querySelector(
        `[data-property-key="${propertyKey}"]`
      ) as HTMLElement;
      if (element) {
        // Focus the header container to trigger :focus-within like clicking does
        const headerContainer = element.querySelector(
          '.property-header-container'
        ) as HTMLElement;
        if (headerContainer) {
          headerContainer.focus();
        } else {
          element.setAttribute('tabindex', '-1');
          element.focus();
        }

        const rect = element.getBoundingClientRect();
        const viewportHeight =
          typeof window !== 'undefined' ? window.innerHeight : 0;
        const isInView = rect.top >= 0 && rect.bottom <= viewportHeight;

        // Only scroll if the element is not fully visible
        if (!isInView) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 50);
  }, []);

  const getAllNavigableProperties = useCallback(() => {
    const navigable: Array<{ key: string; depth: number; path: string[] }> = [];
    const processedPaths = new Set<string>();

    const addProperty = (prop: SchemaProperty, currentDepth = 0) => {
      const key = prop.path.join('.');

      // Prevent infinite recursion and excessive depth
      if (processedPaths.has(key) || currentDepth > 20) {
        return;
      }

      processedPaths.add(key);
      navigable.push({ key, depth: prop.depth, path: prop.path });

      // Add nested properties if parent is expanded
      if (propertyStates[key]?.expanded && prop.schema) {
        const allNestedProps: SchemaProperty[] = [];

        // First, collect regular nested properties
        const nested = extractProperties(
          prop.schema,
          prop.path,
          prop.depth + 1,
          schema,
          []
        );
        allNestedProps.push(...nested);

        // Then, collect allOf properties if they exist
        if (prop.schema.allOf) {
          prop.schema.allOf.forEach(allOfSchema => {
            const resolvedSchema = resolveSchema(allOfSchema, schema);
            if (resolvedSchema.properties || resolvedSchema.patternProperties) {
              const allOfPath = [...prop.path, 'allof'];
              const allOfProps = extractProperties(
                resolvedSchema,
                allOfPath,
                prop.depth + 1,
                schema,
                []
              );
              allNestedProps.push(...allOfProps);
            }
          });
        }

        // Sort all nested properties together alphabetically
        allNestedProps.sort((a, b) => a.name.localeCompare(b.name));
        allNestedProps.forEach(nestedProp =>
          addProperty(nestedProp, currentDepth + 1)
        );
      }
    };

    filteredProperties.forEach(prop => addProperty(prop, 0));

    return navigable;
  }, [filteredProperties, propertyStates, schema]);

  const getCurrentFocusedPropertyKey = useCallback(() => {
    if (typeof document === 'undefined') return null;
    const activeElement = document.activeElement;
    // Check if the active element has data-property-key
    if (activeElement && activeElement.hasAttribute('data-property-key')) {
      return activeElement.getAttribute('data-property-key');
    }
    // Check if the active element is inside a property (header-container case)
    const propertyElement = activeElement?.closest('[data-property-key]');
    if (propertyElement) {
      return propertyElement.getAttribute('data-property-key');
    }
    return null;
  }, []);

  const handleNavigation = useCallback(
    (direction: 'h' | 'j' | 'k' | 'l') => {
      const navigableProperties = getAllNavigableProperties();

      if (navigableProperties.length === 0) return;

      const currentFocusedKey = getCurrentFocusedPropertyKey();

      // If no property is focused, focus the first one
      if (!currentFocusedKey) {
        const firstKey = navigableProperties[0].key;
        focusProperty(firstKey);
        return;
      }

      const currentIndex = navigableProperties.findIndex(
        p => p.key === currentFocusedKey
      );
      const currentProperty = navigableProperties[currentIndex];

      if (currentIndex === -1) {
        // Current focused element is not in filtered list, focus first
        const firstKey = navigableProperties[0].key;
        focusProperty(firstKey);
        return;
      }

      switch (direction) {
        case 'j': // Down - next property
          if (currentIndex < navigableProperties.length - 1) {
            const nextKey = navigableProperties[currentIndex + 1].key;
            focusProperty(nextKey);
          }
          break;

        case 'k': // Up - previous property
          if (currentIndex > 0) {
            const prevKey = navigableProperties[currentIndex - 1].key;
            focusProperty(prevKey);
          }
          break;

        case 'l': // Right - expand if collapsed, or move to first child
          if (collapsible && propertyStates[currentFocusedKey]) {
            if (!propertyStates[currentFocusedKey].expanded) {
              // Expand the current property
              toggleProperty(currentFocusedKey);
            } else {
              // Move to first child if any
              const childIndex = currentIndex + 1;
              if (childIndex < navigableProperties.length) {
                const nextProp = navigableProperties[childIndex];
                if (nextProp.depth > currentProperty.depth) {
                  focusProperty(nextProp.key);
                }
              }
            }
          }
          break;

        case 'h': // Left - collapse if expanded, or move to parent
          if (collapsible && propertyStates[currentFocusedKey]) {
            if (propertyStates[currentFocusedKey].expanded) {
              // Collapse the current property
              toggleProperty(currentFocusedKey);
            } else {
              // Move to parent
              if (currentProperty.depth > 0) {
                const parentPath = currentProperty.path.slice(0, -1);
                const parentKey = parentPath.join('.');
                const parentIndex = navigableProperties.findIndex(
                  p => p.key === parentKey
                );
                if (parentIndex !== -1) {
                  focusProperty(parentKey);
                }
              }
            }
          }
          break;
      }
    },
    [
      getCurrentFocusedPropertyKey,
      getAllNavigableProperties,
      propertyStates,
      collapsible,
      toggleProperty,
      focusProperty,
    ]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip navigation if user is typing in an input
      if (
        typeof document !== 'undefined' &&
        document.activeElement?.tagName === 'INPUT'
      ) {
        // Only handle Escape in input fields
        if (e.key === 'Escape') {
          clearSearch();
        }
        return;
      }

      // Tooltip shimmer effect on Ctrl key
      if (e.key === 'Control' && !e.repeat) {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.add('tooltips-shimmer');
        }
      }

      // Always prevent default for hjkl keys to stop page scrolling
      if (['h', 'j', 'k', 'l'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Search shortcut: Shift + /
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        if (typeof document !== 'undefined') {
          const searchInput = document.querySelector(
            '.input.input-search'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        return;
      }

      // hjkl navigation
      if (['h', 'j', 'k', 'l'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleNavigation(e.key.toLowerCase() as 'h' | 'j' | 'k' | 'l');
        return;
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

    const handleKeyUp = (e: KeyboardEvent) => {
      // Remove tooltip shimmer effect on Ctrl key release
      if (e.key === 'Control') {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('tooltips-shimmer');
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown, { capture: true });
      document.addEventListener('keyup', handleKeyUp, { capture: true });
      return () => {
        document.removeEventListener('keydown', handleKeyDown, {
          capture: true,
        });
        document.removeEventListener('keyup', handleKeyUp, {
          capture: true,
        });
      };
    }
  }, [clearSearch, expandAll, collapseAll, handleNavigation]);

  // Click away to clear focused property
  useEffect(() => {
    const handleClickAway = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't clear focus if clicking on a property field or its children
      if (target.closest('.property')) {
        return;
      }

      // Clear the focused property
      setFocusedProperty(null);
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleClickAway);
      return () => document.removeEventListener('click', handleClickAway);
    }
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, element?: HTMLElement) => {
      try {
        await navigator.clipboard.writeText(text);

        if (element) {
          // Clear any existing timeout for this element
          const existingTimeout = copyTimeouts.get(element);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Always ensure clean state before applying new feedback
          element.classList.remove(
            'deckard-copy-success',
            'deckard-link-copy-success',
            'deckard-icon-copy-success'
          );

          // Check if this is an examples copy button (icon-only feedback)
          const isExamplesCopyButton =
            element.classList.contains('copy-button') ||
            element.classList.contains('example-copy-button');

          if (isExamplesCopyButton) {
            element.classList.add('deckard-icon-copy-success');
          } else {
            element.classList.add('deckard-copy-success');
          }

          const timeoutId = setTimeout(() => {
            element.classList.remove(
              'deckard-copy-success',
              'deckard-link-copy-success',
              'deckard-icon-copy-success'
            );
            copyTimeouts.delete(element);
          }, 1000);

          copyTimeouts.set(element, timeoutId);
        }
      } catch (err) {
        console.warn('Failed to copy to clipboard:', err);
      }
    },
    []
  );

  const copyFieldLink = useCallback(
    async (propertyKey: string, element: HTMLElement) => {
      if (typeof window === 'undefined') {
        return;
      }

      const anchor = `#${propertyKey}`;
      const url = `${window.location.origin}${window.location.pathname}${anchor}`;

      // Update the URL in the address bar (this will trigger native browser scrolling)
      window.location.hash = anchor;

      // Focus the current element
      element.focus();

      try {
        await navigator.clipboard.writeText(url);

        // Clear any existing timeout for this element
        const existingTimeout = copyTimeouts.get(element);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Always ensure clean state before applying new feedback
        element.classList.remove(
          'deckard-copy-success',
          'deckard-link-copy-success',
          'deckard-icon-copy-success'
        );

        // Apply success styling via CSS class
        element.classList.add('deckard-link-copy-success');

        // Set new timeout
        const timeoutId = setTimeout(() => {
          element.classList.remove(
            'deckard-copy-success',
            'deckard-link-copy-success',
            'deckard-icon-copy-success'
          );
          copyTimeouts.delete(element);
        }, 1000);

        copyTimeouts.set(element, timeoutId);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    },
    []
  );

  const handleSettingsChange = useCallback(
    (newOptions: Partial<DeckardOptions>) => {
      setCurrentOptions(prev => ({ ...prev, ...newOptions }));
    },
    []
  );

  return (
    <TooltipGlobalManagerProvider>
      <>
        <div className={`schema-container ${className}`}>
          {includeHeader && schema.title && (
            <div className="schema-header">
              <h1>{schema.title}</h1>
              {schema.description && (
                <p className="schema-description">{schema.description}</p>
              )}
            </div>
          )}
          {includePropertiesTitle && (
            <div className="properties-header">
              <h2>Properties</h2>
              <Settings
                options={currentOptions}
                onChange={handleSettingsChange}
                siteKey={
                  typeof window !== 'undefined'
                    ? window.location.hostname
                    : 'default'
                }
              />
            </div>
          )}
          {!includePropertiesTitle && (
            <div className="settings-only-header">
              <Settings
                options={currentOptions}
                onChange={handleSettingsChange}
                siteKey={
                  typeof window !== 'undefined'
                    ? window.location.hostname
                    : 'default'
                }
              />
            </div>
          )}

          {searchable && (
            <div className="schema-search">
              <Input
                type="search"
                variant="search"
                size="md"
                placeholder="Search properties... (press Shift+/)"
                value={searchState.query}
                onChange={e => handleSearch(e.target.value)}
                tabIndex={1}
              />
            </div>
          )}
          <div className="properties-section">
            {filteredProperties.length === 0 && searchState.query ? (
              <div className="no-search-results">
                <div className="no-search-results-icon">🔍</div>
                <div className="no-search-results-message">
                  <h3>No properties match your search</h3>
                  <p>
                    Try adjusting your search terms or clearing the search to
                    see all properties.
                  </p>
                </div>
              </div>
            ) : (
              <Rows
                className="properties-list"
                properties={filteredProperties}
                propertyStates={propertyStates}
                onToggle={toggleProperty}
                onCopy={copyToClipboard}
                onCopyLink={copyFieldLink}
                collapsible={Boolean(collapsible)}
                includeExamples={Boolean(includeExamples)}
                examplesOnFocusOnly={Boolean(examplesOnFocusOnly)}
                rootSchema={schema}
                toggleProperty={toggleProperty}
                focusedProperty={focusedProperty}
                onFocusChange={setFocusedProperty}
                showNoAdditionalProperties={
                  schema.additionalProperties === false && !searchState.query
                }
                options={{
                  defaultExampleLanguage: currentOptions.defaultExampleLanguage,
                }}
                searchQuery={searchState.query}
              />
            )}
          </div>
          {includeDefinitions && schema.definitions && (
            <div className="definitions-section">
              <h2>Definitions</h2>
              {Object.entries(schema.definitions).map(([name, def]) => (
                <div key={name} className="definition">
                  <h3>{name}</h3>
                  <DeckardSchema
                    schema={def}
                    options={{
                      ...options,
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
    </TooltipGlobalManagerProvider>
  );
};

export default DeckardSchema;
