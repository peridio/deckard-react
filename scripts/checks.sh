#!/usr/bin/env bash

set -e

npm run format:check
npm run type-check
npm run lint
npm run test:ci
npm run build
