module.exports = {
  collectCoverage: true,
  coverageReporters: ['text', 'cobertura', 'html', 'lcov'],
  projects: ['<rootDir>/client/jest.config.js'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$'
};
