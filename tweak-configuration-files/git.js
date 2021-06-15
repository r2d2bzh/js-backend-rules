export default ({ toIgnore }) =>
  (config) => ({
    ...config,
    '.gitignore': {
      configuration: ['/package-lock.json', 'node_modules', 'test/coverage'],
      formatters: [toIgnore],
    },
  });
