const addEslintConfiguration = ({ '.eslintignore': eslintIgnore, ...config }) => ({
  ...config,
  '.eslintignore': {
    configuration: [...eslintIgnore.configuration, '/__tests__', '**/coverage'],
    formatters: eslintIgnore.formatters,
  },
});

export default () => addEslintConfiguration;
