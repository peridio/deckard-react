import { render, screen } from '@testing-library/react';
import { DeckardSchema } from '../DeckardSchema';
import { JsonSchema } from '../types';

describe('DeckardSchema', () => {
  const mockSchema: JsonSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'A simple string property',
      },
      age: {
        type: 'number',
        description: 'A number property',
      },
    },
    required: ['name'],
  };

  test('renders without crashing', () => {
    render(<DeckardSchema schema={mockSchema} />);
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  test('renders schema properties', () => {
    render(<DeckardSchema schema={mockSchema} />);
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
  });

  test('shows required indicator for required properties', () => {
    render(<DeckardSchema schema={mockSchema} />);
    expect(screen.getByText('required')).toBeInTheDocument();
  });
});
