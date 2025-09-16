import React, { useMemo, useCallback } from 'react';
import { JsonSchema, PropertyState } from '../types';
import { resolveSchema, extractProperties } from '../utils';

import Rows from '../Rows';
import './AllOfSelector.styles.css';

interface AllOfSelectorProps {
  allOfOptions: JsonSchema[];
  rootSchema: JsonSchema;
  _onCopy?: (text: string, element: HTMLElement) => void;
  onCopyLink?: (propertyKey: string, element: HTMLElement) => void;
  propertyStates?: Record<string, PropertyState>;
  toggleProperty?: (key: string) => void;
  focusedProperty?: string | null;
  onFocusChange?: (propertyKey: string | null) => void;
  propertyPath?: string[];
  options?: { defaultExampleLanguage?: 'json' | 'yaml' | 'toml' };
  searchQuery?: string;
}

const AllOfSelector: React.FC<AllOfSelectorProps> = ({
  allOfOptions,
  rootSchema,
  _onCopy,
  onCopyLink,
  propertyStates = {},
  toggleProperty,
  focusedProperty,
  onFocusChange,
  propertyPath = [],
  options,
  searchQuery,
}) => {
  // Resolve all schemas and merge them
  const mergedSchema = useMemo(() => {
    const resolvedOptions = allOfOptions.map(option => {
      return resolveSchema(option, rootSchema);
    });

    // Merge all schemas into one
    const merged: JsonSchema = {
      type: 'object',
      properties: {},
      required: [],
    };

    const allRequired = new Set<string>();

    resolvedOptions.forEach((option, _index) => {
      // Merge properties
      if (option.properties) {
        merged.properties = {
          ...merged.properties,
          ...option.properties,
        };
      }

      // Merge pattern properties
      if (option.patternProperties) {
        merged.patternProperties = {
          ...merged.patternProperties,
          ...option.patternProperties,
        };
      }

      // Collect required fields from all schemas
      if (option.required) {
        option.required.forEach(req => allRequired.add(req));
      }

      // Merge other properties
      if (option.additionalProperties !== undefined) {
        merged.additionalProperties = option.additionalProperties;
      }
    });

    // Set merged required fields
    merged.required = Array.from(allRequired);

    return merged;
  }, [allOfOptions, rootSchema]);

  // Extract properties from the merged schema
  const mergedProperties = useMemo(() => {
    if (!mergedSchema.properties && !mergedSchema.patternProperties) {
      return [];
    }

    // Create path for allOf content without adding 'allof' segment to avoid it appearing in anchors
    const properties = extractProperties(
      mergedSchema,
      propertyPath,
      0,
      rootSchema,
      []
    );

    // Sort properties alphabetically by name
    return properties.sort((a, b) => a.name.localeCompare(b.name));
  }, [mergedSchema, rootSchema, propertyPath]);

  // Create property states for allOf properties
  const allOfPropertyStates = useMemo(() => {
    const states: Record<string, PropertyState> = {};
    mergedProperties.forEach(prop => {
      const key = prop.path.join('.');
      states[key] = propertyStates?.[key] || {
        expanded: false,
        hasDetails: true,
        matchesSearch: true,
        isDirectMatch: false,
        hasNestedMatches: false,
      };
    });

    return states;
  }, [mergedProperties, propertyStates]);

  // Internal toggle handler for allOf properties
  const handleAllOfToggle = useCallback(
    (propertyKey: string) => {
      // Call the external toggle if provided
      toggleProperty?.(propertyKey);
    },
    [toggleProperty]
  );

  return (
    <div className="allof-selector">
      <div className="allof-content">
        {/* Show merged properties using our standard Rows component */}
        {mergedProperties.length > 0 && (
          <div className="allof-properties">
            <Rows
              className="properties-list"
              properties={mergedProperties}
              propertyStates={allOfPropertyStates}
              onToggle={handleAllOfToggle}
              onCopy={_onCopy || (() => {})}
              onCopyLink={onCopyLink || (() => {})}
              collapsible={true}
              includeExamples={true}
              examplesOnFocusOnly={false}
              rootSchema={rootSchema}
              toggleProperty={toggleProperty}
              focusedProperty={focusedProperty}
              onFocusChange={onFocusChange}
              options={options}
              searchQuery={searchQuery}
            />
          </div>
        )}

        {mergedProperties.length === 0 && (
          <div className="allof-empty">
            <p>No properties found in the combined schemas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOfSelector;
