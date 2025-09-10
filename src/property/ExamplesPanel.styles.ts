export const examplesPanelStyles = `
/* Examples Panel Component Styles */
/* All styles are scoped to .schema-container to prevent global conflicts */

/* ===== EXAMPLES PANEL BASE ===== */

.schema-container .examples-panel {
  background: transparent;
  padding: 0;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* ===== HEADER ===== */

.schema-container .examples-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--schema-space-md);
  flex-wrap: wrap;
  gap: var(--schema-space-sm);
}

.schema-container .examples-title {
  font-size: var(--schema-text-base);
  font-weight: 600;
  color: var(--schema-text);
  margin: 0;
}

.schema-container .examples-source {
  font-size: var(--schema-text-xs);
  font-weight: 400;
  color: var(--schema-text-secondary);
  font-style: italic;
}

.schema-container .no-examples-message {
  padding: var(--schema-space-lg);
  text-align: center;
  color: var(--schema-text-muted);
  font-size: var(--schema-text-base);
  font-style: italic;
  background: var(--schema-code-bg);
  border-radius: var(--schema-radius-sm);
}

/* ===== CONTROLS ===== */

.schema-container .examples-controls {
  display: flex;
  align-items: center;
  gap: var(--schema-space-sm);
}

.schema-container .format-selector {
  display: flex;
  gap: var(--schema-space-xs);
}

.schema-container .format-button,
.schema-container .wrap-toggle-button {
  padding: var(--schema-space-xs) var(--schema-space-sm);
  font-size: var(--schema-text-xs);
  font-weight: 500;
  border: 1px solid var(--schema-border);
  border-radius: var(--schema-radius-sm);
  background: var(--schema-bg);
  color: var(--schema-text-secondary);
  cursor: pointer;
  transition: all var(--schema-transition);
}

.schema-container .format-button:hover,
.schema-container .wrap-toggle-button:hover {
  background: var(--schema-surface-hover);
  color: var(--schema-text);
}

.schema-container .format-button.active {
  background: var(--schema-accent);
  color: var(--schema-text-inverse);
  border-color: var(--schema-accent);
}

.schema-container .wrap-toggle-button {
  min-width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schema-container .wrap-toggle-button.active {
  background: var(--schema-surface-hover);
  color: var(--schema-text);
  border-color: var(--schema-border);
}

/* ===== CONTENT ===== */

.schema-container .examples-content {
  display: flex;
  flex-direction: column;
  gap: var(--schema-space-md);
}

.schema-container .example-item {
  display: flex;
  flex-direction: column;
  gap: var(--schema-space-sm);
}

.schema-container .example-label {
  font-size: var(--schema-text-xs);
  font-weight: 500;
  color: var(--schema-text-secondary);
}

/* ===== CODE DISPLAY ===== */

.schema-container .code-container {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border-radius: var(--schema-radius-sm);
}

.schema-container .highlighted-code {
  border-radius: var(--schema-radius-sm);
  overflow: hidden;
  font-family: var(--schema-font-mono);
  font-size: var(--schema-text-xs);
  line-height: 1.4;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  background: var(--schema-code-bg);
}

.schema-container .highlighted-code pre {
  margin: 0;
  padding: var(--schema-space-md);
  background: var(--schema-code-bg);
  white-space: pre-wrap;
  word-break: break-all;
  max-width: 100%;
  overflow-x: auto;
  border-radius: var(--schema-radius-sm);
}

.schema-container .highlighted-code.nowrap pre {
  white-space: pre;
  word-break: normal;
  overflow-x: auto;
}

.schema-container .highlighted-code.wrap pre {
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: visible;
}

.schema-container .code-fallback {
  margin: 0;
  padding: var(--schema-space-md);
  background: var(--schema-code-bg);
  border-radius: var(--schema-radius-sm);
  font-family: var(--schema-font-mono);
  font-size: var(--schema-text-xs);
  line-height: 1.4;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

.schema-container .code-fallback.nowrap {
  white-space: pre;
  word-break: normal;
  overflow-x: auto;
}

.schema-container .code-fallback.wrap {
  white-space: pre-wrap;
  word-break: break-all;
}

.schema-container .code-fallback code {
  background: none;
  padding: 0;
  font-family: inherit;
}

/* ===== SYNTAX HIGHLIGHTING RESET ===== */

.schema-container .examples-panel .highlighted-code code,
.schema-container .schema-details-right .highlighted-code code,
.schema-container .highlighted-code code {
  background: none;
  padding: 0;
  border: none;
  border-radius: 0;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  cursor: default;
}

.schema-container .highlighted-code .shiki {
  background: transparent;
  padding: 0;
  margin: 0;
  border-radius: 0;
  overflow: visible;
  width: 100%;
  max-width: 100%;
}

.schema-container .highlighted-code .shiki code {
  background: transparent;
  padding: 0;
  font-family: var(--schema-font-mono);
  font-size: var(--schema-text-xs);
  line-height: 1.4;
  white-space: inherit;
  word-break: inherit;
}

.schema-container .highlighted-code span,
.schema-container .highlighted-code .token {
  font-family: var(--schema-font-mono);
  font-size: inherit;
  line-height: inherit;
}

.schema-container .highlighted-code pre.shiki {
  background: var(--schema-code-bg);
  padding: var(--schema-space-md);
  margin: 0;
  border-radius: var(--schema-radius-sm);
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.schema-container .highlighted-code.nowrap pre.shiki {
  white-space: pre;
  word-break: normal;
  overflow-x: auto;
}

.schema-container .highlighted-code.wrap pre.shiki {
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: visible;
}

/* ===== RESPONSIVE DESIGN ===== */

@media (max-width: 768px) {
  .schema-container .schema-details-split {
    flex-direction: column;
  }

  .schema-container .schema-details-left,
  .schema-container .schema-details-right {
    max-width: 100%;
  }

  .schema-container .schema-details-right {
    margin-top: var(--schema-space-md);
  }

  .schema-container .schema-content-split {
    flex-direction: column;
  }

  .schema-container .schema-content-left,
  .schema-container .schema-content-right {
    max-width: 100%;
  }

  .schema-container .schema-content-right {
    margin-top: var(--schema-space-md);
  }

  .schema-container .examples-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--schema-space-md);
  }
}

@media (max-width: 640px) {
  .schema-container .examples-panel {
    padding: var(--schema-space-sm);
  }

  .schema-container .examples-title {
    font-size: 0.8125rem;
  }

  .schema-container .format-button {
    padding: 0.375rem var(--schema-space-md);
    font-size: 0.8125rem;
    min-width: 3rem;
  }

  .schema-container .code-container {
    overflow-x: auto;
  }

  .schema-container .code-fallback {
    padding: var(--schema-space-sm);
    font-size: var(--schema-text-xs);
    line-height: 1.3;
  }
}

@media (max-width: 480px) {
  .schema-container .schema-details {
    padding: var(--schema-space-sm);
  }

  .schema-container .schema-details-split {
    gap: var(--schema-space-sm);
  }

  .schema-container .examples-panel {
    padding: 0.375rem;
  }

  .schema-container .format-selector {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .schema-container .format-button {
    flex: 1;
    min-width: 0;
    text-align: center;
  }
}
`;
