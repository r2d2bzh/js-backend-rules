import { join as path } from 'path';

export default ({ toYAML, subPackages }) => {
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
      formatters: [toYAML],
    },
    ...releaseItConfigurationForSubPackages({ toYAML, subPackages }),
  });
};

const releaseItConfigurationForSubPackages = ({ toYAML, subPackages }) =>
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
        formatters: [toYAML],
      },
    ])
  );
