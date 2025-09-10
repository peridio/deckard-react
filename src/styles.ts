export const schemaStyles = `
/* Deckard Schema Documentation - Compact Data Structure Design */
/* All styles are scoped to .schema-container to prevent global conflicts */

.schema-container {
  /* Local CSS variables - subtle, documentation-style colors */
  --schema-bg: transparent;
  --schema-surface: transparent;
  --schema-surface-hover: rgba(59, 130, 246, 0.1);
  --schema-border: rgba(0, 0, 0, 0.08);
  --schema-border-subtle: rgba(0, 0, 0, 0.04);

  --schema-text-primary: inherit;
  --schema-text-secondary: #64748b;
  --schema-text-muted: #94a3b8;
  --schema-text-inverse: #ffffff;

  --schema-accent-primary: #3b82f6;
  --schema-accent-primary-soft: rgba(59, 130, 246, 0.1);
  --schema-accent-success: #10b981;
  --schema-accent-warning: #f59e0b;
  --schema-accent-danger: #ef4444;
  --schema-accent-info: #06b6d4;

  --schema-code-bg: rgba(0, 0, 0, 0.06);
  --schema-code-text: inherit;

  --schema-radius-sm: 0.25rem;
  --schema-radius-md: 0.375rem;

  --schema-font-mono: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;

  --schema-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Base styles */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: var(--schema-text-primary);
  background: var(--schema-bg);
  max-width: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .schema-container {
    --schema-surface: transparent;
    --schema-surface-hover: rgba(59, 130, 246, 0.15);
    --schema-border: rgba(255, 255, 255, 0.1);
    --schema-border-subtle: rgba(255, 255, 255, 0.05);
    --schema-text-secondary: #94a3b8;
    --schema-text-muted: #64748b;
    --schema-code-bg: rgba(255, 255, 255, 0.06);
    --schema-accent-primary-soft: rgba(59, 130, 246, 0.15);
  }
}

.schema-container * {
  box-sizing: border-box;
}

/* Header section - minimal */
.schema-container .schema-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--schema-border);
}

.schema-container .schema-description {
  font-size: 0.9375rem;
  color: var(--schema-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Section titles - subtle */
.schema-container h2 {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--schema-text-muted);
  margin: 1.5rem 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.schema-container h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--schema-text-primary);
  margin: 1rem 0 0.5rem;
}

/* Properties section */
.schema-container .properties-section {
  margin-top: 1rem;
}

.schema-container .properties-list {
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-md);
  overflow: hidden;
  background: transparent;
}

/* Property - compact single line by default */
.schema-container .property {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--schema-border);
  border-radius: 0;
  padding: 0;
  transition: background-color var(--schema-transition-fast);
  position: relative;
  min-height: 2.5rem;
  display: flex;
  flex-direction: column;
}

.schema-container .property:last-child {
  border-bottom: none;
}

.schema-container .property:hover {
  background: var(--schema-surface-hover);
}

.schema-container .property.expanded {
  background: transparent;
}

/* Property header container */
.schema-container .property-header-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 2.5rem;
  position: relative;
  transition: background-color var(--schema-transition-fast);
  border-radius: var(--schema-radius-sm);
}

.schema-container .property-header-container:hover {
  background: var(--schema-surface-hover);
}

/* Property controls */
.schema-container .property-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  flex-shrink: 0;
  order: 2;
}

.schema-container .link-button,
.schema-container .expand-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--schema-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--schema-text-muted);
  transition: all var(--schema-transition-fast);
}

.schema-container .link-button:hover {
  background: var(--schema-surface-hover);
  color: var(--schema-text-primary);
}

.schema-container .expand-button:hover {
  background: var(--schema-surface-hover);
  color: var(--schema-text-primary);
}

.schema-container .link-button svg,
.schema-container .expand-button svg {
  width: 0.875rem;
  height: 0.875rem;
}

.schema-container .property-content {
  flex: 1;
  min-width: 0;
  padding: 0.625rem 0.75rem 0.625rem 0.75rem;
  order: 1;
}

.schema-container .property-inline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.schema-container .property-inline > .property-name {
  margin: 0;
  padding: 0;
}

.schema-container .property-inline > .type-badge {
  margin: 0;
  padding: 0.125rem 0.375rem;
}

.schema-container .property-inline > .required-badge {
  margin-left: 0;
}

.schema-container .property-inline > .property-description-inline {
  margin-left: 0;
}

/* Remove old expand indicator styles */

/* Property name - compact monospace */
.schema-container .property-name {
  font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--schema-text-primary);
  flex-shrink: 0;
}

/* Pattern property styling */
.schema-container .property-name.pattern-property {
  color: var(--schema-accent-primary);
}

.schema-container .pattern-placeholder {
  font-style: italic;
  color: var(--schema-accent-primary);
  background: rgba(59, 130, 246, 0.08);
  padding: 0.125rem 0.375rem;
  border-radius: var(--schema-radius-sm);
  border: 1px solid rgba(59, 130, 246, 0.2);
  font-weight: 500;
}

.schema-container .pattern-info {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.schema-container .pattern-code {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: var(--schema-accent-primary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--schema-radius-sm);
  font-size: 0.75rem;
  font-family: var(--schema-font-mono);
  font-weight: 500;
}

/* Type badge - flush against property name */
.schema-container .type-badge {
  background: transparent;
  color: var(--schema-text-muted);
  border: 1px solid var(--schema-border);
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: var(--schema-radius-sm);
  text-transform: lowercase;
  letter-spacing: 0;
  white-space: nowrap;
  flex-shrink: 0;
  margin: 0;
}

/* Required badge - with left margin */
.schema-container .required-badge {
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: var(--schema-radius-sm);
  text-transform: lowercase;
  letter-spacing: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.schema-container .required-badge {
  background: var(--schema-accent-danger);
  color: var(--schema-text-inverse);
  border: none;
  text-transform: uppercase;
  font-size: 0.625rem;
  font-weight: 600;
}

/* Property description - inline when collapsed */
.schema-container .property-description-inline {
  color: var(--schema-text-muted);
  font-size: 0.8125rem;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

/* Property description - block when expanded */
.schema-container .property-description-block {
  color: var(--schema-text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.schema-container .schema-details .property-description-block:only-child {
  margin-bottom: 0;
}

/* Schema details - hidden by default */
.schema-container .property:not(.expanded) > .schema-details {
  display: none;
}

/* Schema details - shown when expanded */
.schema-container .property.expanded > .schema-details {
  display: block;
  padding: 0.75rem;
  border-top: 1px solid var(--schema-border-subtle);
  animation: schema-expand 200ms ease-out;
}

.schema-container .schema-details > .property-description-block + * {
  margin-top: 0;
}

@keyframes schema-expand {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Schema details content - compact */
.schema-container .schema-details {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Constraints - inline chips */
.schema-container .constraints {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.schema-container .constraint {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  background: var(--schema-code-bg);
  border: none;
  border-radius: var(--schema-radius-sm);
  font-size: 0.6875rem;
  font-family: "SF Mono", Monaco, monospace;
  color: var(--schema-text-secondary);
}

/* Enum values - compact */
.schema-container .enum-values {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.schema-container .enum-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--schema-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0;
}

.schema-container .enum-value {
  padding: 0.125rem 0.375rem;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border-radius: var(--schema-radius-sm);
  font-size: 0.75rem;
  font-family: "SF Mono", Monaco, monospace;
  font-weight: 400;
}

/* Default value and examples - compact inline */
.schema-container .default-value,
.schema-container .examples {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.schema-container .default-value::before {
  content: "default:";
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--schema-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.schema-container .examples-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--schema-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Code styling - subtle */
.schema-container code {
  padding: 0.0625rem 0.25rem;
  background: var(--schema-code-bg);
  color: var(--schema-text-primary);
  border-radius: var(--schema-radius-sm);
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
  font-size: 0.75rem;
  font-weight: 400;
  cursor: pointer;
  transition: all var(--schema-transition-fast);
}

.schema-container code:hover {
  background: var(--schema-accent-primary);
  color: var(--schema-text-inverse);
}

/* Nested properties - subtle indentation */
.schema-container .nested-properties {
  margin: 0.75rem 0 0 0;
  padding: 0;
  border-left: 2px solid var(--schema-border);
  margin-left: 1rem;
}

.schema-container .nested-property {
  border-top: 1px solid var(--schema-border);
  border-bottom: 1px solid var(--schema-border-subtle);
  background: var(--schema-surface);
  min-height: auto;
  margin-bottom: 0.5rem;
  border-radius: 0;
}

.schema-container .nested-property:last-child {
  border-bottom: none;
}

.schema-container .nested-indicator {
  color: var(--schema-text-muted);
  font-size: 0.75rem;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schema-container .nested-property .property-content {
  padding: 0.375rem 0.75rem 0.375rem 0;
}

.schema-container .nested-property .schema-details {
  padding: 0.5rem 0.75rem 0.5rem 0;
  margin-left: 2.25rem;
  border-top: 1px solid var(--schema-border-subtle);
}

/* Depth indicators */
.schema-container .property.depth-1 .property-header {
  padding-left: 3rem;
}

.schema-container .property.depth-2 .property-header {
  padding-left: 4rem;
}

.schema-container .property.depth-3 .property-header {
  padding-left: 5rem;
}

/* Array items - compact */
.schema-container .array-section,
.schema-container .array-items {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-sm);
}

.schema-container .array-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--schema-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.375rem;
  display: block;
}

/* Compound schemas - compact */
.schema-container .compound-schema {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-sm);
}

.schema-container .compound-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.schema-container .compound-option {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid var(--schema-border-subtle);
  border-radius: var(--schema-radius-sm);
}

.schema-container .compound-option h4 {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--schema-text-primary);
  margin: 0 0 0.375rem;
}

/* Definitions - compact */
.schema-container .definitions-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--schema-border);
}

.schema-container .definition {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-sm);
}

.schema-container .definition h3 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  padding: 0;
  background: transparent;
  color: var(--schema-text-primary);
  display: inline;
}

/* Remove no-details styles since all properties are expandable */

/* Interactive states */
.schema-container .property:focus-within {
  outline: 2px solid var(--schema-accent-primary);
  outline-offset: -2px;
}

.schema-container *:focus-visible {
  outline: 2px solid var(--schema-accent-primary);
  outline-offset: 2px;
  border-radius: var(--schema-radius-sm);
}

/* Search functionality */
.schema-container .schema-search {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-md);
}

.schema-container .search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-sm);
  font-size: 0.875rem;
  background: transparent;
  color: var(--schema-text-primary);
}

.schema-container .search-input::placeholder {
  color: var(--schema-text-muted);
}

.schema-container .search-input:focus {
  outline: 2px solid var(--schema-accent-primary);
  outline-offset: -2px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .schema-container {
    font-size: 13px;
  }

  .schema-container .property-name {
    flex-shrink: 0;
  }

  .schema-container .property:not(.expanded) > .property-description {
    font-size: 0.75rem;
  }
}

/* Print styles */
@media print {
  .schema-container {
    font-size: 11px;
  }

  .schema-container .property {
    break-inside: avoid;
  }

  .schema-container .property > .schema-details {
    display: block !important;
  }

  .schema-container .property-header::before {
    display: none;
  }

  .schema-container .schema-search {
    display: none;
  }
}

/* Accessibility - high contrast mode */
@media (prefers-contrast: high) {
  .schema-container .property,
  .schema-container .properties-list {
    border-width: 2px;
  }

  .schema-container .required-badge {
    font-weight: 700;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .schema-container *,
  .schema-container *::before,
  .schema-container *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Syntax highlighted code styling */
.schema-container .highlighted-code {
  margin: 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 3px;
  white-space: pre-wrap;
  color: #333;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  overflow-x: auto;
}

.schema-container .highlighted-code code {
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

/* 2-column layout for properties with examples */
.schema-container .property.has-examples.expanded {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.schema-container .property-content-wrapper {
  grid-column: 1;
  min-width: 0;
}

.schema-container .property.has-examples.expanded .property-examples {
  grid-column: 2;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-sm);
}
`;
