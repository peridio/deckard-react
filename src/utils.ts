import { JsonSchema, SchemaProperty, PropertyConstraint } from './types';

// JSON Schema $ref resolver
export function resolveReference(
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

export function resolveSchema(
  schema: JsonSchema,
  rootSchema: JsonSchema
): JsonSchema {
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

export function extractProperties(
  schema: JsonSchema,
  path: string[],
  depth: number,
  rootSchema: JsonSchema,
  recursionStack: string[] = []
): SchemaProperty[] {
  const properties: SchemaProperty[] = [];
  const currentPathKey = path.join('.');

  // Detect circular reference by checking if current path is already in the recursion stack
  if (recursionStack.includes(currentPathKey)) {
    return properties;
  }

  // Prevent excessive nesting
  if (depth > 10) {
    return properties;
  }

  // Add current path to recursion stack for this branch
  const newRecursionStack = [...recursionStack, currentPathKey];

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
        // Create unique path using pattern hash to avoid conflicts
        const patternKey = `__pattern_${index}_${pattern.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const currentPath = [...path, patternKey];
        const patternPathKey = currentPath.join('.');

        // Skip if this pattern property path is in the current recursion stack
        if (newRecursionStack.includes(patternPathKey)) {
          return;
        }

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

export function hasExamples(schema: JsonSchema): boolean {
  return !!(schema.examples && schema.examples.length > 0);
}

export function getSchemaType(
  schema: JsonSchema,
  _rootSchema?: JsonSchema
): string {
  if (schema.type) {
    if (Array.isArray(schema.type)) {
      return schema.type.join(' | ');
    }
    return schema.type;
  }

  // Handle oneOf, anyOf, allOf schemas
  if (schema.oneOf) {
    return 'oneOf';
  }

  if (schema.anyOf) {
    return 'anyOf';
  }

  if (schema.allOf) {
    return 'object';
  }

  return getSchemaTypeForResolved(schema);
}

function getSchemaTypeForResolved(schema: JsonSchema): string {
  if (schema.type) {
    if (Array.isArray(schema.type)) {
      return schema.type.join(' | ');
    }
    return schema.type;
  }

  if (schema.properties) return 'object';
  if (schema.items) return 'array';
  if (schema.enum) return 'enum';

  return '';
}

export function getConstraints(schema: JsonSchema): PropertyConstraint[] {
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

// Check if a schema contains unsupported features
export function getUnsupportedFeatures(schema: JsonSchema): string[] {
  const unsupported: string[] = [];

  if (schema.not) {
    unsupported.push('not');
  }

  if (schema.if || schema.then || schema.else) {
    unsupported.push('conditional schemas (if/then/else)');
  }

  if (schema.contains) {
    unsupported.push('contains');
  }

  if (schema.propertyNames) {
    unsupported.push('propertyNames');
  }

  if (schema.anyOf) {
    unsupported.push('anyOf');
  }

  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties === 'object'
  ) {
    unsupported.push('complex additionalProperties');
  }

  if (schema.additionalItems && typeof schema.additionalItems === 'object') {
    unsupported.push('complex additionalItems');
  }

  if (schema.contentMediaType) {
    unsupported.push('contentMediaType');
  }

  if (schema.contentEncoding) {
    unsupported.push('contentEncoding');
  }

  if (schema.unevaluatedProperties !== undefined) {
    unsupported.push('unevaluatedProperties');
  }

  if (schema.unevaluatedItems !== undefined) {
    unsupported.push('unevaluatedItems');
  }

  return unsupported;
}
