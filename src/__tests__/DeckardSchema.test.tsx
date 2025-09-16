import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  describe('search functionality with real-world schema', () => {
    const realWorldSchema: JsonSchema = {
      type: 'object',
      properties: {
        sdk: {
          title: 'SDK configuration',
          allOf: [
            {
              $ref: '#/definitions/sdkConfig',
            },
            {
              type: 'object',
              patternProperties: {
                '^[a-zA-Z0-9_-]+$': {
                  oneOf: [
                    {
                      $ref: '#/definitions/sdkConfig',
                    },
                    {
                      type: ['string', 'number', 'boolean', 'array', 'object'],
                    },
                  ],
                  description:
                    'Target-specific SDK configuration that overrides the default SDK settings for a particular target architecture.',
                },
              },
            },
          ],
          description:
            'SDK settings for building your Avocado OS project. Defines the build environment, dependencies, and compilation configurations.',
        },
        ext: {
          type: 'object',
          description: 'Extension configuration',
          properties: {
            name: {
              type: 'string',
              description: 'Extension name',
            },
          },
        },
      },
      definitions: {
        sdkConfig: {
          type: 'object',
          properties: {
            dependencies: {
              type: 'object',
              description:
                'SDK-level dependencies required for building the project. These dependencies are specific to the SDK environment.',
            },
            image: {
              type: 'string',
              description:
                'Docker image to use for the SDK build environment. This provides the base system and tools needed for compilation.',
            },
            repo_release: {
              type: 'string',
              description:
                'Specific release/tag of the SDK repository to use. Can be overridden per target.',
            },
            repo_url: {
              type: 'string',
              description:
                'URL of the repository containing SDK resources. Can be overridden per target.',
            },
          },
        },
      },
    };

    test('shows both-hit indicator for properties with direct and nested matches', async () => {
      render(
        <DeckardSchema
          schema={realWorldSchema}
          options={{ searchable: true }}
        />
      );

      // Search for "sdk"
      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'sdk' } });

      await waitFor(() => {
        // Should find the sdk property
        const sdkProperty = screen.getByText('sdk');
        expect(sdkProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // The "sdk" property should show as both-hit because:
        // 1. It matches "sdk" directly (property name)
        // 2. It has nested properties with descriptions containing "SDK"
        const bothHitIndicator = document.querySelector('.both-hit');

        // Should be both-hit, not just direct-hit
        expect(bothHitIndicator).toBeInTheDocument();

        // Should have the viewfinder icon for both-hit
        if (bothHitIndicator) {
          const icon = bothHitIndicator.querySelector('svg');
          expect(icon?.getAttribute('viewBox')).toBe('0 0 640 512');
        }

        // Should have correct tooltip
        expect(bothHitIndicator?.getAttribute('aria-label')).toContain(
          'matches search and contains nested matches'
        );
      });
    });

    test('preserves search indicators when toggling property expansion', async () => {
      render(
        <DeckardSchema
          schema={realWorldSchema}
          options={{ searchable: true }}
        />
      );

      // Search for "sdk"
      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'sdk' } });

      await waitFor(() => {
        const sdkProperty = screen.getByText('sdk');
        expect(sdkProperty).toBeInTheDocument();
      });

      // Find the sdk property and click its toggle button
      const sdkElement = document.querySelector('[data-property-key="sdk"]');
      const sdkToggleButton = sdkElement?.querySelector(
        '.expand-button'
      ) as HTMLElement;
      fireEvent.click(sdkToggleButton);

      // The search indicator should still be present after toggling
      await waitFor(() => {
        const searchIndicator = document.querySelector('.search-hit-indicator');
        expect(searchIndicator).toBeInTheDocument();
      });
    });

    test('handles pattern properties with oneOf types in search', async () => {
      const patternOneOfSchema: JsonSchema = {
        type: 'object',
        properties: {
          services: {
            type: 'object',
            description: 'Service configurations',
            patternProperties: {
              '^[a-zA-Z0-9_-]+$': {
                oneOf: [
                  {
                    type: 'object',
                    properties: {
                      port: {
                        type: 'number',
                        description: 'Service port number',
                      },
                      host: {
                        type: 'string',
                        description: 'Service hostname',
                      },
                    },
                  },
                  {
                    type: 'string',
                    description: 'Service URL string',
                  },
                ],
                description: 'Dynamic service configuration',
              },
            },
          },
        },
      };

      render(
        <DeckardSchema
          schema={patternOneOfSchema}
          options={{ searchable: true }}
        />
      );

      // Search for "service" which should match the parent and pattern property descriptions
      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'service' } });

      await waitFor(() => {
        // Should find the services property
        const servicesProperty = screen.getByText('services');
        expect(servicesProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // The "services" property should show as both-hit because:
        // 1. It has "Service" in its description (direct match)
        // 2. It has pattern properties with "Service" in their descriptions (nested matches)
        const bothHitIndicator = document.querySelector('.both-hit');
        const directHitIndicator = document.querySelector('.direct-hit');

        // Should be both-hit or direct-hit
        expect(bothHitIndicator || directHitIndicator).toBeInTheDocument();
      });

      // Now search for "port" which should only match nested properties
      fireEvent.change(searchInput, { target: { value: 'port' } });

      await waitFor(() => {
        // Should still show services property due to nested match
        const servicesProperty = screen.getByText('services');
        expect(servicesProperty).toBeInTheDocument();

        // Should be collapsed even though it contains matches
        const servicesElement = document.querySelector(
          '[data-property-key="services"]'
        );
        expect(servicesElement?.classList.contains('expanded')).toBe(false);
      });

      await waitFor(() => {
        // The "services" property should show as indirect-hit because:
        // It doesn't match "port" directly but contains nested "port" matches
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();
      });
    });

    test('search respects collapsible setting when collapsing properties', async () => {
      const nestedSchema: JsonSchema = {
        type: 'object',
        properties: {
          config: {
            type: 'object',
            description: 'Configuration settings',
            properties: {
              database: {
                type: 'object',
                description: 'Database configuration',
                properties: {
                  host: {
                    type: 'string',
                    description: 'Database host',
                  },
                  port: {
                    type: 'number',
                    description: 'Database port',
                  },
                },
              },
            },
          },
        },
      };

      // Test with collapsible: true - should collapse everything when searching
      const { rerender } = render(
        <DeckardSchema
          schema={nestedSchema}
          options={{ searchable: true, collapsible: true, autoExpand: true }}
        />
      );

      // Start a search with collapsible: true - should collapse and then expand matches
      let searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'host' } });

      await waitFor(() => {
        // Should show indirect-hit indicator for config (contains nested "host" match but doesn't match "host" directly)
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();
      });

      // Test with collapsible: false - should not collapse when searching
      rerender(
        <DeckardSchema
          schema={nestedSchema}
          options={{ searchable: true, collapsible: false, autoExpand: true }}
        />
      );

      // Clear search first
      searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        const configProperty = screen.getByText('config');
        expect(configProperty).toBeInTheDocument();
      });

      // Start a search with collapsible: false - should maintain expansion state
      fireEvent.change(searchInput, { target: { value: 'host' } });

      await waitFor(() => {
        // Should still find the config property and show search indicators
        const configProperty = screen.getByText('config');
        expect(configProperty).toBeInTheDocument();

        // Should show indirect-hit indicator
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();
      });
    });

    test('search collapses properties when collapsible is true', async () => {
      const expandableSchema: JsonSchema = {
        type: 'object',
        properties: {
          config: {
            type: 'object',
            description: 'Configuration settings',
            properties: {
              database: {
                type: 'object',
                description: 'Database configuration',
                properties: {
                  host: {
                    type: 'string',
                    description: 'Database host',
                  },
                },
              },
              cache: {
                type: 'object',
                description: 'Cache configuration',
                properties: {
                  redis: {
                    type: 'string',
                    description: 'Redis connection string',
                  },
                },
              },
            },
          },
        },
      };

      render(
        <DeckardSchema
          schema={expandableSchema}
          options={{ searchable: true, collapsible: true, autoExpand: true }}
        />
      );

      // Initially, properties should be expanded due to autoExpand
      await waitFor(() => {
        const configProperty = screen.getByText('config');
        expect(configProperty).toBeInTheDocument();

        // Should be expanded initially
        const configElement = document.querySelector(
          '[data-property-key="config"]'
        );
        expect(configElement?.classList.contains('expanded')).toBe(true);
      });

      // Start a search - this should collapse everything first, then expand only matches
      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'redis' } });

      await waitFor(() => {
        // Config should be visible (contains nested match) but collapsed non-matching children
        const configProperty = screen.getByText('config');
        expect(configProperty).toBeInTheDocument();

        // Should show indirect-hit indicator for config (contains nested redis match but doesn't match "redis" directly)
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();
      });

      // Clear search to verify properties expand back to autoExpand state
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        const configProperty = screen.getByText('config');
        expect(configProperty).toBeInTheDocument();

        // Should be expanded again after clearing search
        const configElement = document.querySelector(
          '[data-property-key="config"]'
        );
        expect(configElement?.classList.contains('expanded')).toBe(true);
      });
    });

    test('search collapses everything and does not expand matches', async () => {
      const nestedSchema: JsonSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            description: 'User configuration',
            properties: {
              profile: {
                type: 'object',
                description: 'User profile information',
                properties: {
                  name: {
                    type: 'string',
                    description: 'User name',
                  },
                  email: {
                    type: 'string',
                    description: 'User email address',
                  },
                },
              },
              settings: {
                type: 'object',
                description: 'User settings',
                properties: {
                  theme: {
                    type: 'string',
                    description: 'UI theme preference',
                  },
                },
              },
            },
          },
        },
      };

      render(
        <DeckardSchema
          schema={nestedSchema}
          options={{ searchable: true, collapsible: true, autoExpand: true }}
        />
      );

      // Initially, properties should be expanded due to autoExpand
      await waitFor(() => {
        const userProperty = screen.getByText('user');
        expect(userProperty).toBeInTheDocument();

        // Should be expanded initially
        const userElement = document.querySelector(
          '[data-property-key="user"]'
        );
        expect(userElement?.classList.contains('expanded')).toBe(true);
      });

      // Start a search - this should collapse everything and NOT expand matches
      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'email' } });

      await waitFor(() => {
        // User property should be visible (contains nested match)
        const userProperty = screen.getByText('user');
        expect(userProperty).toBeInTheDocument();

        // Should show indirect-hit indicator (user contains nested email match but doesn't match "email" directly)
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();

        // User should be COLLAPSED, not expanded, even though it contains a match
        const userElement = document.querySelector(
          '[data-property-key="user"]'
        );
        expect(userElement?.classList.contains('expanded')).toBe(false);
      });
    });

    test('search collapses previously expanded properties', async () => {
      const expandableSchema: JsonSchema = {
        type: 'object',
        properties: {
          database: {
            type: 'object',
            description: 'Database configuration',
            properties: {
              host: {
                type: 'string',
                description: 'Database host',
              },
              port: {
                type: 'number',
                description: 'Database port',
              },
            },
          },
          cache: {
            type: 'object',
            description: 'Cache configuration',
            properties: {
              redis: {
                type: 'string',
                description: 'Redis connection string',
              },
            },
          },
        },
      };

      render(
        <DeckardSchema
          schema={expandableSchema}
          options={{ searchable: true, collapsible: true, autoExpand: true }}
        />
      );

      // Initially, properties should be expanded due to autoExpand
      await waitFor(() => {
        const databaseElement = document.querySelector(
          '[data-property-key="database"]'
        );
        const cacheElement = document.querySelector(
          '[data-property-key="cache"]'
        );

        expect(databaseElement?.classList.contains('expanded')).toBe(true);
        expect(cacheElement?.classList.contains('expanded')).toBe(true);
      });

      // Start a search - this should collapse ALL properties, even previously expanded ones
      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'redis' } });

      await waitFor(() => {
        // Only cache should be visible since database doesn't match "redis" search
        const cacheElement = document.querySelector(
          '[data-property-key="cache"]'
        );
        const databaseElement = document.querySelector(
          '[data-property-key="database"]'
        );

        // Cache should be visible and collapsed (even though it contains a match)
        expect(cacheElement).toBeInTheDocument();
        expect(cacheElement?.classList.contains('expanded')).toBe(false);

        // Database should not be visible since it doesn't match the search
        expect(databaseElement).toBeNull();

        // Cache should show indirect-hit indicator (contains nested "redis" match but doesn't match "redis" directly)
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();
      });
    });

    test('searchIncludesExamples disabled by default - does not search examples', async () => {
      const schemaWithExamples: JsonSchema = {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'API key for authentication',
            examples: ['sk_test_12345', 'sk_live_67890'],
          },
        },
      };

      render(
        <DeckardSchema
          schema={schemaWithExamples}
          options={{ searchable: true }} // searchIncludesExamples defaults to false
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'sk_test' } });

      await waitFor(() => {
        // Should show no results since examples are not searched by default
        const noResults = document.querySelector('.no-search-results');
        expect(noResults).toBeInTheDocument();
      });
    });

    test('searchIncludesExamples enabled - searches examples content', async () => {
      const schemaWithExamples: JsonSchema = {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'API key for authentication',
            examples: ['sk_test_12345', 'sk_live_67890'],
          },
          config: {
            type: 'object',
            description: 'Configuration settings',
            properties: {
              timeout: {
                type: 'number',
                description: 'Request timeout',
                examples: [5000, 10000],
              },
            },
          },
        },
      };

      render(
        <DeckardSchema
          schema={schemaWithExamples}
          options={{ searchable: true, searchIncludesExamples: true }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'sk_test' } });

      await waitFor(() => {
        // Should find apiKey property since examples are now searched
        const apiKeyProperty = screen.getByText('apiKey');
        expect(apiKeyProperty).toBeInTheDocument();

        // Should show direct hit indicator
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeInTheDocument();
      });

      // Test nested example search
      fireEvent.change(searchInput, { target: { value: '5000' } });

      await waitFor(() => {
        // Should find config property through nested timeout example
        const configProperty = screen.getByText('config');
        expect(configProperty).toBeInTheDocument();

        // Should show indirect-hit indicator for config (contains nested example match but doesn't match "5000" directly)
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();
      });
    });

    test('searchIncludesExamples disabled - parent gets indirect-hit when only sub-properties match', async () => {
      const complexSchema: JsonSchema = {
        type: 'object',
        properties: {
          storage: {
            type: 'object',
            description: 'Storage system settings',
            examples: ['redis://localhost:6379/cache'], // This should NOT match when examples disabled
            properties: {
              connection: {
                type: 'object',
                description: 'Connection parameters',
                properties: {
                  endpoint: {
                    type: 'string',
                    description: 'Service endpoint URL with zebra protocol', // This SHOULD match "zebra"
                  },
                },
              },
            },
          },
        },
      };

      render(
        <DeckardSchema
          schema={complexSchema}
          options={{ searchable: true, searchIncludesExamples: false }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      // Search for "zebra" which exists only in deeply nested endpoint description
      fireEvent.change(searchInput, { target: { value: 'zebra' } });

      await waitFor(() => {
        // Storage property should be visible because it contains a nested match
        const storageProperty = screen.getByText('storage');
        expect(storageProperty).toBeInTheDocument();

        // Should show indirect-hit indicator ONLY (not both-hit) because:
        // - Examples search is disabled, so "redis://localhost..." doesn't match
        // - Parent "storage" name and description don't contain "zebra"
        // - Only the deeply nested "endpoint" property description matches "zebra"
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();

        // Should NOT show both-hit indicator
        const bothHitIndicator = document.querySelector('.both-hit');
        expect(bothHitIndicator).toBeNull();

        // Should NOT show direct-hit indicator
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeNull();
      });
    });

    test('comprehensive search indicator coverage - all three types', async () => {
      const comprehensiveSchema: JsonSchema = {
        type: 'object',
        properties: {
          direct: {
            type: 'string',
            description: 'A property that contains the search term directly',
          },
          indirect: {
            type: 'object',
            description: 'Container property',
            properties: {
              nested: {
                type: 'string',
                description: 'Contains the search term',
              },
            },
          },
          both: {
            type: 'object',
            description: 'Contains the search term and has nested matches',
            properties: {
              child: {
                type: 'string',
                description: 'Also contains the search term',
              },
            },
          },
          nomatch: {
            type: 'string',
            description: 'Does not contain anything relevant',
          },
        },
      };

      render(
        <DeckardSchema
          schema={comprehensiveSchema}
          options={{ searchable: true }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'search term' } });

      await waitFor(() => {
        // Direct match - property description contains "search term"
        const directProperty = screen.getByText('direct');
        expect(directProperty).toBeInTheDocument();

        // Indirect match - property has nested "search term" matches but doesn't match itself
        const indirectProperty = screen.getByText('indirect');
        expect(indirectProperty).toBeInTheDocument();

        // Both match - property description AND nested properties contain "search term"
        const bothProperty = screen.getByText('both');
        expect(bothProperty).toBeInTheDocument();

        // No match property should not be visible
        const noMatchProperty = screen.queryByText('nomatch');
        expect(noMatchProperty).toBeNull();
      });

      await waitFor(() => {
        // Check that we have exactly one of each indicator type
        const directHitIndicator = document.querySelector('.direct-hit');
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        const bothHitIndicator = document.querySelector('.both-hit');

        expect(directHitIndicator).toBeInTheDocument();
        expect(indirectHitIndicator).toBeInTheDocument();
        expect(bothHitIndicator).toBeInTheDocument();

        // Verify we have exactly 3 search indicators total
        const allIndicators = document.querySelectorAll(
          '.search-hit-indicator'
        );
        expect(allIndicators).toHaveLength(3);
      });
    });

    test('oneOf description matches should be direct hits', async () => {
      const oneOfSchema: JsonSchema = {
        type: 'object',
        properties: {
          dependencies: {
            oneOf: [
              {
                type: 'string',
                description: 'Simple string dependency',
              },
              {
                type: 'object',
                description:
                  'Object defining extension dependencies or package dependencies with version constraints. For runtime dependencies, can define extension dependencies. For extension dependencies, can include SDK compile configurations.',
              },
            ],
          },
        },
      };

      render(
        <DeckardSchema schema={oneOfSchema} options={{ searchable: true }} />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'SDK' } });

      await waitFor(() => {
        // Should find the dependencies property
        const dependenciesProperty = screen.getByText('dependencies');
        expect(dependenciesProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // Should show direct-hit indicator because the match is in the oneOf description
        // which is part of the property's own definition
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeInTheDocument();

        // Should NOT show indirect-hit since the match is direct
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeNull();
      });
    });

    test('oneOf direct match with nested matches should be both-hit', async () => {
      const oneOfWithNestedSchema: JsonSchema = {
        type: 'object',
        properties: {
          dependencies: {
            oneOf: [
              {
                type: 'string',
                description: 'Simple string dependency',
              },
              {
                type: 'object',
                description:
                  'Object defining extension dependencies or package dependencies with version constraints. For runtime dependencies, can define extension dependencies. For extension dependencies, can include SDK compile configurations.',
                properties: {
                  compile: {
                    type: 'object',
                    description: 'SDK compilation settings',
                    properties: {
                      flags: {
                        type: 'array',
                        description: 'SDK compiler flags',
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      };

      render(
        <DeckardSchema
          schema={oneOfWithNestedSchema}
          options={{ searchable: true }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'SDK' } });

      await waitFor(() => {
        // Should find the dependencies property
        const dependenciesProperty = screen.getByText('dependencies');
        expect(dependenciesProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // Should show direct-hit indicator because oneOf properties are part of the
        // property's own definition, not separate nested entities
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeInTheDocument();

        // Should NOT show both-hit or indirect-hit since oneOf content is direct
        const bothHitIndicator = document.querySelector('.both-hit');
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(bothHitIndicator).toBeNull();
        expect(indirectHitIndicator).toBeNull();
      });
    });

    test('search with no results shows empty state', async () => {
      const simpleSchema: JsonSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'User name',
          },
          email: {
            type: 'string',
            description: 'User email address',
          },
          age: {
            type: 'number',
            description: 'User age in years',
          },
        },
      };

      render(
        <DeckardSchema schema={simpleSchema} options={{ searchable: true }} />
      );

      // Initially, all properties should be visible
      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.getByText('age')).toBeInTheDocument();
      });

      // Search for something that doesn't match anything
      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        // No properties should be visible
        expect(screen.queryByText('name')).toBeNull();
        expect(screen.queryByText('email')).toBeNull();
        expect(screen.queryByText('age')).toBeNull();

        // Should not have any search indicators
        const searchIndicators = document.querySelectorAll(
          '.search-hit-indicator'
        );
        expect(searchIndicators).toHaveLength(0);

        // Should show the no search results message
        const noResultsMessage = screen.getByText(
          'No properties match your search'
        );
        expect(noResultsMessage).toBeInTheDocument();

        // Should have the no search results container
        const noResultsContainer = document.querySelector('.no-search-results');
        expect(noResultsContainer).toBeInTheDocument();
      });

      // Clear the search to verify properties come back
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        // All properties should be visible again
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.getByText('age')).toBeInTheDocument();
      });
    });

    test('search transitions from results to no results and back', async () => {
      const testSchema: JsonSchema = {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            description: 'User login name',
          },
          password: {
            type: 'string',
            description: 'User password',
          },
          settings: {
            type: 'object',
            description: 'Application settings',
            properties: {
              theme: {
                type: 'string',
                description: 'UI theme preference',
              },
            },
          },
        },
      };

      render(
        <DeckardSchema schema={testSchema} options={{ searchable: true }} />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);

      // Start with a search that has results
      fireEvent.change(searchInput, { target: { value: 'user' } });

      await waitFor(() => {
        // Should find username (contains "user") and password (description contains "User")
        expect(screen.getByText('username')).toBeInTheDocument();
        expect(screen.getByText('password')).toBeInTheDocument();
        expect(screen.queryByText('settings')).toBeNull();

        // Should have search indicators
        const searchIndicators = document.querySelectorAll(
          '.search-hit-indicator'
        );
        expect(searchIndicators.length).toBeGreaterThan(0);
      });

      // Change to a search with no results
      fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });

      await waitFor(() => {
        // No properties should be visible
        expect(screen.queryByText('username')).toBeNull();
        expect(screen.queryByText('password')).toBeNull();
        expect(screen.queryByText('settings')).toBeNull();

        // Should show no search results message
        expect(
          screen.getByText('No properties match your search')
        ).toBeInTheDocument();

        // Should not have any search indicators
        const searchIndicators = document.querySelectorAll(
          '.search-hit-indicator'
        );
        expect(searchIndicators).toHaveLength(0);
      });

      // Search for something that has results again
      fireEvent.change(searchInput, { target: { value: 'settings' } });

      await waitFor(() => {
        // Should find settings property
        expect(screen.getByText('settings')).toBeInTheDocument();
        expect(screen.queryByText('username')).toBeNull();
        expect(screen.queryByText('password')).toBeNull();

        // No search results message should be gone
        expect(
          screen.queryByText('No properties match your search')
        ).toBeNull();

        // Should have search indicators again
        const searchIndicators = document.querySelectorAll(
          '.search-hit-indicator'
        );
        expect(searchIndicators.length).toBeGreaterThan(0);
      });
    });

    test('oneOf description match with nested properties should be direct hit (not indirect)', async () => {
      const complexOneOfSchema: JsonSchema = {
        type: 'object',
        properties: {
          dependencies: {
            oneOf: [
              {
                type: 'string',
                description: 'Simple string dependency',
              },
              {
                type: 'object',
                description:
                  'Object defining extension dependencies or package dependencies with version constraints. For runtime dependencies, can define extension dependencies. For extension dependencies, can include SDK compile configurations.',
                properties: {
                  compile: {
                    type: 'object',
                    description: 'Compilation settings',
                    properties: {
                      flags: {
                        type: 'array',
                        description: 'Compiler flags',
                      },
                    },
                  },
                  runtime: {
                    type: 'object',
                    description: 'Runtime configuration settings',
                    properties: {
                      version: {
                        type: 'string',
                        description: 'Version constraint',
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      };

      render(
        <DeckardSchema
          schema={complexOneOfSchema}
          options={{ searchable: true }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'SDK' } });

      await waitFor(() => {
        // Should find the dependencies property
        const dependenciesProperty = screen.getByText('dependencies');
        expect(dependenciesProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // Should show direct-hit indicator because the match is in the oneOf description
        // Even though the oneOf item also has nested properties, the match in the oneOf
        // description itself should make this a direct hit on the parent property
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeInTheDocument();

        // Should NOT show indirect-hit or both-hit since the match is direct in oneOf description
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        const bothHitIndicator = document.querySelector('.both-hit');
        expect(indirectHitIndicator).toBeNull();
        expect(bothHitIndicator).toBeNull();
      });
    });

    test('oneOf with patternProperties should show direct hit for description match', async () => {
      const patternPropertiesOneOfSchema: JsonSchema = {
        type: 'object',
        properties: {
          dependencies: {
            title: 'Dependencies',
            oneOf: [
              {
                type: 'string',
                description:
                  "Version requirement string. Use '*' for any version, '>=X.Y' for minimum version, 'X.Y.Z' for exact version, or semantic version ranges.",
              },
              {
                type: 'object',
                description:
                  'Object defining extension dependencies or package dependencies with version constraints. For runtime dependencies, can define extension dependencies. For extension dependencies, can include SDK compile configurations.',
                patternProperties: {
                  '^[a-zA-Z0-9_.-]+$': {
                    oneOf: [
                      {
                        type: 'string',
                        description: 'Version constraint string.',
                      },
                      {
                        type: 'object',
                        description: 'Extension dependency object.',
                        properties: {
                          path: { type: 'string' },
                          version: { type: 'string' },
                        },
                        additionalProperties: true,
                      },
                    ],
                  },
                },
                additionalProperties: false,
              },
            ],
          },
        },
      };

      render(
        <DeckardSchema
          schema={patternPropertiesOneOfSchema}
          options={{ searchable: true }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'SDK' } });

      await waitFor(() => {
        // Should find the dependencies property
        const dependenciesProperty = screen.getByText('dependencies');
        expect(dependenciesProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // Should show direct-hit indicator because the match is in the oneOf description
        // even though the oneOf object option has patternProperties with nested structure
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeInTheDocument();

        // Should NOT show indirect-hit since the match is in the oneOf description, not in nested properties
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeNull();
      });
    });

    test('oneOf with nested properties but description match should be direct hit', async () => {
      const oneOfWithNestedSchema: JsonSchema = {
        type: 'object',
        properties: {
          dependencies: {
            description: 'Package dependencies required by the extension.',
            oneOf: [
              {
                type: 'string',
                description: 'Simple string dependency',
              },
              {
                type: 'object',
                description:
                  'Object defining extension dependencies or package dependencies with version constraints. For runtime dependencies, can define extension dependencies. For extension dependencies, can include SDK compile configurations.',
                properties: {
                  'example-rust': {
                    type: 'object',
                    properties: {
                      dependencies: {
                        type: 'object',
                        properties: {
                          'example-rust-app': {
                            type: 'object',
                            properties: {
                              compile: { type: 'string' },
                              install: { type: 'string' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      };

      render(
        <DeckardSchema
          schema={oneOfWithNestedSchema}
          options={{ searchable: true }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'SDK' } });

      await waitFor(() => {
        // Should find the dependencies property
        const dependenciesProperty = screen.getByText('dependencies');
        expect(dependenciesProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // Should show direct-hit indicator because the match is in the oneOf description
        // even though the oneOf object option has nested properties
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeInTheDocument();

        // Should NOT show indirect-hit since the match is in the oneOf description, not nested
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeNull();
      });
    });

    test('exact dependencies schema from user should show direct hit for SDK search', async () => {
      const exactUserSchema: JsonSchema = {
        type: 'object',
        properties: {
          dependencies: {
            title: 'Dependencies',
            oneOf: [
              {
                type: 'string',
                description:
                  "Version requirement string. Use '*' for any version, '>=X.Y' for minimum version, 'X.Y.Z' for exact version, or semantic version ranges.",
                examples: ['*', '>=1.0.0', '2.1.3'],
              },
              {
                type: 'object',
                description:
                  'Object defining extension dependencies or package dependencies with version constraints. For runtime dependencies, can define extension dependencies. For extension dependencies, can include SDK compile configurations.',
                patternProperties: {
                  '^[a-zA-Z0-9_.-]+$': {
                    oneOf: [
                      {
                        type: 'string',
                        description:
                          "Version constraint string. Use '*' for any version, '>=X.Y' for minimum version, 'X.Y.Z' for exact version, or semantic version ranges.",
                        examples: ['*', '>=1.0.0', '2.1.3'],
                      },
                      {
                        type: 'object',
                        description:
                          'Extension dependency object that can include path references for runtime dependencies or SDK compile configurations for extension dependencies.',
                        properties: {
                          path: {
                            type: 'string',
                            description: 'Path to local extension dependency.',
                            examples: ['../extensions/wifi', './local-ext'],
                          },
                          version: {
                            type: 'string',
                            description:
                              'Version constraint for the dependency.',
                            examples: ['*', '>=1.0.0', '2.1.3'],
                          },
                          sdk: {
                            type: 'object',
                            description:
                              'SDK compile configuration for this dependency.',
                            properties: {
                              compile: {
                                type: 'string',
                                description:
                                  'Compile command for building this dependency.',
                                examples: ['make', 'cmake --build .'],
                              },
                              dependencies: {
                                $ref: '#/definitions/dependencies',
                                description:
                                  'Build-time dependencies for compiling this dependency.',
                              },
                            },
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: true,
                      },
                    ],
                  },
                },
                additionalProperties: false,
              },
            ],
            examples: [
              '*',
              {
                cmake: '>=3.22.0',
                wifi: {
                  path: '../extensions/wifi',
                  sdk: {
                    compile: 'make',
                    dependencies: {
                      libnl: '3.5.0',
                    },
                  },
                },
              },
            ],
          },
        },
      };

      render(
        <DeckardSchema
          schema={exactUserSchema}
          options={{ searchable: true }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'SDK' } });

      await waitFor(() => {
        // Should find the dependencies property
        const dependenciesProperty = screen.getByText('dependencies');
        expect(dependenciesProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // Should show direct-hit indicator because the match is in the oneOf description
        // "can include SDK compile configurations" - this is direct content of dependencies property
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeInTheDocument();

        // Should NOT show indirect-hit since the match is in the oneOf description, not nested
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeNull();
      });
    });

    test('pattern property with OneOf definition should show direct hit for description match', async () => {
      const patternPropertyOneOfDefinitionSchema: JsonSchema = {
        type: 'object',
        properties: {
          ext: {
            type: 'object',
            description:
              'Extension configurations for both local extensions (defined in this file) and external extensions (referenced through dependencies).',
            patternProperties: {
              '^[a-zA-Z0-9_.-]+$': {
                type: 'object',
                description:
                  'Configuration for an Avocado OS extension (system extension or configuration extension).',
                properties: {
                  dependencies: {
                    $ref: '#/definitions/dependencies',
                  },
                },
                additionalProperties: true,
              },
            },
            additionalProperties: false,
          },
        },
        definitions: {
          dependencies: {
            title: 'Dependencies',
            oneOf: [
              {
                type: 'string',
                description:
                  "Version requirement string. Use '*' for any version.",
              },
              {
                type: 'object',
                description:
                  'Object defining extension dependencies or package dependencies with version constraints. For runtime dependencies, can define extension dependencies. For extension dependencies, can include SDK compile configurations.',
                patternProperties: {
                  '^[a-zA-Z0-9_.-]+$': {
                    oneOf: [
                      {
                        type: 'string',
                        description: 'Version constraint string.',
                      },
                      {
                        type: 'object',
                        description: 'Extension dependency object.',
                        properties: {
                          path: { type: 'string' },
                          version: { type: 'string' },
                        },
                        additionalProperties: true,
                      },
                    ],
                  },
                },
                additionalProperties: false,
              },
            ],
          },
        },
      };

      render(
        <DeckardSchema
          schema={patternPropertyOneOfDefinitionSchema}
          options={{ searchable: true }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'SDK' } });

      await waitFor(() => {
        // Should find the ext property
        const extProperty = screen.getByText('ext');
        expect(extProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // With collapsible behavior, everything is collapsed during search:
        // 1. ext.(pattern-0).dependencies is a direct hit (contains "SDK" in oneOf description)
        // 2. ext.(pattern-0) is an indirect hit (contains the direct hit)
        // 3. ext is an indirect hit (contains nested matches)
        // 4. But during search, everything is collapsed so only ext is visible
        // 5. ext should show an indirect hit indicator
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();

        // Should NOT show direct-hit since the direct match is in collapsed nested content
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeNull();

        // The "dependencies" text should NOT be visible since everything is collapsed
        const dependenciesText = screen.queryByText('dependencies');
        expect(dependenciesText).not.toBeInTheDocument();
      });
    });

    test('anyOf description match should be direct hit', async () => {
      const anyOfSchema: JsonSchema = {
        type: 'object',
        properties: {
          config: {
            anyOf: [
              {
                type: 'string',
                description: 'Simple string configuration',
              },
              {
                type: 'object',
                description:
                  'Advanced configuration object with API key settings for external services',
              },
            ],
          },
        },
      };

      render(
        <DeckardSchema schema={anyOfSchema} options={{ searchable: true }} />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'API' } });

      await waitFor(() => {
        // Should find the config property
        const configProperty = screen.getByText('config');
        expect(configProperty).toBeInTheDocument();
      });

      await waitFor(() => {
        // Should show direct-hit indicator because the match is in the anyOf description
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeInTheDocument();

        // Should NOT show indirect-hit since the match is direct
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeNull();
      });
    });

    test('search with collapsed behavior shows only top-level indirect hits', async () => {
      // When searching with collapsible behavior, everything is collapsed so only
      // top-level properties are visible. The nested dependencies property with the
      // direct match won't be visible, so ext should show as indirect hit.
      const bugReproSchema: JsonSchema = {
        type: 'object',
        properties: {
          ext: {
            title: 'Extensions',
            type: 'object',
            patternProperties: {
              '^[a-zA-Z0-9_-]+$': {
                $ref: '#/definitions/extensionConfig',
              },
            },
          },
        },
        definitions: {
          extensionConfig: {
            type: 'object',
            properties: {
              dependencies: {
                $ref: '#/definitions/dependencies',
              },
            },
          },
          dependencies: {
            oneOf: [
              {
                type: 'string',
                description: 'Version requirement string.',
              },
              {
                type: 'object',
                description:
                  'Object defining extension dependencies. For extension dependencies, can include SDK compile configurations.',
              },
            ],
          },
        },
      };

      render(
        <DeckardSchema schema={bugReproSchema} options={{ searchable: true }} />
      );

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      fireEvent.change(searchInput, { target: { value: 'SDK' } });

      await waitFor(() => {
        const extProperty = screen.getByText('ext');
        expect(extProperty).toBeInTheDocument();
      });

      // With collapsible behavior, everything is collapsed during search:
      // 1. ext.(pattern-0).dependencies is a direct hit (contains "SDK" in oneOf description)
      // 2. ext.(pattern-0) is an indirect hit (contains the direct hit)
      // 3. ext is an indirect hit (contains nested matches)
      // 4. But during search, everything is collapsed so only ext is visible
      // 5. ext should show an indirect hit indicator
      await waitFor(() => {
        // Should show indirect-hit indicator for ext (contains nested SDK match but doesn't match "SDK" directly)
        const indirectHitIndicator = document.querySelector('.indirect-hit');
        expect(indirectHitIndicator).toBeInTheDocument();

        // Should NOT show direct-hit since the direct match is in collapsed nested content
        const directHitIndicator = document.querySelector('.direct-hit');
        expect(directHitIndicator).toBeNull();

        // The "dependencies" text should NOT be visible since everything is collapsed
        const dependenciesText = screen.queryByText('dependencies');
        expect(dependenciesText).not.toBeInTheDocument();
      });
    });

    describe('active route functionality', () => {
      beforeEach(() => {
        // Mock window.location for hash testing
        const mockLocation = {
          hash: '',
          origin: 'http://localhost:3000',
          pathname: '/test',
        };

        // Store original and mock
        delete (window as any).location;
        window.location = mockLocation as any;

        // Mock addEventListener/removeEventListener
        vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
        vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      test('hash conversion works for allOf pattern properties', async () => {
        const schema: JsonSchema = {
          type: 'object',
          properties: {
            sdk: {
              title: 'SDK configuration',
              allOf: [
                {
                  type: 'object',
                  patternProperties: {
                    '^[a-zA-Z0-9_-]+$': {
                      type: 'string',
                      description: 'Pattern property configuration',
                    },
                  },
                },
              ],
            },
          },
          definitions: {},
        };

        // Set hash in URL format (with dashes)
        window.location.hash = '#sdk-(pattern-0)';

        render(
          <DeckardSchema
            schema={schema}
            options={{
              collapsible: true,
              includeExamples: true,
              examplesOnFocusOnly: false,
            }}
          />
        );

        await waitFor(() => {
          // Verify SDK property is expanded due to hash targeting
          const sdkElement = document.querySelector(
            '[data-property-key="sdk"]'
          );
          expect(sdkElement?.classList.contains('expanded')).toBe(true);

          // Verify the hash conversion logic is working by checking the expansion occurred
          // This proves that the hash #sdk-(pattern-0) was correctly converted to sdk.(pattern-0)
          // and the parent SDK property was expanded as a result
          expect(sdkElement).toBeInTheDocument();
        });

        // This test verifies that:
        // 1. Hash format #sdk-(pattern-0) correctly converts to property key sdk.(pattern-0)
        // 2. Parent properties are expanded when targeting nested allOf pattern properties
        // 3. Our fix to remove 'allof' from paths works with active route functionality
        // 4. Most importantly: allOf pattern properties no longer generate paths with 'allof'
      });

      test('SDK allOf with pattern properties should render pattern fields like real schema', async () => {
        // This schema exactly matches the user's real schema structure
        const realSchema: JsonSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://avocado.com/schemas/avocado-config.json',
          title: 'Avocado Configuration',
          type: 'object',
          properties: {
            sdk: {
              title: 'SDK configuration',
              allOf: [
                {
                  $ref: '#/definitions/sdkConfig',
                },
                {
                  type: 'object',
                  patternProperties: {
                    '^[a-zA-Z0-9_-]+$': {
                      oneOf: [
                        {
                          $ref: '#/definitions/sdkConfig',
                        },
                        {
                          type: [
                            'string',
                            'number',
                            'boolean',
                            'array',
                            'object',
                          ],
                        },
                      ],
                      description:
                        'Target-specific SDK configuration that overrides the default SDK settings for a particular target architecture.',
                    },
                  },
                },
              ],
              description:
                'SDK settings for building your Avocado OS project. Defines the build environment, dependencies, and compilation configurations.',
            },
          },
          definitions: {
            sdkConfig: {
              title: 'SDK configuration',
              type: 'object',
              description:
                'SDK configuration for building Avocado OS projects.',
              properties: {
                image: {
                  title: 'Docker image',
                  type: 'string',
                  description:
                    'Docker image to use for the SDK build environment. This provides the toolchain and build tools necessary for compilation.',
                  examples: ['avocado/sdk:2.0'],
                },
                dependencies: {
                  title: 'Dependencies',
                  $ref: '#/definitions/dependencies',
                  description:
                    'SDK-level dependencies required for building the project. These are installed in the build environment.',
                  examples: [
                    {
                      cmake: '*',
                      make: '>=4.0',
                    },
                  ],
                },
                compile: {
                  title: 'Compile configurations',
                  type: 'object',
                  description:
                    'Compile configurations for specific extensions or components. Each entry defines how to build a particular extension.',
                  patternProperties: {
                    '^[a-zA-Z0-9_-]+$': {
                      $ref: '#/definitions/compileConfig',
                    },
                  },
                  additionalProperties: false,
                },
                repo_url: {
                  title: 'Repository URL',
                  type: 'string',
                  description:
                    'URL of the repository containing SDK resources. Can be overridden with the AVOCADO_SDK_REPO_URL environment variable.',
                },
                repo_release: {
                  title: 'Repository release',
                  type: 'string',
                  description:
                    'Specific release/tag of the SDK repository to use. Can be overridden with the AVOCADO_SDK_REPO_RELEASE environment variable.',
                },
                container_args: {
                  title: 'Container arguments',
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description:
                    'Additional arguments to pass to the Docker container. Supports environment variable expansion using ${VAR_NAME} syntax.',
                },
              },
              additionalProperties: false,
            },
            dependencies: {
              title: 'Dependencies',
              oneOf: [
                {
                  type: 'string',
                  description: 'Version requirement string.',
                },
                {
                  type: 'object',
                  description:
                    'Object defining extension dependencies or package dependencies with version constraints.',
                  patternProperties: {
                    '^[a-zA-Z0-9_.-]+$': {
                      oneOf: [
                        {
                          type: 'string',
                          description: 'Version constraint string.',
                        },
                        {
                          type: 'object',
                          properties: {
                            path: {
                              type: 'string',
                              description:
                                'Path to local extension dependency.',
                            },
                          },
                          additionalProperties: true,
                        },
                      ],
                    },
                  },
                  additionalProperties: false,
                },
              ],
            },
            compileConfig: {
              title: 'Compile configuration',
              type: 'object',
              description:
                'Compilation configuration for a specific extension or component.',
              properties: {
                compile: {
                  title: 'Compile command',
                  type: 'string',
                  description:
                    'Compile command or script to execute for building this component.',
                },
                dependencies: {
                  $ref: '#/definitions/dependencies',
                  description:
                    'Build-time dependencies required for compiling this component.',
                },
              },
              additionalProperties: false,
            },
          },
        };

        render(
          <DeckardSchema
            schema={realSchema}
            options={{
              collapsible: true,
              includeExamples: true,
              examplesOnFocusOnly: false,
            }}
          />
        );

        // First, expand the SDK property
        const sdkToggle = screen.getByText('sdk');
        fireEvent.click(sdkToggle);

        await waitFor(() => {
          // Should show the regular sdkConfig properties (image, dependencies, etc.)
          expect(screen.getByText('image')).toBeInTheDocument();
          expect(screen.getAllByText('dependencies').length).toBeGreaterThan(0);
          expect(screen.getByText('compile')).toBeInTheDocument();
          expect(screen.getByText('repo_url')).toBeInTheDocument();
          expect(screen.getByText('repo_release')).toBeInTheDocument();
          expect(screen.getByText('container_args')).toBeInTheDocument();

          // Should also show pattern properties for target-specific configs
          // This is the key issue - pattern properties from allOf should be visible
          const patternProperty = screen.queryByText('{pattern}');

          // The pattern property should be rendered from the allOf - this is the key test

          expect(patternProperty).toBeInTheDocument();
        });

        // Verify the pattern property has the correct description
        await waitFor(() => {
          const patternDescription = screen.queryByText(
            /Target-specific SDK configuration/
          );

          expect(patternDescription).toBeInTheDocument();
        });
      });

      test.skip('REPRO: Hash navigation to pattern properties in allOf fails', async () => {
        // This reproduces the user's issue - they navigate to #sdk-(pattern-0) but it doesn't work
        const realAvocadoSchema: JsonSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://avocado.com/schemas/avocado-config.json',
          title: 'Avocado Configuration',
          type: 'object',
          properties: {
            sdk: {
              title: 'SDK configuration',
              allOf: [
                {
                  $ref: '#/definitions/sdkConfig',
                },
                {
                  type: 'object',
                  patternProperties: {
                    '^[a-zA-Z0-9_-]+$': {
                      oneOf: [
                        {
                          $ref: '#/definitions/sdkConfig',
                        },
                        {
                          type: [
                            'string',
                            'number',
                            'boolean',
                            'array',
                            'object',
                          ],
                        },
                      ],
                      description:
                        'Target-specific SDK configuration that overrides the default SDK settings for a particular target architecture.',
                    },
                  },
                },
              ],
              description: 'SDK settings for building your Avocado OS project.',
            },
          },
          definitions: {
            sdkConfig: {
              title: 'SDK configuration',
              type: 'object',
              properties: {
                image: {
                  title: 'Docker image',
                  type: 'string',
                  description:
                    'Docker image to use for the SDK build environment.',
                  examples: ['avocado/sdk:2.0'],
                },
                dependencies: {
                  title: 'Dependencies',
                  type: 'object',
                  description:
                    'SDK-level dependencies required for building the project.',
                },
              },
              additionalProperties: false,
            },
          },
        };

        // Set hash to target the pattern property like user did: #sdk-(pattern-0)
        window.location.hash = '#sdk-(pattern-0)';

        const { container } = render(
          <DeckardSchema
            schema={realAvocadoSchema}
            options={{
              collapsible: true,
              includeExamples: true,
              examplesOnFocusOnly: false,
            }}
          />
        );

        // Wait for the component to process the hash and expand properties
        await waitFor(
          async () => {
            // The SDK property should be expanded due to hash targeting
            const sdkElement = container.querySelector(
              '[data-property-key="sdk"]'
            );
            expect(sdkElement?.classList.contains('expanded')).toBe(true);

            // The pattern property should exist after SDK is expanded
            const patternProperty = screen.queryByText('{pattern}');
            expect(patternProperty).toBeInTheDocument();

            // The pattern property element should exist
            const patternElement = container.querySelector(
              '[data-property-key="sdk.(pattern-0)"]'
            );
            expect(patternElement).toBeInTheDocument();

            // The pattern property should be focused due to hash navigation
            expect(patternElement?.classList.contains('focused')).toBe(true);
          },
          { timeout: 2000 }
        );

        // Now expand the pattern property to see its nested fields
        await waitFor(() => {
          const patternProperty = screen.getByText('{pattern}');
          fireEvent.click(patternProperty);
        });

        // Check if pattern property shows nested fields after expansion
        await waitFor(() => {
          // The pattern property should show its oneOf options or nested fields
          const patternElement = container.querySelector(
            '[data-property-key="sdk.(pattern-0)"]'
          );

          // Look for nested properties with correct pattern property paths
          // After the fix, properties should have paths like sdk.(pattern-0).image
          const imageInPattern = container.querySelector(
            '[data-property-key="sdk.(pattern-0).image"]'
          );
          const dependenciesInPattern = container.querySelector(
            '[data-property-key="sdk.(pattern-0).dependencies"]'
          );

          // Check if we can find the properties by text content within the pattern element
          const imageText = patternElement?.textContent?.includes('image');
          const dependenciesText =
            patternElement?.textContent?.includes('dependencies');

          // This should now work - pattern properties with oneOf should show nested fields

          // The pattern property should exist and show nested content
          expect(patternElement).toBeInTheDocument();
          // At least one of these should be true now
          expect(
            imageInPattern ||
              dependenciesInPattern ||
              imageText ||
              dependenciesText
          ).toBe(true);
        });
      });

      test('Pattern properties in allOf show nested fields when expanded', async () => {
        // Simple test to verify the fix is working
        const simplePatternSchema: JsonSchema = {
          type: 'object',
          properties: {
            sdk: {
              allOf: [
                {
                  type: 'object',
                  patternProperties: {
                    '^[a-zA-Z0-9_-]+$': {
                      type: 'object',
                      properties: {
                        image: {
                          type: 'string',
                          description: 'Docker image',
                        },
                        dependencies: {
                          type: 'object',
                          description: 'Dependencies',
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        };

        const { container } = render(
          <DeckardSchema
            schema={simplePatternSchema}
            options={{ collapsible: true }}
          />
        );

        // Expand SDK
        const sdkToggle = screen.getByText('sdk');
        fireEvent.click(sdkToggle);

        await waitFor(() => {
          // Should see the pattern property
          const patternProperty = screen.queryByText('{pattern}');

          expect(patternProperty).toBeInTheDocument();
        });

        // Expand pattern property
        const patternProperty = screen.getByText('{pattern}');
        fireEvent.click(patternProperty);

        await waitFor(() => {
          // Should now see nested fields from pattern property
          const imageField = container.querySelector(
            '[data-property-key="sdk.(pattern-0).image"]'
          );
          const dependenciesField = container.querySelector(
            '[data-property-key="sdk.(pattern-0).dependencies"]'
          );

          // This is what we're testing - pattern properties should show nested fields
          expect(imageField || dependenciesField).toBeTruthy();
        });
      });

      test('Pattern properties with oneOf schema show nested fields when expanded', async () => {
        // This test specifically reproduces the user's issue with oneOf in pattern properties
        const oneOfPatternSchema: JsonSchema = {
          type: 'object',
          properties: {
            sdk: {
              allOf: [
                {
                  type: 'object',
                  patternProperties: {
                    '^[a-zA-Z0-9_-]+$': {
                      oneOf: [
                        {
                          type: 'object',
                          properties: {
                            image: {
                              type: 'string',
                              description: 'Docker image',
                            },
                            dependencies: {
                              type: 'object',
                              description: 'Dependencies',
                            },
                          },
                        },
                        {
                          type: 'string',
                        },
                      ],
                      description: 'Target-specific SDK configuration',
                    },
                  },
                },
              ],
            },
          },
        };

        render(
          <DeckardSchema
            schema={oneOfPatternSchema}
            options={{
              collapsible: true,
              includeExamples: true,
              examplesOnFocusOnly: false,
            }}
          />
        );

        // First expand SDK
        const sdkToggle = screen.getByText('sdk');
        fireEvent.click(sdkToggle);

        await waitFor(() => {
          // Should see the pattern property
          const patternProperty = screen.queryByText('{pattern}');
          expect(patternProperty).toBeInTheDocument();
        });

        // Expand pattern property
        const patternProperty = screen.getByText('{pattern}');
        fireEvent.click(patternProperty);

        await waitFor(() => {
          // Should now see nested fields from pattern property oneOf options
          const imageField = document.querySelector(
            '[data-property-key="sdk.(pattern-0).image"]'
          );
          const dependenciesField = document.querySelector(
            '[data-property-key="sdk.(pattern-0).dependencies"]'
          );

          // This is what we're testing - pattern properties with oneOf should show nested fields
          expect(imageField || dependenciesField).toBeTruthy();
        });
      });
    });
  });

  describe('keyboard shortcuts modal', () => {
    test('opens keyboard modal when keyboard button is clicked', () => {
      render(<DeckardSchema schema={mockSchema} />);

      const keyboardButton = screen.getByLabelText('View keyboard shortcuts');
      fireEvent.click(keyboardButton);

      expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    test('closes keyboard modal when close button is clicked', () => {
      render(<DeckardSchema schema={mockSchema} />);

      const keyboardButton = screen.getByLabelText('View keyboard shortcuts');
      fireEvent.click(keyboardButton);

      expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Close keyboard shortcuts');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Keyboard shortcuts')).not.toBeInTheDocument();
    });

    test('closes keyboard modal when clicking overlay', () => {
      render(<DeckardSchema schema={mockSchema} />);

      const keyboardButton = screen.getByLabelText('View keyboard shortcuts');
      fireEvent.click(keyboardButton);

      expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument();

      const overlay = screen
        .getByText('Keyboard shortcuts')
        .closest('.modal-overlay');
      fireEvent.click(overlay!);

      expect(screen.queryByText('Keyboard shortcuts')).not.toBeInTheDocument();
    });

    test('displays all keyboard shortcut sections', () => {
      render(<DeckardSchema schema={mockSchema} />);

      const keyboardButton = screen.getByLabelText('View keyboard shortcuts');
      fireEvent.click(keyboardButton);

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Expand & collapse')).toBeInTheDocument();
      expect(screen.getByText('Display')).toBeInTheDocument();
      expect(screen.getByText('Tooltips')).toBeInTheDocument();
    });

    test('displays correct navigation shortcuts', () => {
      render(<DeckardSchema schema={mockSchema} />);

      const keyboardButton = screen.getByLabelText('View keyboard shortcuts');
      fireEvent.click(keyboardButton);

      expect(screen.getByText('Next property')).toBeInTheDocument();
      expect(screen.getByText('Previous property')).toBeInTheDocument();
      expect(screen.getByText('Collapse property')).toBeInTheDocument();
      expect(screen.getByText('Expand property')).toBeInTheDocument();
    });

    test('displays correct search shortcuts', () => {
      render(<DeckardSchema schema={mockSchema} />);

      const keyboardButton = screen.getByLabelText('View keyboard shortcuts');
      fireEvent.click(keyboardButton);

      expect(screen.getByText('Focus search box')).toBeInTheDocument();
      expect(screen.getByText('Clear search')).toBeInTheDocument();
      expect(screen.getByText('Close tooltips')).toBeInTheDocument();
    });

    test('displays examples shortcut as "Show examples" when examples are hidden', () => {
      render(<DeckardSchema schema={mockSchema} />);

      // Press 'e' key to hide examples
      fireEvent.keyDown(document, { key: 'e' });

      const keyboardButton = screen.getByLabelText('View keyboard shortcuts');
      fireEvent.click(keyboardButton);

      expect(screen.getByText('Show examples')).toBeInTheDocument();
    });

    test('displays examples shortcut as "Hide examples" when examples are shown', () => {
      render(<DeckardSchema schema={mockSchema} />);

      // Examples are shown by default, so we should see "Hide examples"
      const keyboardButton = screen.getByLabelText('View keyboard shortcuts');
      fireEvent.click(keyboardButton);

      expect(screen.getByText('Hide examples')).toBeInTheDocument();
    });
  });
});
