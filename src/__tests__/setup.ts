import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => {
    const mockMediaQuery = {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    return mockMediaQuery;
  }),
});

// Mock Shiki to avoid WASM loading issues in test environment
vi.mock('shiki/core', () => ({
  createHighlighterCore: vi.fn().mockImplementation(_config => {
    // Return synchronously to avoid timing issues
    return {
      codeToHtml: vi.fn((code: string) => `<pre><code>${code}</code></pre>`),
      dispose: vi.fn(),
    };
  }),
}));

vi.mock('shiki/engine/oniguruma', () => ({
  createOnigurumaEngine: vi.fn().mockImplementation(_wasmImport => {
    // Return a synchronous mock engine
    return {};
  }),
}));

vi.mock('shiki/wasm', () => ({
  default: {},
}));

vi.mock('@shikijs/langs/json', () => ({
  default: { name: 'json' },
}));

vi.mock('@shikijs/langs/yaml', () => ({
  default: { name: 'yaml' },
}));

vi.mock('@shikijs/langs/toml', () => ({
  default: { name: 'toml' },
}));

vi.mock('@shikijs/themes/everforest-light', () => ({
  default: { name: 'everforest-light' },
}));

vi.mock('@shikijs/themes/everforest-dark', () => ({
  default: { name: 'everforest-dark' },
}));
