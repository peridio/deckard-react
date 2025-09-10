import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeckardSchema } from '../DeckardSchema';
import { JsonSchema } from '../types';

const patternPropertiesSchema: JsonSchema = {
  title: 'Pattern Properties Test Schema',
  type: 'object',
  properties: {
    ext: {
      type: 'object',
      description: 'Extension configurations with dynamic keys',
      patternProperties: {
        '^[a-zA-Z0-9_-]+$': {
          $ref: '#/definitions/extensionConfig',
        },
      },
    },
    regularProperty: {
      type: 'string',
      description: 'This is a regular property that should work',
    },
    sdk: {
      $ref: '#/definitions/sdkConfig',
    },
    users: {
      type: 'object',
      description: 'User configurations',
      patternProperties: {
        '^[a-zA-Z0-9_]+$': {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
      },
    },
  },
  definitions: {
    extensionConfig: {
      type: 'object',
      description: 'Configuration for an extension',
      properties: {
        version: {
          type: 'string',
          description: 'Extension version',
        },
        dependencies: {
          type: 'array',
          items: { type: 'string' },
        },
        users: {
          type: 'object',
          description: 'Nested user configurations',
          patternProperties: {
            '^[a-zA-Z0-9_-]+$': {
              $ref: '#/definitions/userConfig',
            },
          },
        },
      },
      required: ['version'],
    },
    userConfig: {
      type: 'object',
      description: 'User configuration',
      properties: {
        password: {
          type: 'string',
          description: 'User password',
        },
        home: {
          type: 'string',
          description: 'Home directory',
        },
        groups: {
          type: 'array',
          description: 'User groups',
          items: {
            type: 'string',
          },
        },
      },
      required: ['password'],
    },
    sdkConfig: {
      type: 'object',
      description: 'SDK configuration',
      properties: {
        apiKey: {
          type: 'string',
          description: 'API key for SDK',
        },
        endpoint: {
          type: 'string',
          format: 'uri',
          description: 'SDK endpoint URL',
        },
      },
      required: ['apiKey'],
    },
  },
};

describe('DeckardSchema - Pattern Properties', () => {
  it('renders pattern properties when parent is expanded', () => {
    render(
      <DeckardSchema
        schema={patternPropertiesSchema}
        options={{
          collapsible: true,
          autoExpand: true, // Auto-expand to see nested pattern properties
        }}
      />
    );

    // Pattern properties should be visible when expanded
    const patternNames = screen.getAllByText('{name}');
    expect(patternNames.length).toBeGreaterThan(0);

    // Check for pattern code elements showing the regex patterns
    const patternCodes = document.querySelectorAll('.pattern-code');
    expect(patternCodes.length).toBeGreaterThan(0);

    // Verify the specific patterns from our test schema are present
    expect(screen.getAllByText('^[a-zA-Z0-9_-]+$').length).toBeGreaterThan(0);
    expect(screen.getAllByText('^[a-zA-Z0-9_]+$').length).toBeGreaterThan(0);
  });

  it('shows pattern information in descriptions', () => {
    render(
      <DeckardSchema
        schema={patternPropertiesSchema}
        options={{
          collapsible: true,
          autoExpand: true,
        }}
      />
    );

    // Check that pattern information is displayed separately from descriptions
    // Look for pattern code elements containing the regex patterns
    const patternCodes = document.querySelectorAll('.pattern-code');
    expect(patternCodes.length).toBeGreaterThan(0);

    // Verify specific patterns are present as separate elements
    expect(screen.getAllByText('^[a-zA-Z0-9_-]+$').length).toBeGreaterThan(0);
    expect(screen.getAllByText('^[a-zA-Z0-9_]+$').length).toBeGreaterThan(0);

    // Verify pattern codes have the correct class
    patternCodes.forEach(element => {
      expect(element).toHaveClass('pattern-code');
    });
  });

  it('expands pattern properties to show referenced schema structure', () => {
    render(
      <DeckardSchema
        schema={patternPropertiesSchema}
        options={{
          collapsible: true,
          autoExpand: true, // Need autoExpand to see nested structure
        }}
      />
    );

    // With autoExpand=true, pattern properties should be visible and expanded
    const patternNames = screen.getAllByText('{name}');
    expect(patternNames.length).toBeGreaterThan(0);

    // Should see the extension config properties within the expanded pattern
    // Wait a bit for the expansion to complete
    expect(screen.getByText('version')).toBeInTheDocument();
    expect(screen.getByText('dependencies')).toBeInTheDocument();
    const usersElements = screen.getAllByText('users');
    expect(usersElements.length).toBeGreaterThan(0);
  });

  it('handles nested pattern properties correctly', () => {
    render(
      <DeckardSchema
        schema={patternPropertiesSchema}
        options={{
          collapsible: true,
          autoExpand: true,
        }}
      />
    );

    // Should have multiple pattern properties at different levels
    const patternCodes = document.querySelectorAll('.pattern-code');
    expect(patternCodes.length).toBeGreaterThan(1);

    // Check for nested pattern properties in extension config
    expect(screen.getByText('Nested user configurations')).toBeInTheDocument();
  });

  it('maintains regular property functionality alongside pattern properties', () => {
    render(
      <DeckardSchema
        schema={patternPropertiesSchema}
        options={{
          collapsible: true,
          autoExpand: false,
        }}
      />
    );

    // Regular properties should still work
    expect(screen.getByText('regularProperty')).toBeInTheDocument();
    expect(screen.getByText('sdk')).toBeInTheDocument();

    // Expand sdk property
    const sdkProperty = screen.getByText('sdk').closest('.property');
    const expandButton = sdkProperty?.querySelector('.expand-button');
    if (expandButton) {
      fireEvent.click(expandButton);
    }

    // Should show SDK config properties
    expect(screen.getByText('apiKey')).toBeInTheDocument();
    expect(screen.getByText('endpoint')).toBeInTheDocument();
  });

  it('applies proper CSS classes to pattern properties', () => {
    render(
      <DeckardSchema
        schema={patternPropertiesSchema}
        options={{
          collapsible: true,
          autoExpand: true, // Need autoExpand to see pattern properties
        }}
      />
    );

    // Pattern properties should have special CSS classes
    // Pattern properties only show when parent is expanded, so we need autoExpand
    const patternPropertyNames = screen.getAllByText('{name}');
    expect(patternPropertyNames.length).toBeGreaterThan(0);
    patternPropertyNames.forEach(element => {
      expect(element.closest('.property-name')).toHaveClass('pattern-property');
    });
  });

  it('shows pattern properties as non-required', () => {
    render(
      <DeckardSchema
        schema={patternPropertiesSchema}
        options={{
          collapsible: true,
          autoExpand: true, // Need autoExpand to see pattern properties
        }}
      />
    );

    // Pattern properties should never show as required
    // But their nested properties might be required
    const patternProperties = screen.getAllByText('{name}');
    expect(patternProperties.length).toBeGreaterThan(0);

    // Check that the pattern property placeholders themselves don't have required badges
    const patternPlaceholders = screen.getAllByText('{name}');
    patternPlaceholders.forEach(element => {
      const patternPropertyHeader = element.closest(
        '.property-header-container'
      );
      expect(
        patternPropertyHeader?.querySelector('.required-badge')
      ).not.toBeInTheDocument();
    });
  });

  it('resolves $ref within pattern properties', () => {
    render(
      <DeckardSchema
        schema={patternPropertiesSchema}
        options={{
          collapsible: true,
          autoExpand: true,
        }}
      />
    );

    // The ext pattern property references extensionConfig definition
    // When expanded, should show the resolved properties
    expect(screen.getByText('version')).toBeInTheDocument();
    expect(screen.getByText('Extension version')).toBeInTheDocument();
  });

  it('handles direct schemas in pattern properties', () => {
    render(
      <DeckardSchema
        schema={patternPropertiesSchema}
        options={{
          collapsible: true,
          autoExpand: true,
        }}
      />
    );

    // The users pattern property has a direct schema (not $ref)
    // Should show the inline properties
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
  });
});
