module.exports = {
  collectCoverage: true,
  coverageReporters: ['text', 'cobertura', 'html', 'lcov'],
  projects: ['<rootDir>/src/jest.config.js'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$'
};
