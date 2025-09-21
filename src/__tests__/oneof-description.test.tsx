import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import OneOfSelector from '../components/OneOfSelector';
import { JsonSchema } from '../types';

describe('OneOfSelector Description Display', () => {
  const mockProps = {
    _onCopy: vi.fn(),
    onCopyLink: vi.fn(),
    propertyStates: {},
    toggleProperty: vi.fn(),
    onFocusChange: vi.fn(),
    options: {},
    renderNestedProperties: false,
  };

  const testSchema: JsonSchema = {
    type: 'object',
    properties: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays description for selected oneOf option', () => {
    const oneOfOptions: JsonSchema[] = [
      {
        type: 'string',
        title: 'String Option',
        description: 'This is a string option description',
        examples: ['test'],
      },
      {
        type: 'object',
        title: 'Object Option',
        description: 'This is an object option description',
        properties: {
          name: { type: 'string' },
        },
      },
    ];

    render(
      <OneOfSelector
        oneOfOptions={oneOfOptions}
        rootSchema={testSchema}
        {...mockProps}
      />
    );

    // Initially should show first option's description
    expect(
      screen.getByText('This is a string option description')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('This is an object option description')
    ).not.toBeInTheDocument();
  });

  test('updates description when switching between oneOf options', () => {
    const oneOfOptions: JsonSchema[] = [
      {
        type: 'string',
        title: 'String Option',
        description: 'String option description',
        examples: ['test'],
      },
      {
        type: 'object',
        title: 'Object Option',
        description: 'Object option description',
        properties: {
          name: { type: 'string' },
        },
      },
    ];

    render(
      <OneOfSelector
        oneOfOptions={oneOfOptions}
        rootSchema={testSchema}
        {...mockProps}
      />
    );

    // Initially shows first option's description
    expect(screen.getByText('String option description')).toBeInTheDocument();

    // Click on second option
    const objectOptionTab = screen.getByText('Object Option');
    fireEvent.click(objectOptionTab);

    // Should now show second option's description
    expect(screen.getByText('Object option description')).toBeInTheDocument();
    expect(
      screen.queryByText('String option description')
    ).not.toBeInTheDocument();
  });

  test('does not display description section when selected option has no description', () => {
    const oneOfOptions: JsonSchema[] = [
      {
        type: 'string',
        title: 'String Option',
        // No description provided
        examples: ['test'],
      },
      {
        type: 'object',
        title: 'Object Option',
        description: 'This has a description',
        properties: {
          name: { type: 'string' },
        },
      },
    ];

    render(
      <OneOfSelector
        oneOfOptions={oneOfOptions}
        rootSchema={testSchema}
        {...mockProps}
      />
    );

    // Should not show description section for first option (no description)
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();

    // Click on second option that has description
    const objectOptionTab = screen.getByText('Object Option');
    fireEvent.click(objectOptionTab);

    // Should now show description section
    expect(screen.getByText('This has a description')).toBeInTheDocument();
  });

  test('handles empty description gracefully', () => {
    const oneOfOptions: JsonSchema[] = [
      {
        type: 'string',
        title: 'String Option',
        description: '', // Empty description
        examples: ['test'],
      },
    ];

    render(
      <OneOfSelector
        oneOfOptions={oneOfOptions}
        rootSchema={testSchema}
        {...mockProps}
      />
    );

    // Should not display description section for empty description
    expect(screen.queryByTestId('oneof-description')).not.toBeInTheDocument();
  });

  test('applies correct CSS classes for description display', () => {
    const oneOfOptions: JsonSchema[] = [
      {
        type: 'string',
        title: 'String Option',
        description: 'Test description for styling',
        examples: ['test'],
      },
    ];

    const { container } = render(
      <OneOfSelector
        oneOfOptions={oneOfOptions}
        rootSchema={testSchema}
        {...mockProps}
      />
    );

    // Check for correct CSS class structure
    const descriptionContainer = container.querySelector('.oneof-description');
    expect(descriptionContainer).toBeInTheDocument();

    const descriptionBlock = container.querySelector(
      '.property-description-block'
    );
    expect(descriptionBlock).toBeInTheDocument();
    expect(descriptionBlock).toHaveTextContent('Test description for styling');
  });

  test('initializes with correct option when initialSelectedIndex is provided', () => {
    const oneOfOptions: JsonSchema[] = [
      {
        type: 'string',
        title: 'String Option',
        description: 'First option description',
      },
      {
        type: 'object',
        title: 'Object Option',
        description: 'Second option description',
      },
    ];

    render(
      <OneOfSelector
        oneOfOptions={oneOfOptions}
        rootSchema={testSchema}
        initialSelectedIndex={1}
        {...mockProps}
      />
    );

    // Should show second option's description initially
    expect(screen.getByText('Second option description')).toBeInTheDocument();
    expect(
      screen.queryByText('First option description')
    ).not.toBeInTheDocument();
  });
});
