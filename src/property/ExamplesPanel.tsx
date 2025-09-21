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
import { resolveSchema } from '../utils';

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
  // Generate unique name for this panel's radio group
  const panelId = useMemo(() => {
    const pathStr = propertyPath.join('-');
    return `format-selector-${pathStr}-${Math.random().toString(36).substr(2, 9)}`;
  }, [propertyPath]);
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
      // For resolved schemas (already processed oneOf), check current property for examples
      if (schema.examples && schema.examples.length > 0) {
        return {
          examples: schema.examples,
          propertyName: path[path.length - 1] || 'property',
        };
      }

      // Check oneOf schemas for examples - but only if currentProperty is the original oneOf schema
      if (schema.oneOf && Array.isArray(schema.oneOf) && rootSchema) {
        for (const option of schema.oneOf) {
          const resolvedOption = resolveSchema(option, rootSchema);
          if (resolvedOption.examples && resolvedOption.examples.length > 0) {
            return {
              examples: resolvedOption.examples,
              propertyName: path[path.length - 1] || 'property',
            };
          }
        }
      }

      // Check patternProperties for examples
      if (schema.patternProperties && rootSchema) {
        for (const patternSchema of Object.values(schema.patternProperties)) {
          const resolvedPattern = resolveSchema(patternSchema, rootSchema);

          // First check if pattern property itself has examples
          if (resolvedPattern.examples && resolvedPattern.examples.length > 0) {
            return {
              examples: resolvedPattern.examples,
              propertyName: path[path.length - 1] || 'property',
            };
          }

          // Then check if pattern property has oneOf with examples
          if (resolvedPattern.oneOf && Array.isArray(resolvedPattern.oneOf)) {
            for (const option of resolvedPattern.oneOf) {
              const resolvedOption = resolveSchema(option, rootSchema);
              if (
                resolvedOption.examples &&
                resolvedOption.examples.length > 0
              ) {
                return {
                  examples: resolvedOption.examples,
                  propertyName: path[path.length - 1] || 'property',
                };
              }
            }
          }
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
    let isMounted = true;
    const abortController = new AbortController();

    const initHighlighter = async () => {
      try {
        // Check if component is still mounted before starting async operations
        if (!isMounted) return;

        const wasmModule = await import('shiki/wasm');

        // Check again after async operation
        if (!isMounted || abortController.signal.aborted) return;

        const engine = createOnigurumaEngine(wasmModule);
        const highlighterCore = await createHighlighterCore({
          themes: [everforestLight, everforestDark],
          langs: [jsonLang, yamlLang, tomlLang],
          engine: engine,
        });

        // Final check before setting state
        if (isMounted && !abortController.signal.aborted) {
          setHighlighter(highlighterCore);
        }
      } catch (error) {
        // Only update state if component is still mounted
        if (isMounted && !abortController.signal.aborted) {
          console.warn('Failed to initialize Shiki highlighter:', error);
          setHighlighterError(true);
        }
      }
    };

    initHighlighter();

    return () => {
      isMounted = false;
      abortController.abort();
    };
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
      switch (format) {
        case 'json':
          return JSON.stringify(value, null, 2);
        case 'yaml':
          return yaml.dump(value, { indent: 2, lineWidth: -1 });
        case 'toml':
          return convertToToml(value, propertyName);
        default:
          return JSON.stringify(value, null, 2);
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
    return null;
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
            name={panelId}
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
                  } else if (
                    typeof window !== 'undefined' &&
                    typeof document !== 'undefined'
                  ) {
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
