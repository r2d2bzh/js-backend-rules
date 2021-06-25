export default () =>
  ({ '.eslintignore': eslintIgnore, ...config }) => ({
    ...config,
    '.eslintignore': {
      configuration: [...eslintIgnore.configuration, '/__tests__'],
      formatters: eslintIgnore.formatters,
    },
  });
