import { toMultiline } from '@r2d2bzh/js-rules';

export default ({ addWarningHeader }) =>
  (config) => ({
    ...config,
    '.gitignore': {
      configuration: ['/package-lock.json', 'node_modules', 'test/coverage'],
      formatters: [toMultiline, addWarningHeader],
    },
  });
