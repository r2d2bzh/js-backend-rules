import { join as path } from 'path';
import { toYAML } from '@r2d2bzh/js-rules';

export default ({ addWarningHeader, subPackages }) => {
  return (config) => ({
    ...config,
    '.release-it.yaml': {
      configuration: {
        npm: {
          publish: false,
        },
        'before:bump': [
          "sed -i -e 's/${latestVersion}/${version}/g' helm/Chart.yaml",
          ...subPackages.map((pack) => `(cd ${pack} && release-it --ci \${version})`),
        ],
      },
      formatters: [toYAML, addWarningHeader],
    },
    ...releaseItConfigurationForSubPackages({ addWarningHeader, subPackages }),
  });
};

const releaseItConfigurationForSubPackages = ({ addWarningHeader, subPackages }) =>
  Object.fromEntries(
    subPackages.map((packDir) => [
      path(packDir, '.release-it.yaml'),
      {
        configuration: {
          npm: {
            publish: false,
          },
          git: {
            requireCleanWorkingDir: false,
            commit: false,
            tag: false,
            push: false,
          },
        },
        formatters: [toYAML, addWarningHeader],
      },
    ])
  );
