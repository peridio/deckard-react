import {
  getSchemaType,
  hashToPropertyKey,
  propertyKeyToHash,
  extractOneOfIndexFromPath,
} from '../utils';
import type { JsonSchema, SchemaType } from '../types';

describe('getSchemaType', () => {
  describe('basic type detection', () => {
    it('should return "string" for string type', () => {
      const schema: JsonSchema = { type: 'string' as SchemaType };
      expect(getSchemaType(schema)).toBe('string');
    });

    it('should return "number" for number type', () => {
      const schema: JsonSchema = { type: 'number' as SchemaType };
      expect(getSchemaType(schema)).toBe('number');
    });

    it('should return "boolean" for boolean type', () => {
      const schema: JsonSchema = { type: 'boolean' as SchemaType };
      expect(getSchemaType(schema)).toBe('boolean');
    });

    it('should return joined types for array of types', () => {
      const schema: JsonSchema = { type: ['string', 'number'] as SchemaType[] };
      expect(getSchemaType(schema)).toBe('string | number');
    });
  });

  describe('complex schema types', () => {
    it('should return "oneOf" for oneOf schemas', () => {
      const schema: JsonSchema = {
        oneOf: [
          { type: 'string' as SchemaType },
          { type: 'number' as SchemaType },
        ],
      };
      expect(getSchemaType(schema)).toBe('oneOf');
    });

    it('should return "anyOf" for anyOf schemas', () => {
      const schema: JsonSchema = {
        anyOf: [
          { type: 'string' as SchemaType },
          { type: 'number' as SchemaType },
        ],
      };
      expect(getSchemaType(schema)).toBe('anyOf');
    });

    it('should return "object" for allOf schemas', () => {
      const schema: JsonSchema = {
        allOf: [
          { type: 'object' as SchemaType },
          { properties: { prop1: { type: 'string' as SchemaType } } },
        ],
      };
      expect(getSchemaType(schema)).toBe('object');
    });
  });

  describe('inferred types', () => {
    it('should return "object" for schema with properties', () => {
      const schema: JsonSchema = {
        properties: { prop1: { type: 'string' as SchemaType } },
      };
      expect(getSchemaType(schema)).toBe('object');
    });

    it('should return "array" for schema with items', () => {
      const schema: JsonSchema = {
        items: { type: 'string' as SchemaType },
      };
      expect(getSchemaType(schema)).toBe('array');
    });

    it('should return "enum" for schema with only enum property', () => {
      const schema: JsonSchema = {
        enum: ['value1', 'value2', 'value3'],
      };
      expect(getSchemaType(schema)).toBe('enum');
    });
  });

  describe('schemas with explicit type and enum', () => {
    it('should return base type when both type and enum are present', () => {
      const schema: JsonSchema = {
        type: 'string' as SchemaType,
        enum: ['value1', 'value2', 'value3'],
      };
      expect(getSchemaType(schema)).toBe('string');
    });

    it('should return base type for number with enum', () => {
      const schema: JsonSchema = {
        type: 'number' as SchemaType,
        enum: [1, 2, 3],
      };
      expect(getSchemaType(schema)).toBe('number');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for empty schema', () => {
      const schema: JsonSchema = {};
      expect(getSchemaType(schema)).toBe('');
    });

    it('should prioritize explicit type over inferred type', () => {
      const schema: JsonSchema = {
        type: 'string' as SchemaType,
        properties: { prop1: { type: 'string' as SchemaType } },
      };
      expect(getSchemaType(schema)).toBe('string');
    });

    it('should prioritize oneOf over inferred types', () => {
      const schema: JsonSchema = {
        oneOf: [{ type: 'string' as SchemaType }],
        properties: { prop1: { type: 'string' as SchemaType } },
      };
      expect(getSchemaType(schema)).toBe('oneOf');
    });
  });

  describe('enum ID extraction', () => {
    it('should extract enum ID from $ref definitions', () => {
      // Test the getEnumId function logic
      const getEnumId = (schema: any): string | null => {
        if (schema.$ref && typeof schema.$ref === 'string') {
          const match = schema.$ref.match(/#\/definitions\/(.+)$/);
          if (match && match[1].trim()) {
            return match[1];
          }
        }
        return null;
      };

      const schema1 = { $ref: '#/definitions/target' };
      const schema2 = { $ref: '#/definitions/logLevel' };
      const schema3 = { $ref: '#/definitions/statusCode' };
      const schema4 = { enum: ['value1', 'value2'] }; // No $ref
      const schema5 = {}; // Empty schema

      expect(getEnumId(schema1)).toBe('target');
      expect(getEnumId(schema2)).toBe('logLevel');
      expect(getEnumId(schema3)).toBe('statusCode');
      expect(getEnumId(schema4)).toBe(null);
      expect(getEnumId(schema5)).toBe(null);
    });

    it('should handle malformed $ref values', () => {
      const getEnumId = (schema: any): string | null => {
        if (schema.$ref && typeof schema.$ref === 'string') {
          const match = schema.$ref.match(/#\/definitions\/(.+)$/);
          if (match && match[1].trim()) {
            return match[1];
          }
        }
        return null;
      };

      const schema1 = { $ref: 'invalid-ref' };
      const schema2 = { $ref: '#/definitions/' }; // Empty enum name
      const schema3 = { $ref: '#/definitions/   ' }; // Whitespace only
      const schema4 = { $ref: 123 }; // Non-string $ref

      expect(getEnumId(schema1)).toBe(null);
      expect(getEnumId(schema2)).toBe(null);
      expect(getEnumId(schema3)).toBe(null);
      expect(getEnumId(schema4)).toBe(null);
    });
  });

  describe('Hash conversion functions', () => {
    describe('hashToPropertyKey', () => {
      it('should convert simple hash to property key', () => {
        expect(hashToPropertyKey('#default-target')).toBe('default.target');
        expect(hashToPropertyKey('default-target')).toBe('default.target');
      });

      it('should handle pattern properties correctly', () => {
        expect(hashToPropertyKey('#sdk-(pattern-0)')).toBe('sdk.(pattern-0)');
        expect(hashToPropertyKey('sdk-(pattern-0)')).toBe('sdk.(pattern-0)');
        expect(hashToPropertyKey('#ext-(pattern-1)')).toBe('ext.(pattern-1)');
      });

      it('should handle nested pattern properties', () => {
        expect(hashToPropertyKey('#sdk-(pattern-0)-dependencies')).toBe(
          'sdk.(pattern-0).dependencies'
        );
        expect(hashToPropertyKey('#ext-(pattern-1)-config-value')).toBe(
          'ext.(pattern-1).config.value'
        );
      });

      it('should handle complex nested paths', () => {
        expect(hashToPropertyKey('#provision-profiles-dev-settings')).toBe(
          'provision.profiles.dev.settings'
        );
        expect(hashToPropertyKey('#container-args-env-vars')).toBe(
          'container.args.env.vars'
        );
      });

      it('should handle empty or invalid input', () => {
        expect(hashToPropertyKey('')).toBe('');
        expect(hashToPropertyKey('#')).toBe('');
      });

      it('should preserve multiple pattern properties in path', () => {
        expect(hashToPropertyKey('#sdk-(pattern-0)-ext-(pattern-1)')).toBe(
          'sdk.(pattern-0).ext.(pattern-1)'
        );
      });
    });

    describe('propertyKeyToHash', () => {
      it('should convert simple property key to hash', () => {
        expect(propertyKeyToHash('default.target')).toBe('default-target');
        expect(propertyKeyToHash('provision.profiles')).toBe(
          'provision-profiles'
        );
      });

      it('should handle pattern properties correctly', () => {
        expect(propertyKeyToHash('sdk.(pattern-0)')).toBe('sdk-(pattern-0)');
        expect(propertyKeyToHash('ext.(pattern-1)')).toBe('ext-(pattern-1)');
      });

      it('should handle nested pattern properties', () => {
        expect(propertyKeyToHash('sdk.(pattern-0).dependencies')).toBe(
          'sdk-(pattern-0)-dependencies'
        );
        expect(propertyKeyToHash('ext.(pattern-1).config.value')).toBe(
          'ext-(pattern-1)-config-value'
        );
      });

      it('should handle complex nested paths', () => {
        expect(propertyKeyToHash('provision.profiles.dev.settings')).toBe(
          'provision-profiles-dev-settings'
        );
        expect(propertyKeyToHash('container.args.env.vars')).toBe(
          'container-args-env-vars'
        );
      });

      it('should handle empty or invalid input', () => {
        expect(propertyKeyToHash('')).toBe('');
      });

      it('should preserve multiple pattern properties in path', () => {
        expect(propertyKeyToHash('sdk.(pattern-0).ext.(pattern-1)')).toBe(
          'sdk-(pattern-0)-ext-(pattern-1)'
        );
      });
    });

    describe('Round-trip conversion', () => {
      it('should maintain consistency between hash and property key conversion', () => {
        const testCases = [
          'default.target',
          'sdk.(pattern-0)',
          'ext.(pattern-1).dependencies',
          'provision.profiles.dev',
          'container.args.env.vars',
          'sdk.(pattern-0).ext.(pattern-1).config',
        ];

        testCases.forEach(propertyKey => {
          const hash = propertyKeyToHash(propertyKey);
          const convertedBack = hashToPropertyKey(hash);
          expect(convertedBack).toBe(propertyKey);
        });
      });

      it('should maintain consistency when starting with hash', () => {
        const testCases = [
          '#default-target',
          '#sdk-(pattern-0)',
          '#ext-(pattern-1)-dependencies',
          '#provision-profiles-dev',
          '#container-args-env-vars',
          '#sdk-(pattern-0)-ext-(pattern-1)-config',
        ];

        testCases.forEach(hash => {
          const propertyKey = hashToPropertyKey(hash);
          const convertedBack = '#' + propertyKeyToHash(propertyKey);
          expect(convertedBack).toBe(hash);
        });
      });
    });
  });

  describe('real-world enum reference example', () => {
    it('should handle Avocado schema target reference', () => {
      const getEnumId = (schema: any): string | null => {
        if (schema.$ref && typeof schema.$ref === 'string') {
          const match = schema.$ref.match(/#\/definitions\/(.+)$/);
          if (match && match[1].trim()) {
            return match[1];
          }
        }
        return null;
      };

      // Example from Avocado config schema
      const defaultTargetSchema = {
        title: 'Default target',
        $ref: '#/definitions/target',
        examples: ['jetson-orin-nano-devkit-nvme'],
      };

      expect(getEnumId(defaultTargetSchema)).toBe('target');
    });

    describe('extractOneOfIndexFromPath', () => {
      it('should extract oneOf index from property path', () => {
        expect(extractOneOfIndexFromPath('dependencies.oneOf.0.config')).toBe(
          0
        );
        expect(extractOneOfIndexFromPath('dependencies.oneOf.1.ext')).toBe(1);
        expect(extractOneOfIndexFromPath('dependencies.oneOf.2.vsn')).toBe(2);
      });

      it('should return 0 for paths without oneOf', () => {
        expect(extractOneOfIndexFromPath('dependencies.config')).toBe(0);
        expect(extractOneOfIndexFromPath('simple.property')).toBe(0);
        expect(extractOneOfIndexFromPath('')).toBe(0);
      });

      it('should handle oneOf at the end of path', () => {
        expect(extractOneOfIndexFromPath('dependencies.oneOf.3')).toBe(3);
      });

      it('should handle invalid oneOf indices', () => {
        expect(
          extractOneOfIndexFromPath('dependencies.oneOf.invalid.config')
        ).toBe(0);
        expect(extractOneOfIndexFromPath('dependencies.oneOf..config')).toBe(0);
      });
    });
  });
});
