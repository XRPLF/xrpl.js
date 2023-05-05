module.exports = {
  extension: ['.js', '.ts'],

  exclude: [
    '**/*.d.ts',
    '*.js',
    'test/**/*',
    'coverage/**/*',
  ],

  // Assert we remain at 100% code coverage
  'check-coverage': true,
  'branches': 100,
  'lines': 100,
  'functions': 100,
  'statements': 100,

  // Required to get coverage reported on every file, including those that aren't tested
  all: true,
}
