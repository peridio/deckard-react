import { JsonSchema, SchemaProperty } from '../types';
import { extractProperties, getSchemaType } from '../utils';

export type SearchHitType = 'none' | 'direct' | 'indirect' | 'both';

export interface SearchResult {
  hitType: SearchHitType;
  shouldExpand: boolean;
}

/**
 * Evaluates if a property matches the search query directly
 */
function isDirectMatch(property: SchemaProperty, query: string): boolean {
  const queryLower = query.toLowerCase();
  const schema = property.schema;

  // Check property name
  if (property.name.toLowerCase().includes(queryLower)) {
    return true;
  }

  // Check description
  if (schema.description?.toLowerCase().includes(queryLower)) {
    return true;
  }

  // Check type
  if (getSchemaType(schema).toLowerCase().includes(queryLower)) {
    return true;
  }

  // Check examples
  if (
    schema.examples?.some(example => {
      const exampleText =
        typeof example === 'string' ? example : JSON.stringify(example);
      return exampleText.toLowerCase().includes(queryLower);
    })
  ) {
    return true;
  }

  // Check oneOf item descriptions
  if (schema.oneOf) {
    for (const oneOfItem of schema.oneOf) {
      if (oneOfItem.description?.toLowerCase().includes(queryLower)) {
        return true;
      }
    }
  }

  // Check anyOf item descriptions
  if (schema.anyOf) {
    for (const anyOfItem of schema.anyOf) {
      if (anyOfItem.description?.toLowerCase().includes(queryLower)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Recursively checks if a property has any nested matches
 */
function hasNestedMatches(
  property: SchemaProperty,
  query: string,
  rootSchema: JsonSchema,
  visitedPaths: Set<string> = new Set()
): boolean {
  const pathKey = property.path.join('.');

  // Prevent infinite recursion
  if (visitedPaths.has(pathKey)) {
    return false;
  }
  visitedPaths.add(pathKey);

  // Get nested properties
  const nestedProperties = extractProperties(
    property.schema,
    property.path,
    property.depth + 1,
    rootSchema,
    []
  );

  // Check each nested property
  for (const nestedProp of nestedProperties) {
    // Check if nested property is a direct match
    if (isDirectMatch(nestedProp, query)) {
      return true;
    }

    // Recursively check nested property's children
    if (hasNestedMatches(nestedProp, query, rootSchema, visitedPaths)) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates search status for a single property
 */
export function evaluateSearchHit(
  property: SchemaProperty,
  query: string,
  rootSchema: JsonSchema
): SearchResult {
  if (!query.trim()) {
    return { hitType: 'none', shouldExpand: false };
  }

  const isDirect = isDirectMatch(property, query);
  const hasNested = hasNestedMatches(property, query, rootSchema);

  let hitType: SearchHitType = 'none';

  if (isDirect && hasNested) {
    hitType = 'both';
  } else if (isDirect) {
    hitType = 'direct';
  } else if (hasNested) {
    hitType = 'indirect';
  }

  return {
    hitType,
    shouldExpand: hitType !== 'none',
  };
}

/**
 * Creates property states based on search results
 */
export function createSearchBasedStates(
  properties: SchemaProperty[],
  query: string,
  rootSchema: JsonSchema,
  autoExpand: boolean = false
): Record<
  string,
  {
    matchesSearch: boolean;
    isDirectMatch: boolean;
    hasNestedMatches: boolean;
    expanded: boolean;
  }
> {
  const states: Record<
    string,
    {
      matchesSearch: boolean;
      isDirectMatch: boolean;
      hasNestedMatches: boolean;
      expanded: boolean;
    }
  > = {};

  for (const property of properties) {
    const pathKey = property.path.join('.');
    const result = evaluateSearchHit(property, query, rootSchema);

    states[pathKey] = {
      matchesSearch: result.hitType !== 'none',
      isDirectMatch: result.hitType === 'direct' || result.hitType === 'both',
      hasNestedMatches:
        result.hitType === 'indirect' || result.hitType === 'both',
      expanded: query ? result.shouldExpand : autoExpand,
    };
  }

  return states;
}
