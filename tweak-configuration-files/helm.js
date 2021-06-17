import { join as path } from 'path';
import { toYAML } from '@r2d2bzh/js-rules';

export default (options) => (config) => ({
  ...config,
  [path('helm', 'Chart.yaml')]: helmChart(options),
});

const helmChart = ({ addWarningHeader, name, version, description }) => ({
  configuration: {
    apiVersion: 'v1',
    name,
    version,
    description,
    appVersion: version,
  },
  formatters: [toYAML, addWarningHeader],
});
