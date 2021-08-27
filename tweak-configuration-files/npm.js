import { toMultiline } from '@r2d2bzh/js-rules';

export default ({ addWarningHeader }) =>
  (config) => ({
    ...config,
    '.npmrc': {
      configuration: ['package-lock=false'],
      formatters: [toMultiline, addWarningHeader],
    },
  });
