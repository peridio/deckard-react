import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeckardSchema } from '../DeckardSchema';
import { JsonSchema } from '../types';

// Mock scrollIntoView for keyboard navigation testing
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

describe('Anchor Scrolling', () => {
  const mockSchema: JsonSchema = {
    type: 'object',
    properties: {
      basicProperty: {
        type: 'string',
        description: 'A basic string property',
      },
      nestedObject: {
        type: 'object',
        description: 'An object with nested properties',
        properties: {
          nestedString: {
            type: 'string',
            description: 'A nested string property',
          },
        },
      },
      oneOfProperty: {
        description: 'A property with oneOf options',
        oneOf: [
          {
            type: 'string',
            title: 'String Option',
            description: 'String configuration',
          },
          {
            type: 'object',
            title: 'Object Option',
            description: 'Object configuration',
            properties: {
              name: { type: 'string' },
            },
          },
        ],
      },
    },
  };

  beforeEach(() => {
    mockScrollIntoView.mockClear();
    // Mock window location
    delete (window as any).location;
    window.location = {
      hash: '',
      origin: 'http://localhost',
      pathname: '/',
    } as any;
  });

  test('should expand properties and scroll when hash is present on mount', async () => {
    // Set hash before rendering
    window.location.hash = '#nestedObject-nestedString';

    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      // Should expand the nested object to show nested property
      const nestedObjectElement = container.querySelector(
        '[data-property-key="nestedObject"]'
      );
      expect(nestedObjectElement?.classList.contains('expanded')).toBe(true);

      // Should have the correct ID for the nested property
      const nestedStringElement = container.querySelector(
        '#nestedObject-nestedString'
      );
      expect(nestedStringElement).toBeInTheDocument();
    });

    // Should call scrollIntoView for initial page load to handle React timing issues
    // where browser scrolls before target elements are rendered/expanded
    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });

  test('should handle hash changes after mount', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    // Simulate hash change
    window.location.hash = '#basicProperty';

    // Trigger hashchange event
    const hashChangeEvent = new Event('hashchange');
    window.dispatchEvent(hashChangeEvent);

    await waitFor(() => {
      // Should set the focused property
      const basicPropertyElement = container.querySelector(
        '[data-property-key="basicProperty"]'
      );
      expect(basicPropertyElement?.classList.contains('focused')).toBe(true);
    });

    // For hash changes after mount, we now also use manual scrolling for consistency
    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });

  test('should handle oneOf property anchors correctly', async () => {
    // Set hash for oneOf property with selection
    window.location.hash = '#oneOfProperty-oneOf-1';

    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      // Should expand the oneOf property
      const oneOfElement = container.querySelector(
        '[data-property-key="oneOfProperty"]'
      );
      expect(oneOfElement?.classList.contains('expanded')).toBe(true);

      // Should have hidden anchor for oneOf selection
      const oneOfAnchor = container.querySelector('#oneOfProperty-oneOf-1');
      expect(oneOfAnchor).toBeInTheDocument();
      expect(oneOfAnchor).toHaveStyle({ visibility: 'hidden' });
    });
  });

  test('should generate correct link hrefs', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      // Check basic property link
      const basicPropertyLink = container.querySelector(
        '[data-property-key="basicProperty"] .link-button'
      );
      expect(basicPropertyLink).toHaveAttribute(
        'href',
        'http://localhost/#basicProperty'
      );

      // Check nested property link (after expansion)
      const nestedObjectExpandButton = container.querySelector(
        '[data-property-key="nestedObject"] .expand-button'
      );
      if (nestedObjectExpandButton) {
        fireEvent.click(nestedObjectExpandButton);
      }
    });

    await waitFor(() => {
      const nestedStringLink = container.querySelector(
        '[data-property-key="nestedObject.nestedString"] .link-button'
      );
      expect(nestedStringLink).toHaveAttribute(
        'href',
        'http://localhost/#nestedObject-nestedString'
      );
    });
  });

  test('should preserve native browser behavior on link clicks', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      const basicPropertyLink = container.querySelector(
        '[data-property-key="basicProperty"] .link-button'
      );
      expect(basicPropertyLink).toBeInTheDocument();
    });

    const basicPropertyLink = container.querySelector(
      '[data-property-key="basicProperty"] .link-button'
    ) as HTMLAnchorElement;

    // Simulate clicking the link
    fireEvent.click(basicPropertyLink);

    // The click should not prevent default behavior
    // The setTimeout in the handler should allow native navigation to occur first
    await waitFor(() => {
      // Property should eventually become focused
      const basicPropertyElement = container.querySelector(
        '[data-property-key="basicProperty"]'
      );
      expect(basicPropertyElement?.classList.contains('focused')).toBe(true);
    });
  });

  test('should handle middle-click and cmd+click without interference', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      const basicPropertyLink = container.querySelector(
        '[data-property-key="basicProperty"] .link-button'
      );
      expect(basicPropertyLink).toBeInTheDocument();
    });

    const basicPropertyLink = container.querySelector(
      '[data-property-key="basicProperty"] .link-button'
    ) as HTMLAnchorElement;

    // Test middle-click (should not trigger our handler)
    fireEvent.click(basicPropertyLink, { button: 1 });

    await waitFor(() => {
      // Property should not become focused with middle-click
      const basicPropertyElement = container.querySelector(
        '[data-property-key="basicProperty"]'
      );
      expect(basicPropertyElement?.classList.contains('focused')).toBe(false);
    });

    // Test cmd+click (should not trigger our handler)
    fireEvent.click(basicPropertyLink, { metaKey: true });

    await waitFor(() => {
      // Property should not become focused with cmd+click
      const basicPropertyElement = container.querySelector(
        '[data-property-key="basicProperty"]'
      );
      expect(basicPropertyElement?.classList.contains('focused')).toBe(false);
    });
  });

  test('should convert between hash format and property key correctly', async () => {
    // Test pattern properties and nested paths
    const testCases = [
      { hash: '#basic-property', propertyKey: 'basic.property' },
      { hash: '#sdk-(pattern-0)', propertyKey: 'sdk.(pattern-0)' },
      {
        hash: '#nested-object-child-property',
        propertyKey: 'nested.object.child.property',
      },
      {
        hash: '#sdk-(pattern-0)-dependencies',
        propertyKey: 'sdk.(pattern-0).dependencies',
      },
      { hash: '#oneOfProperty-oneOf-1', propertyKey: 'oneOfProperty.oneOf.1' },
    ];

    // Import utils to test conversion functions
    const { hashToPropertyKey, propertyKeyToHash } = await import('../utils');

    testCases.forEach(({ hash, propertyKey }) => {
      expect(hashToPropertyKey(hash)).toBe(propertyKey);
      expect(propertyKeyToHash(propertyKey)).toBe(hash.substring(1)); // Remove # for comparison
    });
  });

  test('should cleanup event listeners on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<DeckardSchema schema={mockSchema} />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'hashchange',
      expect.any(Function)
    );
  });

  test('should handle anchor links correctly', async () => {
    const { container } = render(<DeckardSchema schema={mockSchema} />);

    await waitFor(() => {
      const basicPropertyLink = container.querySelector(
        '[data-property-key="basicProperty"] .link-button'
      );
      expect(basicPropertyLink).toBeInTheDocument();
    });

    const basicPropertyLink = container.querySelector(
      '[data-property-key="basicProperty"] .link-button'
    ) as HTMLAnchorElement;

    // Test that the link has the correct href for native browser navigation
    expect(basicPropertyLink).toHaveAttribute(
      'href',
      'http://localhost/#basicProperty'
    );

    // Test that clicking the link focuses the property
    fireEvent.click(basicPropertyLink);

    // The property should eventually become focused
    await waitFor(
      () => {
        const basicPropertyElement = container.querySelector(
          '[data-property-key="basicProperty"]'
        );
        expect(basicPropertyElement?.classList.contains('focused')).toBe(true);
      },
      { timeout: 100 }
    );

    // Verify the property has the correct ID for anchor targeting
    const basicPropertyElement = container.querySelector('#basicProperty');
    expect(basicPropertyElement).toBeInTheDocument();
    expect(basicPropertyElement).toHaveAttribute('id', 'basicProperty');
  });
});
