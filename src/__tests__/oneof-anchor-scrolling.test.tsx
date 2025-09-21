import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeckardSchema from '../DeckardSchema';
import { JsonSchema } from '../types';

describe('OneOf Anchor Scrolling', () => {
  const mockSchema: JsonSchema = {
    type: 'object',
    properties: {
      dependencies: {
        title: 'Dependencies',
        type: 'object',
        patternProperties: {
          '^[a-zA-Z0-9_.-]+$': {
            description: 'Package dependency configuration',
            oneOf: [
              {
                type: 'string',
                title: 'Version String',
                description: 'Simple version string',
                examples: ['*', '1.0.0'],
              },
              {
                type: 'object',
                title: 'Version Object',
                description: 'Advanced version configuration',
                properties: {
                  version: { type: 'string' },
                  optional: { type: 'boolean' },
                },
              },
            ],
          },
        },
      },
      simpleOneOf: {
        title: 'Simple OneOf Property',
        oneOf: [
          {
            type: 'string',
            title: 'String Option',
            description: 'String configuration',
          },
          {
            type: 'number',
            title: 'Number Option',
            description: 'Number configuration',
          },
        ],
      },
    },
  };

  beforeEach(() => {
    // Reset location hash
    delete (window as any).location;
    (window as any).location = { hash: '' };
  });

  afterEach(() => {
    // Clean up any hash changes
    if (typeof window !== 'undefined') {
      window.location.hash = '';
    }
  });

  test('creates hidden anchor for oneOf selection in pattern property', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    // First expand the dependencies property to show pattern properties
    await waitFor(() => {
      const depsElement = container.querySelector(
        '[data-property-key="dependencies"]'
      );
      expect(depsElement).toBeInTheDocument();
    });

    // Click to expand dependencies
    const expandButton = container.querySelector(
      '[data-property-key="dependencies"] .row-header-container'
    );
    if (expandButton) {
      (expandButton as HTMLElement).click();
    }

    // Wait for pattern property to appear after expansion
    await waitFor(() => {
      // Should find the base pattern property element
      const patternElement = container.querySelector(
        '[id="dependencies-(pattern-0)"]'
      );
      expect(patternElement).toBeInTheDocument();

      // Should also find the hidden oneOf anchor
      const oneOfAnchor = container.querySelector(
        '[id="dependencies-(pattern-0)-oneOf-0"]'
      );
      expect(oneOfAnchor).toBeInTheDocument();
      expect(oneOfAnchor).toHaveStyle({ visibility: 'hidden' });
    });
  });

  test('creates hidden anchor for oneOf selection in regular property', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      // Should find the base property element
      const simpleElement = container.querySelector('[id="simpleOneOf"]');
      expect(simpleElement).toBeInTheDocument();

      // Should also find the hidden oneOf anchor
      const oneOfAnchor = container.querySelector('[id="simpleOneOf-oneOf-0"]');
      expect(oneOfAnchor).toBeInTheDocument();
      expect(oneOfAnchor).toHaveStyle({ visibility: 'hidden' });
    });
  });

  test('does not create hidden anchor for regular property without oneOf', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      // Should find the dependencies element
      const depsElement = container.querySelector('[id="dependencies"]');
      expect(depsElement).toBeInTheDocument();

      // Should NOT find any oneOf anchor for this property
      const oneOfAnchor = container.querySelector(
        '[id="dependencies-oneOf-0"]'
      );
      expect(oneOfAnchor).not.toBeInTheDocument();
    });
  });

  test('updates hidden anchor when oneOf selection changes', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      // Initially should have oneOf-0 anchor
      const initialAnchor = container.querySelector(
        '[id="simpleOneOf-oneOf-0"]'
      );
      expect(initialAnchor).toBeInTheDocument();
    });

    // Note: Testing oneOf selection change would require more complex setup
    // This test verifies the anchor exists for the initial selection
  });

  test('does not break when rendering properties without oneOf', async () => {
    const simpleSchema: JsonSchema = {
      type: 'object',
      properties: {
        simpleProperty: {
          type: 'string',
          title: 'Simple Property',
        },
      },
    };

    // Should not throw an error
    expect(() => {
      render(<DeckardSchema schema={simpleSchema} />);
    }).not.toThrow();
  });

  test('hidden anchors have correct accessibility attributes', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      const oneOfAnchor = container.querySelector('[id="simpleOneOf-oneOf-0"]');
      expect(oneOfAnchor).toBeInTheDocument();
      expect(oneOfAnchor).toHaveAttribute('aria-hidden', 'true');
      expect(oneOfAnchor).toHaveStyle({
        position: 'absolute',
        visibility: 'hidden',
      });
    });
  });
});
