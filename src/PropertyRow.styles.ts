export const propertyRowStyles = `
/* Property Row Component Styles */
/* All styles are scoped to .schema-container to prevent global conflicts */

/* ===== UTILITY CLASSES ===== */

.schema-container .badge {
  padding: 0.125rem 0.375rem;
  font-size: var(--schema-text-xs);
  font-weight: 500;
  border-radius: var(--schema-radius-sm);
  text-transform: lowercase;
  letter-spacing: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.schema-container .code-snippet {
  padding: 0.125rem var(--schema-space-xs);
  background: var(--schema-code-bg);
  border-radius: var(--schema-radius-sm);
  font-family: var(--schema-font-mono);
  font-size: var(--schema-text-xs);
  border: 1px solid var(--schema-border-strong);
}

/* ===== PROPERTY ROW BASE ===== */

.schema-container .property:hover {
  background: var(--schema-surface-hover);
}

.schema-container .property.expanded {
  background: transparent;
}

.schema-container .property[data-focused="true"] {
  background: var(--schema-surface-hover);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.schema-container .property .row-header-container:hover {
  background: var(--schema-surface-hover);
}

/* ===== PROPERTY ELEMENTS ===== */

.schema-container .property-name {
  font-family: var(--schema-font-mono);
  font-size: var(--schema-text-base);
  font-weight: 500;
  color: var(--schema-text);
  flex-shrink: 0;
}

.schema-container .property-name.pattern-property {
  color: var(--schema-accent);
}

/* ===== BADGES ===== */

.schema-container .type-badge {
  background: transparent;
  color: var(--schema-text-muted);
  border: 1px solid var(--schema-border-strong);
}

.schema-container .required-badge {
  background: var(--schema-danger);
  color: var(--schema-text-inverse);
  border: none;
  text-transform: uppercase;
  font-size: var(--schema-text-xs);
  font-weight: 600;
}

/* ===== PATTERN PROPERTIES ===== */

.schema-container .pattern-info {
  display: flex;
  align-items: center;
  gap: var(--schema-space-sm);
  margin-bottom: var(--schema-space-sm);
}

.schema-container .pattern-label {
  color: var(--schema-text-muted);
  font-size: var(--schema-text-xs);
  font-weight: 500;
}

.schema-container .pattern-placeholder {
  font-style: italic;
  color: var(--schema-text-inverse);
  background: #6366f1;
  padding: 0.125rem 0.375rem;
  border-radius: var(--schema-radius-sm);
  border: 1px solid #4f46e5;
  font-weight: 500;
}

.schema-container .pattern-code {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: var(--schema-accent);
  padding: var(--schema-space-xs) var(--schema-space-sm);
  border-radius: var(--schema-radius-sm);
  font-family: var(--schema-font-mono);
  font-size: var(--schema-text-base);
}

.schema-container .pattern-code-inline {
  background: var(--schema-surface-hover);
  color: var(--schema-text-secondary);
  cursor: default;
}

/* ===== DESCRIPTIONS ===== */

.schema-container .property-description-inline {
  color: var(--schema-text-muted);
  font-size: 0.8125rem;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.schema-container .property-description-block {
  color: var(--schema-text-secondary);
  font-size: var(--schema-text-base);
  line-height: 1.5;
  margin-bottom: var(--schema-space-md);
}

.schema-container .schema-details .property-description-block:only-child {
  margin-bottom: 0;
}

/* ===== SCHEMA DETAILS ===== */

.schema-container .property:not(.expanded) > .schema-details {
  display: none;
}

.schema-container .properties-list > .property.expanded > .schema-details,
.schema-container .nested-properties .property.expanded > .schema-details {
  display: flex;
  flex-direction: column;
  padding: var(--schema-space-md) 0 var(--schema-space-md) var(--schema-space-md);
  animation: schema-expand 200ms ease-out;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  border-top: 1px solid var(--schema-border);
}

.schema-container .properties-list > .property.expanded > .schema-details.schema-details-split {
  padding: var(--schema-space-md);
}

.schema-container .schema-details {
  display: flex;
  flex-direction: column;
  gap: var(--schema-space-sm);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border-top: 1px solid var(--schema-border-subtle);
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

/* ===== SPLIT LAYOUT ===== */

.schema-container .schema-details-split {
  display: flex;
  flex-direction: row;
  gap: var(--schema-space-lg);
  align-items: flex-start;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.schema-container .schema-details-left {
  flex: 1;
  min-width: 0;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  gap: var(--schema-space-sm);
  overflow-wrap: break-word;
  overflow: hidden;
}

.schema-container .schema-details-right {
  flex: 1;
  min-width: 0;
  max-width: 50%;
  overflow: hidden;
}

/* ===== CONSTRAINTS AND VALUES ===== */

.schema-container .constraints {
  display: flex;
  flex-wrap: wrap;
  gap: var(--schema-space-xs);
}

.schema-container .constraint {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  background: var(--schema-code-bg);
  border: none;
  border-radius: var(--schema-radius-sm);
  font-size: var(--schema-text-xs);
  font-family: var(--schema-font-mono);
  color: var(--schema-text-secondary);
}

.schema-container .enum-values {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.schema-container .enum-values .enum-label {
  font-size: var(--schema-text-xs);
  font-weight: 600;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0;
}

.schema-container .enum-value {
  padding: 0.125rem 0.375rem;
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  border-radius: var(--schema-radius-sm);
  font-size: var(--schema-text-xs);
  font-family: var(--schema-font-mono);
  font-weight: 500;
}

.schema-container .default-value,
.schema-container .examples {
  font-size: var(--schema-text-xs);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.schema-container .default-value::before {
  content: "default:";
  font-size: var(--schema-text-xs);
  font-weight: 600;
  color: var(--schema-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.schema-container .examples-label {
  font-size: var(--schema-text-xs);
  font-weight: 600;
  color: var(--schema-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* ===== CODE BLOCKS ===== */

.schema-container .code-block-container {
  position: relative;
  border-radius: var(--schema-radius-sm);
  background: var(--schema-code-bg);
}

.schema-container .code-block-container:hover .code-controls {
  opacity: 1;
}

.schema-container .code-controls {
  position: absolute;
  top: var(--schema-space-sm);
  right: var(--schema-space-sm);
  display: flex;
  gap: var(--schema-space-xs);
  opacity: 0;
  transition: opacity var(--schema-transition);
  z-index: 1;
}

.schema-container .code-control-button {
  background: var(--schema-surface);
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-sm);
  padding: var(--schema-space-xs);
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--schema-text-xs);
  color: var(--schema-text-secondary);
  transition: all var(--schema-transition);
}

.schema-container .code-control-button:hover {
  background: var(--schema-surface-hover);
  color: var(--schema-text);
  border-color: var(--schema-accent);
}

.schema-container .code-control-button:active {
  transform: scale(0.95);
}

.schema-container .code-control-button.wrap-enabled {
  background: var(--schema-accent-soft);
  color: var(--schema-accent);
  border-color: var(--schema-accent);
}

.schema-container .code-block-container pre {
  margin: 0;
  padding: var(--schema-space-md);
  padding-right: 3.5rem;
  overflow-x: auto;
  border-radius: var(--schema-radius-sm);
}

.schema-container .code-block-container.wrap-enabled pre {
  white-space: pre-wrap;
  word-break: break-all;
}

/* ===== NESTED PROPERTIES ===== */

.schema-container .nested-properties {
  margin: var(--schema-space-md) 0 0 0;
  padding: 0 0 0 var(--schema-space-lg);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.schema-container .nested-indicator {
  color: var(--schema-text-muted);
  font-size: var(--schema-text-xs);
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schema-container .nested-properties .nested-row .schema-details {
  padding: var(--schema-space-sm) 0 var(--schema-space-sm) var(--schema-space-md);
  margin-left: 0;
}

/* ===== FOCUS STYLES ===== */

.schema-container .property:has(.row-header-container:focus-visible) {
  background: var(--schema-surface-hover);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
  outline: none;
}

.schema-container .property:first-child:has(.row-header-container:focus-visible) {
  box-shadow: inset 0 2px 0 0 rgba(59, 130, 246, 0.3),
              inset 1px 0 0 0 rgba(59, 130, 246, 0.3),
              inset -1px 0 0 0 rgba(59, 130, 246, 0.3),
              inset 0 -1px 0 0 rgba(59, 130, 246, 0.3);
}

.schema-container .property:last-child:has(.row-header-container:focus-visible) {
  box-shadow: inset 0 1px 0 0 rgba(59, 130, 246, 0.3),
              inset 1px 0 0 0 rgba(59, 130, 246, 0.3),
              inset -1px 0 0 0 rgba(59, 130, 246, 0.3),
              inset 0 -2px 0 0 rgba(59, 130, 246, 0.3);
}

.schema-container .property:focus,
.schema-container .property:focus-visible,
.schema-container .property .row-header-container:focus,
.schema-container .property .row-header-container:focus-visible {
  outline: none;
}

/* ===== BACKWARD COMPATIBILITY ===== */

.schema-container .property .row-inline > .property-name,
.schema-container .property .row-inline > .type-badge,
.schema-container .property .row-inline > .required-badge,
.schema-container .property .row-inline > .property-description-inline {
  margin: 0;
  padding: inherit;
}

.schema-container .property .row-inline > .type-badge {
  padding: 0.125rem 0.375rem;
}
`;
