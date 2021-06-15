import { join as path } from 'path';

export default ({ toIgnore, serviceDirs }) =>
  (config) => ({
    ...config,
    [path('dev', '.dockerignore')]: {
      configuration: ['*'],
      formatters: [toIgnore],
    },
    ...dockerConfigurationForServices(toIgnore, serviceDirs),
  });

const dockerConfigurationForServices = (toIgnore, serviceDirs) =>
  Object.fromEntries(
    serviceDirs.map((context) => [
      path(context, '.dockerignore'),
      {
        configuration: ['node_modules'],
        formatters: [toIgnore],
      },
    ])
  );
