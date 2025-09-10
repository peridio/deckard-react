#!/usr/bin/env node

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Try to import the built component, fall back to source if needed
let DeckardSchema;
try {
  const deckardModule = await import("./dist/index.esm.js");
  DeckardSchema = deckardModule.DeckardSchema;
} catch (error) {
  console.error(
    'Warning: Could not load built component, ensure "npm run build" has been run',
  );
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const schemaJson = args[0];
const optionsJson = args[1] || "{}";

try {
  // Parse input
  const schema = JSON.parse(schemaJson);
  const options = JSON.parse(optionsJson);

  // Render React component to HTML
  const componentHtml = renderToStaticMarkup(
    React.createElement(DeckardSchema, {
      schema: schema,
      options: options,
    }),
  );

  // Output the HTML
  console.log(componentHtml);
} catch (error) {
  console.error(`Error rendering schema: ${error.message}`);
  process.exit(1);
}
