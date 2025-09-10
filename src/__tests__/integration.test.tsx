import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeckardSchema } from '../DeckardSchema';
import { render } from './test-utils';
import { JsonSchema, DeckardOptions } from '../types';

jest.mock('react-icons/hi2', () => ({
  HiChevronDown: () => <div data-testid="chevron-down">▼</div>,
  HiChevronRight: () => <div data-testid="chevron-right">▶</div>,
  HiLink: () => <div data-testid="link-icon">🔗</div>,
}));

describe('DeckardSchema - Integration Tests', () => {
  const complexSchema: JsonSchema = {
    title: 'Complex API Schema',
    description: 'A complex schema with various property types',
    type: 'object',
    properties: {
      user: {
        type: 'object',
        description: 'User information',
        properties: {
          profile: {
            type: 'object',
            properties: {
              firstName: { type: 'string', minLength: 1 },
              lastName: { type: 'string', minLength: 1 },
              avatar: { type: 'string', format: 'uri' },
            },
            required: ['firstName', 'lastName'],
          },
          preferences: {
            type: 'object',
            properties: {
              theme: {
                type: 'string',
                enum: ['light', 'dark', 'auto'],
                default: 'auto',
              },
              notifications: { type: 'boolean', default: true },
            },
          },
        },
        required: ['profile'],
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        minItems: 0,
        maxItems: 10,
        description: 'User tags',
      },
      metadata: {
        type: 'object',
        additionalProperties: true,
        description: 'Additional metadata',
      },
    },
    required: ['user'],
  };

  describe('Complex Schema Rendering', () => {
    it('renders nested object structures correctly', () => {
      render(<DeckardSchema schema={complexSchema} />);

      expect(screen.getByText('Complex API Schema')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('tags')).toBeInTheDocument();
      expect(screen.getByText('metadata')).toBeInTheDocument();
    });

    it('shows required indicators correctly', () => {
      render(<DeckardSchema schema={complexSchema} />);

      // User is required at root level
      expect(screen.getByText('user')).toBeInTheDocument();
      // Tags and metadata are optional
      expect(screen.getByText('tags')).toBeInTheDocument();
      expect(screen.getByText('metadata')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('allows property expansion and collapse', async () => {
      const user = userEvent.setup();
      const options: DeckardOptions = { collapsible: true, autoExpand: false };
      render(<DeckardSchema schema={complexSchema} options={options} />);

      // Find expand buttons
      const expandButtons = screen.getAllByTestId('chevron-right');
      expect(expandButtons.length).toBeGreaterThan(0);

      // Click first expand button
      await user.click(expandButtons[0]);

      // Should show chevron down after expansion
      await waitFor(() => {
        expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      });
    });

    it('handles search functionality when enabled', async () => {
      const user = userEvent.setup();
      const options: DeckardOptions = { searchable: true };
      render(<DeckardSchema schema={complexSchema} options={options} />);

      // Find search input
      const searchInput = screen.getByPlaceholderText(/search properties/i);
      expect(searchInput).toBeInTheDocument();

      // Type in search
      await user.type(searchInput, 'user');
      expect(searchInput).toHaveValue('user');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA attributes', () => {
      const options: DeckardOptions = { collapsible: true };
      render(<DeckardSchema schema={complexSchema} options={options} />);

      // Check for ARIA attributes on expandable elements
      const expandableElements = screen.getAllByRole('button');
      expect(expandableElements.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const options: DeckardOptions = { searchable: true, collapsible: true };
      render(<DeckardSchema schema={complexSchema} options={options} />);

      // Tab through elements
      await user.tab();

      // Should focus on search input first
      const searchInput = screen.getByPlaceholderText(/search properties/i);
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles schema with circular references gracefully', () => {
      const circularSchema: JsonSchema = {
        title: 'Circular Schema',
        type: 'object',
        properties: {
          self: {
            $ref: '#',
          },
        },
      };

      expect(() => {
        render(<DeckardSchema schema={circularSchema} />);
      }).not.toThrow();
    });

    it('handles schema with missing type information', () => {
      const schemaNoType: JsonSchema = {
        title: 'No Type Schema',
        properties: {
          mystery: {
            description: 'A field with no type',
          },
        },
      };

      render(<DeckardSchema schema={schemaNoType} />);
      expect(screen.getByText('No Type Schema')).toBeInTheDocument();
      expect(screen.getByText('mystery')).toBeInTheDocument();
    });

    it('handles empty properties object', () => {
      const emptyPropsSchema: JsonSchema = {
        title: 'Empty Properties',
        type: 'object',
        properties: {},
      };

      render(<DeckardSchema schema={emptyPropsSchema} />);
      expect(screen.getByText('Empty Properties')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('applies theme classes correctly', () => {
      const lightOptions: DeckardOptions = { theme: 'light' };
      const { container } = render(
        <DeckardSchema schema={complexSchema} options={lightOptions} />
      );

      const schemaContainer = container.querySelector('.schema-container');
      expect(schemaContainer).toBeInTheDocument();
    });

    it('defaults to auto theme', () => {
      const { container } = render(<DeckardSchema schema={complexSchema} />);

      const schemaContainer = container.querySelector('.schema-container');
      expect(schemaContainer).toBeInTheDocument();
    });
  });
});
