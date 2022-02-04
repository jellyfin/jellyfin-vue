module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1'
  },
  moduleFileExtensions: ['ts', 'js', 'vue', 'json'],
  transformIgnorePatterns: [
    // https://github.com/facebook/jest/issues/6229#issuecomment-403539460
    '/node_modules/(?!@jellyfin/client-axios).+\\.js$'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'ts-jest',
    '.*\\.(vue)$': '@vue/vue2-jest'
  },
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    '<rootDir>/components/**/*.vue',
    '<rootDir>/layouts/**/*.vue',
    '<rootDir>/middleware/**/*.vue',
    '<rootDir>/middleware/**/*.ts',
    '<rootDir>/mixins/**/*.vue',
    '<rootDir>/mixins/**/*.ts',
    '<rootDir>/pages/**/*.vue',
    '<rootDir>/plugins/**/*.ts',
    '<rootDir>/schemes/**/*.ts',
    '<rootDir>/store/**/*.ts',
    '<rootDir>/utils/**/*.ts'
  ],
  setupFiles: ['jest-canvas-mock', './jest.setup.ts']
};
