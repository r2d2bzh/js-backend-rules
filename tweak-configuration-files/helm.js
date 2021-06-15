import { join as path } from 'path';

export default ({ projectDetails, toYAML }) =>
  (config) => ({
    ...config,
    [path('helm', 'Chart.yaml')]: helmChart({ toYAML, projectDetails }),
  });

const helmChart = ({ toYAML, projectDetails: { name, version, description } }) => ({
  configuration: {
    apiVersion: 'v1',
    name,
    version,
    description,
    appVersion: version,
  },
  formatters: [toYAML],
});
