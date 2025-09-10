import React, { useState } from 'react';
import { DeckardSchema } from '../src';

const exampleSchema = {
  title: 'User Profile API',
  description: 'Complete schema for user profile management system',
  type: 'object',
  properties: {
    user: {
      type: 'object',
      description: 'Main user object containing all user-related information',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Unique identifier for the user',
          examples: ['123e4567-e89b-12d3-a456-426614174000'],
        },
        profile: {
          type: 'object',
          description: 'Personal profile information',
          properties: {
            firstName: {
              type: 'string',
              description: "User's first name",
              minLength: 1,
              maxLength: 50,
              examples: ['John', 'Jane', 'Alex'],
            },
            lastName: {
              type: 'string',
              description: "User's last name",
              minLength: 1,
              maxLength: 50,
              examples: ['Doe', 'Smith', 'Johnson'],
            },
            displayName: {
              type: 'string',
              description: 'Public display name (optional)',
              maxLength: 100,
              examples: ['John D.', 'Jane Smith', 'Alex J'],
            },
            avatar: {
              type: 'string',
              format: 'uri',
              description: "URL to user's profile picture",
              examples: [
                'https://example.com/avatars/user123.jpg',
                'https://cdn.example.com/profiles/jane-doe.png',
              ],
            },
            bio: {
              type: 'string',
              description: 'Short biographical description',
              maxLength: 500,
              examples: [
                'Software engineer passionate about open source',
                'Digital marketing specialist and coffee enthusiast',
              ],
            },
          },
          required: ['firstName', 'lastName'],
        },
        contact: {
          type: 'object',
          description: 'Contact information',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Primary email address',
              examples: ['john.doe@example.com', 'jane@company.org'],
            },
            phone: {
              type: 'string',
              pattern: '^\\+?[1-9]\\d{1,14}$',
              description: 'Phone number in international format',
              examples: ['+1234567890', '+44207123456'],
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Personal or professional website',
              examples: ['https://johndoe.com', 'https://janesmith.dev'],
            },
          },
          required: ['email'],
        },
        preferences: {
          type: 'object',
          description: 'User preferences and settings',
          properties: {
            theme: {
              type: 'string',
              enum: ['light', 'dark', 'auto'],
              default: 'auto',
              description: 'UI theme preference',
            },
            language: {
              type: 'string',
              enum: ['en', 'es', 'fr', 'de', 'ja'],
              default: 'en',
              description: 'Preferred language for interface',
            },
            notifications: {
              type: 'object',
              description: 'Notification preferences',
              properties: {
                email: {
                  type: 'boolean',
                  default: true,
                  description: 'Receive email notifications',
                },
                push: {
                  type: 'boolean',
                  default: false,
                  description: 'Receive push notifications',
                },
                marketing: {
                  type: 'boolean',
                  default: false,
                  description: 'Receive marketing communications',
                },
              },
            },
            privacy: {
              type: 'object',
              description: 'Privacy settings',
              properties: {
                profileVisibility: {
                  type: 'string',
                  enum: ['public', 'friends', 'private'],
                  default: 'friends',
                  description: 'Who can view the profile',
                },
                showEmail: {
                  type: 'boolean',
                  default: false,
                  description: 'Show email address publicly',
                },
              },
            },
          },
        },
        metadata: {
          type: 'object',
          description: 'System metadata',
          properties: {
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              examples: ['2023-01-15T10:30:00Z'],
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last profile update timestamp',
              examples: ['2023-12-01T15:45:30Z'],
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
              examples: ['2023-12-15T09:20:15Z'],
            },
            loginCount: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of logins',
              examples: [42, 157, 1203],
            },
            tags: {
              type: 'array',
              description: 'System tags for categorization',
              items: {
                type: 'string',
              },
              examples: [
                ['premium', 'verified'],
                ['beta-tester'],
                ['enterprise'],
              ],
            },
          },
        },
      },
      required: ['id', 'profile', 'contact'],
    },
  },
  required: ['user'],
  definitions: {
    Timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp',
    },
    UUID: {
      type: 'string',
      format: 'uuid',
      description: 'UUID version 4 identifier',
    },
  },
};

const simpleSchema = {
  title: 'Simple API',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Item name',
      minLength: 2,
      maxLength: 100,
    },
    count: {
      type: 'integer',
      minimum: 0,
      examples: [1, 5, 10],
    },
    active: {
      type: 'boolean',
      default: true,
      description: 'Whether the item is active',
    },
    value: {
      oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
      description: 'A flexible value that can be string, number, or boolean',
    },
    data: {
      anyOf: [{ type: 'object' }, { type: 'array' }],
      description: 'Data can be an object or array',
    },
    config: {
      allOf: [
        { type: 'object' },
        {
          properties: {
            enabled: { type: 'boolean' },
          },
        },
      ],
      description: 'Configuration object with enabled flag',
    },
  },
  required: ['name'],
};

export default function Example() {
  const [selectedSchema, setSelectedSchema] = useState<'simple' | 'complex'>(
    'simple'
  );
  const [options, setOptions] = useState({
    includeHeader: true,
    includePropertiesTitle: true,
    includeDefinitions: false,
    includeExamples: false,
    searchable: true,
    collapsible: true,
    autoExpand: false,
  });

  const currentSchema =
    selectedSchema === 'simple' ? simpleSchema : exampleSchema;

  return (
    <div
      style={{
        fontFamily: 'system-ui',
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <h1>Deckard React Component Example</h1>

      <div
        style={{
          marginBottom: '2rem',
          padding: '1rem',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
        }}
      >
        <h3>Configuration</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ marginRight: '1rem' }}>
            <input
              type="radio"
              checked={selectedSchema === 'simple'}
              onChange={() => setSelectedSchema('simple')}
            />
            Simple Schema
          </label>
          <label>
            <input
              type="radio"
              checked={selectedSchema === 'complex'}
              onChange={() => setSelectedSchema('complex')}
            />
            Complex Schema
          </label>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <input
              type="checkbox"
              checked={options.includeHeader}
              onChange={e =>
                setOptions({ ...options, includeHeader: e.target.checked })
              }
            />
            Include Header
          </label>

          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <input
              type="checkbox"
              checked={options.includePropertiesTitle}
              onChange={e =>
                setOptions({
                  ...options,
                  includePropertiesTitle: e.target.checked,
                })
              }
            />
            Properties Title
          </label>

          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <input
              type="checkbox"
              checked={options.includeDefinitions}
              onChange={e =>
                setOptions({ ...options, includeDefinitions: e.target.checked })
              }
            />
            Include Definitions
          </label>

          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <input
              type="checkbox"
              checked={options.includeExamples}
              onChange={e =>
                setOptions({ ...options, includeExamples: e.target.checked })
              }
            />
            Include Examples
          </label>

          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <input
              type="checkbox"
              checked={options.searchable}
              onChange={e =>
                setOptions({ ...options, searchable: e.target.checked })
              }
            />
            Searchable
          </label>

          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <input
              type="checkbox"
              checked={options.collapsible}
              onChange={e =>
                setOptions({ ...options, collapsible: e.target.checked })
              }
            />
            Collapsible
          </label>

          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <input
              type="checkbox"
              checked={options.autoExpand}
              onChange={e =>
                setOptions({ ...options, autoExpand: e.target.checked })
              }
            />
            Auto Expand
          </label>
        </div>
      </div>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
        }}
      >
        <h3>Schema Documentation</h3>
        <DeckardSchema schema={currentSchema} options={options} />
      </div>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
        }}
      >
        <h3>Keyboard Shortcuts</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>
            <kbd>/</kbd> - Focus search
          </li>
          <li>
            <kbd>Ctrl/Cmd + E</kbd> - Expand all properties
          </li>
          <li>
            <kbd>Ctrl/Cmd + Shift + E</kbd> - Collapse all properties
          </li>
          <li>
            <kbd>Escape</kbd> - Clear search
          </li>
          <li>
            Click any <code>code</code> element to copy to clipboard
          </li>
        </ul>
      </div>
    </div>
  );
}
