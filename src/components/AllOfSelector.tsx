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
      description: '',
    };

    const descriptions: string[] = [];
    const allRequired = new Set<string>();

    resolvedOptions.forEach((option, _index) => {
      // Collect descriptions
      if (option.description) {
        descriptions.push(option.description);
      }

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

    // Combine descriptions
    if (descriptions.length > 0) {
      merged.description = descriptions.join(' ');
    }

    return merged;
  }, [allOfOptions, rootSchema]);

  // Extract properties from the merged schema
  const mergedProperties = useMemo(() => {
    if (!mergedSchema.properties && !mergedSchema.patternProperties) {
      return [];
    }

    // Create unique path for allOf content
    const allOfPath = [...propertyPath, 'allof'];

    const properties = extractProperties(
      mergedSchema,
      allOfPath,
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
        {mergedSchema.description && (
          <div className="allof-description">
            <div className="property-description-block">
              {mergedSchema.description}
            </div>
          </div>
        )}

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
              toggleProperty={handleAllOfToggle}
              focusedProperty={focusedProperty}
              onFocusChange={onFocusChange}
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
