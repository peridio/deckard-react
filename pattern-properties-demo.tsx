import React from 'react';
import { DeckardSchema } from './src';

const patternPropertiesSchema = {
  title: 'Pattern Properties Demo',
  description: 'Demonstrating patternProperties support in deckard-react',
  type: 'object',
  properties: {
    config: {
      type: 'object',
      description: 'Configuration object with dynamic extension keys',
      patternProperties: {
        '^[a-zA-Z0-9_-]+$': {
          $ref: '#/definitions/extensionConfig',
        },
      },
    },
    users: {
      type: 'object',
      description: 'User configurations with dynamic usernames',
      patternProperties: {
        '^[a-zA-Z0-9_]+$': {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'viewer'],
              description: 'User role',
            },
          },
          required: ['name', 'email'],
        },
      },
    },
    regularProperty: {
      type: 'string',
      description: 'This is a regular property for comparison',
    },
  },
  definitions: {
    extensionConfig: {
      type: 'object',
      description: 'Configuration for a plugin or extension',
      properties: {
        version: {
          type: 'string',
          description: 'Extension version',
          pattern: '^\\d+\\.\\d+\\.\\d+$',
          examples: ['1.0.0', '2.1.3'],
        },
        enabled: {
          type: 'boolean',
          default: true,
          description: 'Whether the extension is enabled',
        },
        settings: {
          type: 'object',
          description: 'Extension-specific settings',
          patternProperties: {
            '^[a-zA-Z][a-zA-Z0-9_]*$': {
              oneOf: [
                { type: 'string' },
                { type: 'number' },
                { type: 'boolean' },
              ],
            },
          },
        },
        dependencies: {
          type: 'array',
          description: 'Required dependencies',
          items: {
            type: 'string',
          },
        },
      },
      required: ['version'],
    },
  },
};

export default function PatternPropertiesDemo() {
  return (
    <div
      style={{
        fontFamily: 'system-ui',
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        lineHeight: '1.6',
      }}
    >
      <h1>Pattern Properties Demo</h1>

      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0 }}>✅ What's Working</h2>
        <ul>
          <li>
            <strong>Pattern properties are rendered:</strong> Objects with{' '}
            <code>patternProperties</code> now show expandable pattern entries
          </li>
          <li>
            <strong>Visual indicators:</strong> Pattern properties display as{' '}
            <code>{'{name}'}</code> with distinct styling
          </li>
          <li>
            <strong>Pattern information:</strong> Regex patterns are displayed
            as separate code blocks above descriptions
          </li>
          <li>
            <strong>Nested expansion:</strong> Pattern properties can be
            expanded to show their structure
          </li>
          <li>
            <strong>$ref resolution:</strong> Pattern properties that reference
            definitions work correctly
          </li>
          <li>
            <strong>Nested patterns:</strong> Pattern properties can contain
            other pattern properties
          </li>
          <li>
            <strong>Mixed properties:</strong> Regular properties and pattern
            properties work together
          </li>
        </ul>
      </div>

      <div
        style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0 }}>📋 How to Use</h2>
        <ol>
          <li>
            Expand the <strong>config</strong> property to see pattern
            properties in action
          </li>
          <li>
            Look for the <code>{'{name}'}</code> entries with distinct styling
          </li>
          <li>
            Expand a pattern property to see the regex pattern displayed above
            the description
          </li>
          <li>
            Notice how nested pattern properties (like in{' '}
            <strong>settings</strong>) also work
          </li>
          <li>
            Compare with the <strong>users</strong> property which has inline
            pattern schemas
          </li>
        </ol>
      </div>

      <div
        style={{
          backgroundColor: '#e0f2fe',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0 }}>🔧 Technical Implementation</h2>
        <p>The fix involved:</p>
        <ul>
          <li>
            Modifying <code>extractProperties()</code> to handle{' '}
            <code>patternProperties</code>
          </li>
          <li>Creating synthetic property entries for pattern keys</li>
          <li>
            Displaying regex patterns as separate code blocks above descriptions
          </li>
          <li>
            Updating property initialization to include pattern properties
          </li>
          <li>Enhancing the UI to visually distinguish pattern properties</li>
          <li>
            Ensuring nested property detection includes pattern properties
          </li>
        </ul>
      </div>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
          backgroundColor: 'white',
        }}
      >
        <h3>Interactive Demo</h3>
        <DeckardSchema
          schema={patternPropertiesSchema}
          options={{
            includeHeader: true,
            includePropertiesTitle: true,
            includeDefinitions: true,
            includeExamples: true,
            searchable: true,
            collapsible: true,
            autoExpand: false,
          }}
        />
      </div>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#6b7280',
        }}
      >
        <p>
          <strong>Expected Rendering Example:</strong>
        </p>
        <pre
          style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            overflow: 'auto',
          }}
        >
          {`config (object) ▼
  └─ {name} ▼
     │ ^[a-zA-Z0-9_-]+$
     ├─ version (string) *required
     ├─ enabled (boolean)
     ├─ settings (object) ▼
     │  └─ {setting} ▼
     │     │ ^[a-zA-Z][a-zA-Z0-9_]*$
     └─ dependencies (array)

users (object) ▼
  └─ {username} ▼
     │ ^[a-zA-Z0-9_]+$
     ├─ name (string) *required
     ├─ email (string) format:email
     └─ role (string)`}
        </pre>
      </div>
    </div>
  );
}
