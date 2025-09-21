import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExamplesPanel from '../property/ExamplesPanel';
import { JsonSchema } from '../types';

// Mock the system theme hook
vi.mock('../hooks/useSystemTheme', () => ({
  useSystemTheme: () => 'light',
}));

// Mock Shiki to avoid complex setup in tests
vi.mock('shiki/core', () => ({
  createHighlighterCore: vi.fn().mockImplementation(() => ({
    codeToHtml: (code: string) => `<pre><code>${code}</code></pre>`,
    dispose: vi.fn(),
  })),
}));

vi.mock('shiki/engine/oniguruma', () => ({
  createOnigurumaEngine: vi.fn().mockImplementation(() => ({})),
}));

describe('ExamplesPanel', () => {
  it('should maintain independent language selection state across multiple panels', async () => {
    const schemaA: JsonSchema = {
      type: 'string',
      examples: ['test-a'],
    };

    const schemaB: JsonSchema = {
      type: 'string',
      examples: ['test-b'],
    };

    const rootSchema: JsonSchema = {
      type: 'object',
      properties: { propA: schemaA, propB: schemaB },
    };

    render(
      <div>
        <div data-testid="panel-a">
          <ExamplesPanel
            currentProperty={schemaA}
            rootSchema={rootSchema}
            propertyPath={['propA']}
            options={{ defaultExampleLanguage: 'yaml' }}
          />
        </div>
        <div data-testid="panel-b">
          <ExamplesPanel
            currentProperty={schemaB}
            rootSchema={rootSchema}
            propertyPath={['propB']}
            options={{ defaultExampleLanguage: 'yaml' }}
          />
        </div>
      </div>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Examples')).toHaveLength(2);
    });

    const panelA = screen.getByTestId('panel-a');
    const panelB = screen.getByTestId('panel-b');

    const yamlButtonA = panelA.querySelector(
      'input[value="yaml"]'
    ) as HTMLInputElement;
    const jsonButtonA = panelA.querySelector(
      'input[value="json"]'
    ) as HTMLInputElement;
    const yamlButtonB = panelB.querySelector(
      'input[value="yaml"]'
    ) as HTMLInputElement;
    const jsonButtonB = panelB.querySelector(
      'input[value="json"]'
    ) as HTMLInputElement;

    // Both should start with YAML selected
    expect(yamlButtonA).toBeChecked();
    expect(yamlButtonB).toBeChecked();

    // Click JSON in panel A
    fireEvent.click(jsonButtonA);

    await waitFor(() => {
      // Panel A should change to JSON
      expect(jsonButtonA).toBeChecked();
      expect(yamlButtonA).not.toBeChecked();

      // Panel B should remain unchanged (this would fail before the fix)
      expect(yamlButtonB).toBeChecked();
      expect(jsonButtonB).not.toBeChecked();
    });
  });
});
