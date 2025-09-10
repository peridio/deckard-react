export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', { useESM: true }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['<rootDir>/src/**/*.(test|spec).(ts|tsx)'],
  testPathIgnorePatterns: ['/node_modules/', 'setup.ts', 'test-utils.tsx'],
  collectCoverageFrom: ['src/**/*.(ts|tsx)', '!src/**/*.d.ts', '!src/index.ts'],
};
