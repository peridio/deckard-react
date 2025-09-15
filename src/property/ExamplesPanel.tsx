import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSystemTheme } from '../hooks/useSystemTheme';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import { HiArrowsRightLeft, HiArrowUturnRight } from 'react-icons/hi2';
import { FaCopy } from 'react-icons/fa';
import * as yaml from 'js-yaml';
import { stringify as tomlStringify } from 'smol-toml';
import './ExamplesPanel.styles.css';
import { RadioGroup } from '../inputs';
import { Button } from '../inputs';
import { JsonSchema, JsonValue } from '../types';

// Import only the specific languages and themes we need
import jsonLang from '@shikijs/langs/json';
import yamlLang from '@shikijs/langs/yaml';
import tomlLang from '@shikijs/langs/toml';
import everforestLight from '@shikijs/themes/everforest-light';
import everforestDark from '@shikijs/themes/everforest-dark';

interface ExamplesPanelProps {
  currentProperty: JsonSchema;
  rootSchema: JsonSchema;
  propertyPath: string[];
  onCopy?: (text: string, element: HTMLElement) => void;
  options?: { defaultExampleLanguage?: 'json' | 'yaml' | 'toml' };
}

type Format = 'json' | 'yaml' | 'toml';

const ExamplesPanel: React.FC<ExamplesPanelProps> = ({
  currentProperty,
  rootSchema,
  propertyPath,
  onCopy,
  options,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<Format>(() => {
    const defaultLanguage = options?.defaultExampleLanguage || 'yaml';
    if (typeof window === 'undefined') {
      return defaultLanguage;
    }
    try {
      return (
        (localStorage.getItem('deckard-examples-format') as Format) ||
        defaultLanguage
      );
    } catch {
      return defaultLanguage;
    }
  });

  // Reset to default when options change
  useEffect(() => {
    const defaultLanguage = options?.defaultExampleLanguage || 'yaml';
    setSelectedFormat(defaultLanguage);
  }, [options?.defaultExampleLanguage]);
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null);
  const [highlighterError, setHighlighterError] = useState<boolean>(false);
  const [lineWrap, setLineWrap] = useState<boolean>(false);
  const systemTheme = useSystemTheme();

  // Find examples from current property or nearest parent
  const { examples, propertyName } = useMemo(() => {
    const findExamplesInHierarchy = (
      schema: JsonSchema,
      path: string[]
    ): { examples: JsonValue[]; propertyName: string } => {
      // Check current property for examples
      if (schema.examples && schema.examples.length > 0) {
        return {
          examples: schema.examples,
          propertyName: path[path.length - 1] || 'property',
        };
      }

      // Traverse up the property tree
      if (path.length > 0 && rootSchema) {
        const parentPath = path.slice(0, -1);
        let parentSchema = rootSchema;

        // Navigate to parent schema
        for (const segment of parentPath) {
          if (parentSchema.properties && parentSchema.properties[segment]) {
            parentSchema = parentSchema.properties[segment];
          } else if (parentSchema.patternProperties) {
            // Handle pattern properties
            const patternKeys = Object.keys(parentSchema.patternProperties);
            if (patternKeys.length > 0) {
              parentSchema = parentSchema.patternProperties[patternKeys[0]];
            }
          } else {
            break;
          }
        }

        // Recursively check parent
        if (parentPath.length >= 0) {
          return findExamplesInHierarchy(parentSchema, parentPath);
        }
      }

      return {
        examples: [],
        propertyName: path[path.length - 1] || 'property',
      };
    };

    return findExamplesInHierarchy(currentProperty, propertyPath);
  }, [currentProperty, rootSchema, propertyPath]);

  useEffect(() => {
    createHighlighterCore({
      themes: [everforestLight, everforestDark],
      langs: [jsonLang, yamlLang, tomlLang],
      engine: createOnigurumaEngine(import('shiki/wasm')),
    })
      .then(setHighlighter)
      .catch(error => {
        console.warn('Failed to initialize Shiki highlighter:', error);
        setHighlighterError(true);
      });
  }, []);

  const convertToToml = useCallback(
    (obj: unknown, fieldName?: string): string => {
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        const key = fieldName || propertyName || 'value';
        const wrappedValue = { [key]: obj };
        return tomlStringify(wrappedValue);
      }

      return tomlStringify(obj);
    },
    [propertyName]
  );

  const convertToFormat = useCallback(
    (value: unknown, format: Format): string => {
      // For single base types, wrap in an object with the property name
      const shouldWrapValue =
        typeof value !== 'object' || value === null || Array.isArray(value);
      const wrappedValue = shouldWrapValue ? { [propertyName]: value } : value;

      switch (format) {
        case 'json':
          return JSON.stringify(wrappedValue, null, 2);
        case 'yaml':
          return yaml.dump(wrappedValue, { indent: 2, lineWidth: -1 });
        case 'toml':
          return convertToToml(value, propertyName);
        default:
          return JSON.stringify(wrappedValue, null, 2);
      }
    },
    [convertToToml, propertyName]
  );

  const highlightCode = useCallback(
    (code: string, lang: string): string => {
      if (!highlighter || highlighterError) {
        return code;
      }

      try {
        const html = highlighter.codeToHtml(code, {
          lang,
          theme:
            systemTheme === 'dark' ? 'everforest-dark' : 'everforest-light',
          transformers: [
            {
              name: 'add-wrap-classes',
              pre(node) {
                // Add wrap classes to the pre element
                const existingClass = (node.properties.class as string) || '';
                node.properties.class =
                  `${existingClass} ${lineWrap ? 'wrap' : 'nowrap'}`.trim();
              },
            },
          ],
        });
        return html;
      } catch (error) {
        console.warn(`Failed to highlight ${lang} code:`, error);
        setHighlighterError(true);
        return code;
      }
    },
    [highlighter, highlighterError, lineWrap, systemTheme]
  );

  const formatLabel = useCallback((format: Format): string => {
    switch (format) {
      case 'json':
        return 'JSON';
      case 'yaml':
        return 'YAML';
      case 'toml':
        return 'TOML';
      default:
        return format;
    }
  }, []);

  const highlightedExamples = useMemo(() => {
    return examples.map((example, index) => {
      const code = convertToFormat(example, selectedFormat);
      return {
        index,
        code,
        highlighted: highlightCode(code, selectedFormat),
      };
    });
  }, [examples, selectedFormat, convertToFormat, highlightCode]);

  if (!examples || examples.length === 0) {
    return (
      <div className="examples-panel">
        <div className="examples-header">
          <h4 className="examples-title">No Examples Available</h4>
        </div>
        <div className="examples-content">
          <div className="no-examples-message">
            No examples found for this property or its parent properties.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="examples-panel">
      <div className="examples-header">
        <h4 className="examples-title">Examples</h4>
        <div className="examples-controls">
          <RadioGroup
            options={[
              { value: 'toml' as Format, label: formatLabel('toml') },
              { value: 'yaml' as Format, label: formatLabel('yaml') },
              { value: 'json' as Format, label: formatLabel('json') },
            ]}
            value={selectedFormat}
            onChange={format => {
              setSelectedFormat(format);
              // Note: We don't save to localStorage here as this should only affect
              // the current example, not the global default setting
            }}
            name="format-selector"
            size="md"
          />
          <Button
            variant="ghost"
            size="xs"
            className={`wrap-toggle-button ${lineWrap ? 'active' : ''}`}
            onClick={() => setLineWrap(!lineWrap)}
            title={lineWrap ? 'Disable line wrap.' : 'Enable line wrap.'}
          >
            {lineWrap ? (
              <HiArrowsRightLeft />
            ) : (
              <HiArrowUturnRight style={{ transform: 'scaleY(-1)' }} />
            )}
          </Button>
        </div>
      </div>

      <div className="examples-content">
        {highlightedExamples.map(({ index, code, highlighted }) => (
          <div key={index} className="example-item">
            <div className="example-header">
              <div className="example-label">EXAMPLE {index + 1}</div>
              <Button
                variant="ghost"
                size="xs"
                className="example-copy-button"
                onClick={e => {
                  if (onCopy) {
                    onCopy(code, e.currentTarget as HTMLElement);
                  } else if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(code).catch(() => {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = code;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                    });
                  }
                }}
                title="Copy this example."
              >
                <FaCopy />
              </Button>
            </div>
            <div className="code-container">
              {highlighter && !highlighterError && highlighted !== code ? (
                <div dangerouslySetInnerHTML={{ __html: highlighted }} />
              ) : (
                <pre
                  className={`code-fallback ${lineWrap ? 'wrap' : 'nowrap'}`}
                >
                  <code>{code}</code>
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamplesPanel;
