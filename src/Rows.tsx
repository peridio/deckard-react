import React from 'react';
import { SchemaProperty, PropertyState, JsonSchema } from './types';
import PropertyRow from './property/PropertyRow';
import NoAdditionalPropertiesRow from './NoAdditionalPropertiesRow';
import './Rows.styles.css';

interface RowsProps {
  properties: SchemaProperty[];
  propertyStates: Record<string, PropertyState>;
  onToggle: (propertyKey: string) => void;
  onCopy: (text: string, element: HTMLElement) => void;
  onCopyLink: (propertyKey: string, element: HTMLElement) => void;
  collapsible: boolean;
  includeExamples: boolean;
  examplesOnFocusOnly: boolean;
  rootSchema?: JsonSchema;
  toggleProperty?: (key: string) => void;
  focusedProperty?: string | null;
  onFocusChange?: (propertyKey: string | null) => void;
  showNoAdditionalProperties?: boolean;
  className?: string;
  options?: { defaultExampleLanguage?: 'json' | 'yaml' | 'toml' };
  searchQuery?: string;
  examplesHidden?: boolean;
}

const Rows: React.FC<RowsProps> = ({
  properties,
  propertyStates,
  onToggle,
  onCopy,
  onCopyLink,
  collapsible,
  includeExamples,
  examplesOnFocusOnly,
  rootSchema,
  toggleProperty,
  focusedProperty,
  onFocusChange,
  showNoAdditionalProperties = false,
  className = '',
  options,
  searchQuery,
  examplesHidden = false,
}) => {
  const rowsClasses = ['properties-rows', className].filter(Boolean).join(' ');

  return (
    <div className={rowsClasses}>
      {properties.map(property => {
        const propertyKey = property.path.join('.');
        const state = propertyStates[propertyKey];
        if (!state) return null;

        return (
          <PropertyRow
            key={propertyKey}
            property={property}
            propertyKey={propertyKey}
            state={state}
            onToggle={() => onToggle(propertyKey)}
            onCopy={onCopy}
            onCopyLink={onCopyLink}
            collapsible={collapsible}
            includeExamples={includeExamples}
            examplesOnFocusOnly={examplesOnFocusOnly}
            rootSchema={rootSchema}
            propertyStates={propertyStates}
            toggleProperty={toggleProperty}
            focusedProperty={focusedProperty}
            onFocusChange={onFocusChange}
            options={options}
            searchQuery={searchQuery}
            examplesHidden={examplesHidden}
          />
        );
      })}

      {showNoAdditionalProperties && <NoAdditionalPropertiesRow />}
    </div>
  );
};

export default Rows;
