import { screen } from '@testing-library/react';
import { DeckardSchema } from '../DeckardSchema';
import { mockBasicSchema, render } from './test-utils';
import { JsonSchema, DeckardOptions } from '../types';

jest.mock('react-icons/hi2', () => ({
  HiChevronDown: () => <div data-testid="chevron-down">▼</div>,
  HiChevronRight: () => <div data-testid="chevron-right">▶</div>,
  HiLink: () => <div data-testid="link-icon">🔗</div>,
}));

describe('DeckardSchema', () => {
  const defaultProps = { schema: mockBasicSchema };

  describe('Basic Rendering', () => {
    it('renders schema title and description', () => {
      render(<DeckardSchema {...defaultProps} />);
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('A user object')).toBeInTheDocument();
    });

    it('renders properties section', () => {
      render(<DeckardSchema {...defaultProps} />);
      expect(screen.getByText('Properties')).toBeInTheDocument();
    });

    it('renders property names and types', () => {
      render(<DeckardSchema {...defaultProps} />);
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('age')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <DeckardSchema {...defaultProps} className="custom-class" />
      );
      const schemaContainer = container.querySelector('.schema-container');
      expect(schemaContainer).toHaveClass('custom-class');
    });
  });

  describe('Options Configuration', () => {
    it('hides header when includeHeader is false', () => {
      const options: DeckardOptions = { includeHeader: false };
      render(<DeckardSchema {...defaultProps} options={options} />);
      expect(screen.queryByText('User')).not.toBeInTheDocument();
    });

    it('hides properties title when includePropertiesTitle is false', () => {
      const options: DeckardOptions = { includePropertiesTitle: false };
      render(<DeckardSchema {...defaultProps} options={options} />);
      expect(screen.queryByText('Properties')).not.toBeInTheDocument();
    });
  });

  describe('Schema Types', () => {
    it('handles empty schema gracefully', () => {
      const emptySchema: JsonSchema = {};
      expect(() => {
        render(<DeckardSchema schema={emptySchema} />);
      }).not.toThrow();
    });

    it('handles schema with enum values', () => {
      const enumSchema: JsonSchema = {
        title: 'Status',
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
          },
        },
      };
      render(<DeckardSchema schema={enumSchema} />);
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('status')).toBeInTheDocument();
    });

    it('displays oneOf type labels correctly', () => {
      const oneOfSchema: JsonSchema = {
        title: 'Mixed Types',
        type: 'object',
        properties: {
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
            ],
          },
        },
      };
      render(<DeckardSchema schema={oneOfSchema} />);
      expect(screen.getByText('value')).toBeInTheDocument();
      expect(screen.getByText('string | number | boolean')).toBeInTheDocument();
    });

    it('displays anyOf type labels correctly', () => {
      const anyOfSchema: JsonSchema = {
        title: 'Flexible Types',
        type: 'object',
        properties: {
          data: {
            anyOf: [{ type: 'object' }, { type: 'array' }],
          },
        },
      };
      render(<DeckardSchema schema={anyOfSchema} />);
      expect(screen.getByText('data')).toBeInTheDocument();
      expect(screen.getByText('object | array')).toBeInTheDocument();
    });

    it('displays allOf type labels correctly', () => {
      const allOfSchema: JsonSchema = {
        title: 'Combined Types',
        type: 'object',
        properties: {
          combined: {
            allOf: [
              { type: 'object' },
              { properties: { name: { type: 'string' } } },
            ],
          },
        },
      };
      render(<DeckardSchema schema={allOfSchema} />);
      expect(screen.getByText('combined')).toBeInTheDocument();
      expect(screen.getByText('object')).toBeInTheDocument();
    });

    it('handles oneOf with duplicate types', () => {
      const duplicateSchema: JsonSchema = {
        title: 'Duplicate Types',
        type: 'object',
        properties: {
          duplicate: {
            oneOf: [
              { type: 'string', minLength: 1 },
              { type: 'string', maxLength: 10 },
            ],
          },
        },
      };
      render(<DeckardSchema schema={duplicateSchema} />);
      expect(screen.getByText('duplicate')).toBeInTheDocument();
      expect(screen.getByText('string')).toBeInTheDocument();
    });

    it('shows specific type when oneOf contains identifiable schemas', () => {
      const complexOneOfSchema: JsonSchema = {
        title: 'Complex OneOf',
        type: 'object',
        properties: {
          complex: {
            oneOf: [{ const: 'fixed-value' }, { enum: ['a', 'b', 'c'] }],
          },
        },
      };
      render(<DeckardSchema schema={complexOneOfSchema} />);
      expect(screen.getByText('complex')).toBeInTheDocument();
      expect(screen.getByText('enum')).toBeInTheDocument();
    });

    it('falls back to oneOf label when no types can be determined', () => {
      const unknownOneOfSchema: JsonSchema = {
        title: 'Unknown OneOf',
        type: 'object',
        properties: {
          unknown: {
            oneOf: [
              { $ref: '#/definitions/UnknownType' },
              { not: { type: 'string' } },
            ],
          },
        },
      };
      render(<DeckardSchema schema={unknownOneOfSchema} />);
      expect(screen.getByText('unknown')).toBeInTheDocument();
      expect(screen.getByText('oneOf')).toBeInTheDocument();
    });
  });
});
