import { JsonSchema, DeckardOptions, PropertyConstraint } from '../types';

describe('Types', () => {
  describe('JsonSchema interface', () => {
    it('allows basic schema properties', () => {
      const schema: JsonSchema = {
        title: 'Test Schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };
      expect(schema.title).toBe('Test Schema');
      expect(schema.type).toBe('object');
    });

    it('allows array types', () => {
      const schema: JsonSchema = {
        type: ['string', 'null'],
      };
      expect(Array.isArray(schema.type)).toBe(true);
    });
  });

  describe('DeckardOptions interface', () => {
    it('has correct default boolean options', () => {
      const options: DeckardOptions = {
        includeHeader: true,
        searchable: false,
        collapsible: true,
      };
      expect(typeof options.includeHeader).toBe('boolean');
      expect(typeof options.searchable).toBe('boolean');
      expect(typeof options.collapsible).toBe('boolean');
    });

    it('accepts theme options', () => {
      const lightOptions: DeckardOptions = { theme: 'light' };
      const darkOptions: DeckardOptions = { theme: 'dark' };
      const autoOptions: DeckardOptions = { theme: 'auto' };

      expect(lightOptions.theme).toBe('light');
      expect(darkOptions.theme).toBe('dark');
      expect(autoOptions.theme).toBe('auto');
    });
  });

  describe('PropertyConstraint interface', () => {
    it('allows different constraint types', () => {
      const formatConstraint: PropertyConstraint = {
        type: 'format',
        label: 'email',
        value: 'email',
      };

      const rangeConstraint: PropertyConstraint = {
        type: 'range',
        label: 'min',
        value: 0,
      };

      expect(formatConstraint.type).toBe('format');
      expect(rangeConstraint.value).toBe(0);
    });
  });
});
