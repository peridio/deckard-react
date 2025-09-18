import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeckardSchema } from '../DeckardSchema';
import { JsonSchema } from '../types';

describe('AllOf Pattern Properties Fix Validation', () => {
  const testSchema: JsonSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'AllOf Fix Test',
    type: 'object',
    properties: {
      sdk: {
        title: 'SDK Configuration',
        $ref: '#/definitions/sdkConfig',
        description: 'Configure the default SDK.',
      },
    },
    definitions: {
      sdkConfig: {
        type: 'object',
        description: 'SDK configuration.',
        allOf: [
          {
            $ref: '#/definitions/targetSdkConfig',
          },
          {
            type: 'object',
            patternProperties: {
              '^[a-zA-Z0-9_-]+$': {
                $ref: '#/definitions/targetSdkConfig',
              },
            },
          },
        ],
      },
      targetSdkConfig: {
        type: 'object',
        properties: {
          image: {
            type: 'string',
            description: 'Docker image',
          },
          version: {
            type: 'string',
            description: 'SDK version',
          },
        },
      },
    },
  };

  it('should render the sdk property', () => {
    render(<DeckardSchema schema={testSchema} />);
    expect(screen.getByText('sdk')).toBeInTheDocument();
  });

  it('should show merged properties when auto-expanded', () => {
    render(
      <DeckardSchema schema={testSchema} options={{ autoExpand: true }} />
    );

    // Should show the sdk property
    expect(screen.getByText('sdk')).toBeInTheDocument();

    // Should show regular properties from first allOf item (targetSdkConfig)
    const imageElements = screen.getAllByText('image');
    const versionElements = screen.getAllByText('version');

    // Should have at least one of each property
    expect(imageElements.length).toBeGreaterThan(0);
    expect(versionElements.length).toBeGreaterThan(0);

    // Should show pattern property from second allOf item
    expect(screen.getByText('{pattern}')).toBeInTheDocument();
  });

  it('should handle allOf merging correctly', () => {
    render(
      <DeckardSchema schema={testSchema} options={{ autoExpand: true }} />
    );

    // The key test: we should have multiple instances of the same property
    // This proves allOf merging is working:
    // - One set from the direct targetSdkConfig reference
    // - Another set from the pattern property that also references targetSdkConfig

    const imageElements = screen.getAllByText('image');
    const versionElements = screen.getAllByText('version');

    // If allOf is working, we should have multiple instances
    // (one from regular properties, one from pattern properties)
    expect(imageElements.length).toBeGreaterThanOrEqual(2);
    expect(versionElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should render pattern properties with correct styling', () => {
    render(
      <DeckardSchema schema={testSchema} options={{ autoExpand: true }} />
    );

    const patternElement = screen.getByText('{pattern}');
    expect(patternElement).toHaveClass('badge-pattern');
  });
});
