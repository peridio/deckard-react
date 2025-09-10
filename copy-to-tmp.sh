#!/bin/bash

# Create tmp directory if it doesn't exist
mkdir -p tmp

# Copy files to tmp folder
cp wasm-*.cjs tmp/ 2>/dev/null || echo "Warning: No wasm-*.cjs files found"
cp index.cjs.js tmp/ 2>/dev/null || echo "Warning: index.cjs.js not found"
cp style.css tmp/ 2>/dev/null || echo "Warning: style.css not found"

echo "Files copied to tmp folder"
