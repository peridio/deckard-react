# Deckard React

Interactive React component for JSON Schema documentation. Used by the [Deckard CLI](https://github.com/peridio/deckard-cli) for consistent schema documentation across CLI and web applications.

## Features

- 🎯 **Zero configuration** - Works out of the box with sensible defaults
- 🎨 **Modern design** - Clean, compact interface that scales from simple to complex schemas
- ⚡ **Interactive** - Collapsible sections, search, keyboard shortcuts
- 🔍 **Search** - Real-time property search with auto-expansion
- 📱 **Responsive** - Mobile-friendly design
- ♿ **Accessible** - Full keyboard navigation and screen reader support
- 🎭 **Themeable** - Light/dark mode with CSS custom properties
- 📋 **Copy-friendly** - Click any code snippet to copy to clipboard
- 🏗️ **TypeScript** - Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @peridio/deckard-react
```

## Usage

Import both the component and CSS styles:

```tsx
import { DeckardSchema } from '@peridio/deckard-react';
import '@peridio/deckard-react/dist/style.css';

function MyApp() {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  };

  return <DeckardSchema schema={schema} />;
}
```

**Important**: You must import the CSS file for proper styling.

Or for development, clone and build:

```bash
git clone https://github.com/peridio/deckard-react.git
cd deckard-react
npm install
npm run build
```

## Quick Start

```tsx
import React from 'react';
import { DeckardSchema } from '@peridio/deckard-react';

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'User name',
      minLength: 2,
      maxLength: 50
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address'
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 120,
      examples: [25, 30, 45]
    }
  },
  required: ['name', 'email']
};

function App() {
  return (
    <div>
      <DeckardSchema schema={schema} />
    </div>
  );
}
```

## API Reference

### DeckardSchema Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `schema` | `JsonSchema` | Required | The JSON schema to render |
| `options` | `DeckardOptions` | `{}` | Configuration options |
| `className` | `string` | `''` | Additional CSS class names |

### DeckardOptions

```typescript
interface DeckardOptions {
  includeHeader?: boolean;        // Show schema title/description (true)
  includePropertiesTitle?: boolean; // Show "Properties" heading (true)
  includeDefinitions?: boolean;   // Show definitions section (false)
  includeExamples?: boolean;      // Show examples in 2-column layout (false)
  searchable?: boolean;          // Enable search functionality (true)
  collapsible?: boolean;         // Enable expand/collapse (true)
  autoExpand?: boolean;          // Auto-expand all properties (false)
  theme?: 'light' | 'dark' | 'auto'; // Color theme (auto)
}
```

### JsonSchema Type

Full JSON Schema Draft 7 support including:

```typescript
interface JsonSchema {
  type?: 'null' | 'boolean' | 'object' | 'array' | 'number' | 'integer' | 'string';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema | JsonSchema[];
  required?: string[];
  enum?: any[];
  const?: any;
  default?: any;
  examples?: any[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  // ... and many more
}
```

## Advanced Usage

### Custom Styling

The component uses CSS custom properties for theming:

```css
.schema-container {
  --schema-accent-primary: #3b82f6;
  --schema-surface: rgba(0, 0, 0, 0.02);
  --schema-border: rgba(0, 0, 0, 0.08);
  /* ... many more variables available */
}
```

### Complex Schema Example

```tsx
import { DeckardSchema } from '@peridio/deckard-react';

const complexSchema = {
  title: "User Profile API",
  description: "Schema for user profile management",
  type: "object",
  properties: {
    user: {
      type: "object",
      description: "User information",
      properties: {
        profile: {
          type: "object",
          properties: {
            firstName: { type: "string", minLength: 1 },
            lastName: { type: "string", minLength: 1 },
            avatar: { 
              type: "string", 
              format: "uri",
              examples: ["https://example.com/avatar.jpg"]
            }
          },
          required: ["firstName", "lastName"]
        },
        preferences: {
          type: "object",
          properties: {
            theme: {
              type: "string",
              enum: ["light", "dark", "auto"],
              default: "auto"
            },
            notifications: {
              type: "boolean",
              default: true,
              description: "Enable email notifications"
            }
          }
        }
      },
      required: ["profile"]
    }
  },
  required: ["user"]
};

function AdvancedExample() {
  return (
    <DeckardSchema
      schema={complexSchema}
      options={{
        includeExamples: true,
        includeDefinitions: true,
        autoExpand: false
      }}
    />
  );
}
```

## Keyboard Shortcuts

- `/` - Focus search
- `h` - Navigate left (collapse section or move to parent)
- `j` - Navigate down (next property)
- `k` - Navigate up (previous property)
- `l` - Navigate right (expand section or move to first child)
- `Ctrl/Cmd + E` - Expand all properties
- `Ctrl/Cmd + Shift + E` - Collapse all properties
- `Escape` - Clear search
- `Enter/Space` - Toggle property expansion
- Click any `code` element to copy to clipboard

### Navigation

The component supports vim-style hjkl navigation similar to Linear and Chrome DevTools:
- Selected properties are highlighted with a blue border and background
- Navigation prevents page scrolling
- Works seamlessly with collapsible sections and search filtering

## Accessibility

- Full keyboard navigation support
- Screen reader friendly with proper ARIA attributes
- High contrast mode support
- Respects `prefers-reduced-motion`
- Focus indicators for all interactive elements

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- iOS Safari 14+
- Android Chrome 88+

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Migration from Rust CLI

If you're migrating from the Rust CLI version:

```tsx
// Old: Generate HTML with CLI and include separately
// deckard convert schema.json --with-examples > output.html

// New: Use React component directly
import { DeckardSchema } from '@peridio/deckard-react';
import schema from './schema.json';

function MyComponent() {
  return (
    <DeckardSchema 
      schema={schema} 
      options={{ includeExamples: true }} 
    />
  );
}
```

## Related Projects

- [Deckard CLI](https://github.com/peridio/deckard-cli) - Command-line tool that uses this component for interactive HTML generation

## License

Apache-2.0

## Contributing

Issues and PRs welcome!