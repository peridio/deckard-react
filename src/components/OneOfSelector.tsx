import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { JsonSchema, PropertyState } from '../types';
import {
  resolveSchema,
  extractProperties,
  searchInSchema,
  propertyKeyToHash,
  hashToPropertyKey,
  hasExamples,
} from '../utils';
import { Badge } from './Badge';
import ExamplesPanel from '../property/ExamplesPanel';
import ResponsiveSchemaLayout from './ResponsiveSchemaLayout';

import Rows from '../Rows';

import './OneOfSelector.styles.css';

interface OneOfSelectorProps {
  oneOfOptions: JsonSchema[];
  rootSchema: JsonSchema;
  propertyPath?: string[];
  _onCopy?: (text: string, element: HTMLElement) => void;
  onCopyLink?: (propertyKey: string, element: HTMLElement) => void;
  propertyStates?: Record<string, PropertyState>;
  toggleProperty?: (key: string) => void;
  focusedProperty?: string | null;
  onFocusChange?: (propertyKey: string | null) => void;
  options?: { defaultExampleLanguage?: 'json' | 'yaml' | 'toml' };
  searchQuery?: string;
  initialSelectedIndex?: number;
  hideDescription?: boolean;
  disableNestedExamples?: boolean;
  renderNestedProperties?: boolean;
  separateNestedProperties?: boolean;
  onSelectionChange?: (
    selectedIndex: number,
    selectedOption: JsonSchema
  ) => void;
  isActiveRoute?: boolean;
  propertyKey?: string;
}

const OneOfSelector: React.FC<OneOfSelectorProps> = ({
  oneOfOptions,
  rootSchema,
  propertyPath = [],
  _onCopy,
  onCopyLink,
  propertyStates: _propertyStates = {},
  toggleProperty,
  focusedProperty,
  onFocusChange,
  options,
  searchQuery,
  initialSelectedIndex = 0,
  hideDescription: _hideDescription = false,
  disableNestedExamples = false,
  renderNestedProperties = true,
  separateNestedProperties: _separateNestedProperties = false,
  onSelectionChange,
  isActiveRoute = false,
  propertyKey,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);

  // Listen for hash changes to sync selectedIndex
  useEffect(() => {
    if (
      !isActiveRoute ||
      !propertyKey ||
      typeof window === 'undefined' ||
      !oneOfOptions.length
    ) {
      return;
    }

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const propertyKeyFromHash = hashToPropertyKey(hash);

      // Only update if the hash is for this property
      if (propertyKeyFromHash.startsWith(propertyKey)) {
        const pathParts = propertyKeyFromHash.split('.');
        const oneOfIndexStr = pathParts.find(
          (part, index) =>
            pathParts[index - 1] === 'oneOf' && !isNaN(Number(part))
        );

        if (oneOfIndexStr !== undefined) {
          const hashIndex = parseInt(oneOfIndexStr, 10);
          if (
            hashIndex >= 0 &&
            hashIndex < oneOfOptions.length &&
            hashIndex !== selectedIndex
          ) {
            setSelectedIndex(hashIndex);
          }
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isActiveRoute, propertyKey, oneOfOptions.length, selectedIndex]);

  const resolvedOptions = useMemo(
    () => oneOfOptions.map(option => resolveSchema(option, rootSchema)),
    [oneOfOptions, rootSchema]
  );

  const getOptionDisplay = useCallback(
    (option: JsonSchema, index: number) => {
      // Check for search hit status
      let searchHitStatus = 'none';
      if (searchQuery?.trim()) {
        const hasMatch = searchInSchema(option, rootSchema, searchQuery, true);
        if (hasMatch) {
          searchHitStatus = 'direct'; // OneOf options are considered direct matches when they contain search hits
        }
      }

      // Check for title first, use it if available
      if (option.title) {
        return {
          label: option.title,
          type: option.type || 'object',
          isReference: Boolean(oneOfOptions[index].$ref),
          searchHitStatus,
        };
      }

      // If this is a $ref to a complex object, show a cleaner name
      if (oneOfOptions[index].$ref) {
        const refName = oneOfOptions[index].$ref?.split('/').pop() || 'object';
        // Capitalize and make it more readable
        const displayName = refName.charAt(0).toUpperCase() + refName.slice(1);
        return {
          label: displayName,
          type: 'object',
          isReference: true,
          searchHitStatus,
        };
      }

      // For primitive types
      if (option.type) {
        const types = Array.isArray(option.type) ? option.type : [option.type];
        return {
          label: types.join(' | '),
          type: types.join(' | '),
          isReference: false,
          searchHitStatus,
        };
      }

      return {
        label: 'Unknown',
        type: 'unknown',
        isReference: false,
        searchHitStatus,
      };
    },
    [oneOfOptions, searchQuery, rootSchema]
  );

  const optionDisplays = resolvedOptions.map(getOptionDisplay);

  // Extract properties for the selected option using our standard extraction
  const selectedProperties = useMemo(() => {
    const currentOption = resolvedOptions[selectedIndex];
    if (!currentOption?.properties) {
      return [];
    }

    // Use the provided property path to maintain context for pattern properties
    // Always append oneOf selection to maintain proper hierarchy
    const basePath = [...propertyPath, 'oneOf', selectedIndex.toString()];
    const properties = extractProperties(
      currentOption,
      basePath,
      0,
      rootSchema,
      []
    );

    // Sort properties alphabetically by name
    return properties.sort((a, b) => a.name.localeCompare(b.name));
  }, [resolvedOptions, selectedIndex, rootSchema, propertyPath]);

  // Create isolated property states for oneOf properties - completely independent
  const [internalPropertyStates, setInternalPropertyStates] = useState<
    Record<string, PropertyState>
  >({});

  // Only initialize states when selectedIndex changes, not on every render
  const oneOfPropertyStates = useMemo(() => {
    const states: Record<string, PropertyState> = {};
    selectedProperties.forEach(prop => {
      const key = prop.path.join('.');
      // Use internal state first, then defaults - don't depend on external propertyStates
      states[key] = internalPropertyStates[key] || {
        expanded: false,
        hasDetails: true,
        matchesSearch: true,
        isDirectMatch: false,
        hasNestedMatches: false,
      };
    });
    return states;
  }, [selectedProperties, internalPropertyStates]);

  // Internal toggle handler that doesn't depend on external state
  const handleInternalToggle = useCallback(
    (propertyKey: string) => {
      setInternalPropertyStates(prev => ({
        ...prev,
        [propertyKey]: {
          ...prev[propertyKey],
          expanded: !prev[propertyKey]?.expanded,
          hasDetails: true,
          matchesSearch: true,
          isDirectMatch: false,
          hasNestedMatches: false,
        },
      }));
      // Still call the external toggle if provided
      toggleProperty?.(propertyKey);
    },
    [toggleProperty]
  );

  const selectedOptionDescription = resolvedOptions[selectedIndex]?.description;
  const selectedOption = resolvedOptions[selectedIndex];
  const selectedOptionHasExamples =
    selectedOption && hasExamples(selectedOption, rootSchema);

  const leftContent = (
    <div className="oneof-left-section">
      <div className="oneof-tabs">
        {optionDisplays.map((display, index) => (
          <button
            key={index}
            className={`oneof-tab ${selectedIndex === index ? 'active' : ''} ${
              display.searchHitStatus !== 'none'
                ? `search-hit ${display.searchHitStatus}-hit`
                : ''
            }`}
            onClick={() => {
              setSelectedIndex(index);
              if (onSelectionChange) {
                onSelectionChange(index, resolvedOptions[index]);
              }

              // Update hash if this property is the active route
              if (
                isActiveRoute &&
                propertyKey &&
                typeof window !== 'undefined'
              ) {
                const currentHash = window.location.hash;
                const currentPropertyKey = hashToPropertyKey(currentHash);

                // Only update if this property matches the current hash
                if (currentPropertyKey.startsWith(propertyKey)) {
                  const newPropertyKey = `${propertyKey}.oneOf.${index}`;
                  const newHash = `#${propertyKeyToHash(newPropertyKey)}`;
                  window.history.replaceState(null, '', newHash);
                }
              }
            }}
            title={
              display.isReference
                ? `Complex object: ${display.label}${display.searchHitStatus !== 'none' ? ' (matches search)' : ''}`
                : `Primitive types: ${display.type}${display.searchHitStatus !== 'none' ? ' (matches search)' : ''}`
            }
          >
            <Badge
              variant={display.isReference ? 'reference' : 'type'}
              size="md"
              className={`${selectedIndex === index ? 'selected' : 'unselected'} ${
                display.searchHitStatus !== 'none'
                  ? `search-hit ${display.searchHitStatus}-hit`
                  : ''
              }`}
            >
              {display.label}
            </Badge>
          </button>
        ))}
      </div>
      {selectedOptionDescription && (
        <div className="oneof-description">
          <div className="property-description-block">
            {selectedOptionDescription}
          </div>
        </div>
      )}
    </div>
  );

  const rightContent =
    !disableNestedExamples && selectedOptionHasExamples ? (
      <div className="oneof-examples-section">
        <ExamplesPanel
          currentProperty={selectedOption}
          rootSchema={rootSchema}
          propertyPath={[...propertyPath, 'oneOf', selectedIndex.toString()]}
          options={options}
        />
      </div>
    ) : null;

  return (
    <div className="oneof-selector">
      <ResponsiveSchemaLayout
        leftContent={leftContent}
        rightContent={rightContent}
        className="oneof-main-content"
        hasSplit={!disableNestedExamples && selectedOptionHasExamples}
      />
      {renderNestedProperties && selectedProperties.length > 0 && (
        <div className="oneof-nested-properties">
          <Rows
            className="nested-properties"
            properties={selectedProperties}
            propertyStates={oneOfPropertyStates}
            onToggle={handleInternalToggle}
            onCopy={_onCopy || (() => {})}
            onCopyLink={onCopyLink || (() => {})}
            collapsible={true}
            includeExamples={!disableNestedExamples}
            examplesOnFocusOnly={false}
            rootSchema={rootSchema}
            toggleProperty={handleInternalToggle}
            focusedProperty={focusedProperty}
            onFocusChange={onFocusChange}
            options={options}
            searchQuery={searchQuery}
            examplesHidden={disableNestedExamples}
          />
        </div>
      )}
    </div>
  );
};

export default OneOfSelector;
