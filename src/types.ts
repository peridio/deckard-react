// JSON Schema value types
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface JsonSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type?: SchemaType | SchemaType[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema | JsonSchema[];
  required?: string[];
  enum?: JsonValue[];
  const?: JsonValue;
  default?: JsonValue;
  examples?: JsonValue[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | JsonSchema;
  additionalItems?: boolean | JsonSchema;
  patternProperties?: Record<string, JsonSchema>;
  dependencies?: Record<string, JsonSchema | string[]>;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  definitions?: Record<string, JsonSchema>;
  $defs?: Record<string, JsonSchema>;
  $ref?: string;
  if?: JsonSchema;
  then?: JsonSchema;
  else?: JsonSchema;
  contentMediaType?: string;
  contentEncoding?: string;
  multipleOf?: number;
  contains?: JsonSchema;
  propertyNames?: JsonSchema;
  unevaluatedProperties?: boolean | JsonSchema;
  unevaluatedItems?: boolean | JsonSchema;
  // Synthetic properties for pattern properties support
  __isPatternProperty?: boolean;
  __pattern?: string;
}

export type SchemaType =
  | 'null'
  | 'boolean'
  | 'object'
  | 'array'
  | 'number'
  | 'integer'
  | 'string';

export interface SchemaProperty {
  name: string;
  schema: JsonSchema;
  required: boolean;
  path: string[];
  depth: number;
}

export interface PropertyConstraint {
  type:
    | 'format'
    | 'pattern'
    | 'length'
    | 'range'
    | 'items'
    | 'properties'
    | 'enum'
    | 'const'
    | 'multipleOf';
  label: string;
  value: string | number | boolean;
}

export interface DeckardOptions {
  includeHeader?: boolean;
  includePropertiesTitle?: boolean;
  includeDefinitions?: boolean;
  includeExamples?: boolean;
  examplesOnFocusOnly?: boolean;
  searchable?: boolean;
  collapsible?: boolean;
  autoExpand?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  defaultExampleLanguage?: 'json' | 'yaml' | 'toml';
}

export interface ExampleFormats {
  json?: string;
  yaml?: string;
  toml?: string;
}

export interface PropertyState {
  expanded: boolean;
  hasDetails: boolean;
  matchesSearch: boolean;
  isDirectMatch?: boolean;
  hasNestedMatches?: boolean;
}

export interface SearchState {
  query: string;
  visible: boolean;
  results: number;
}

export interface KeyboardShortcuts {
  search: string;
  expandAll: string;
  collapseAll: string;
  clearSearch: string;
}
