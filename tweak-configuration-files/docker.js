import { join as path } from 'path';
import { toMultiline, addHashedHeader, readJSONFile } from '@r2d2bzh/js-rules';
import { extractField } from '../utils.js';

export default ({ addWarningHeader, serviceDirs, dbnRegistry, dbnVersion }) => {
  const dbdImagePrefix = path(dbnRegistry || '', 'docker-build-nodejs-');
  const dockerfileCommonFormatters = [
    addWarningHeader,
    addHashedHeader('The registry where docker-build-nodejs images are located can be set from'),
    addHashedHeader('{ "r2d2bzh": { "dockerRegistry": ... } } in the package.json file of the root project'),
  ];
  return async (config) => ({
    ...config,
    ...setDBNVersionInEnv({
      formatters: [
        addWarningHeader,
        addHashedHeader(
          'DOCKER_BUILD_NODEJS_VERSION can be set from { "r2d2bzh": { "dockerBuildNodejsVersion": ... } }'
        ),
        addHashedHeader('in the package.json file of the root project'),
        toMultiline,
      ].reverse(),
      dbnVersion,
    }),
    [path('dev', '.dockerignore')]: {
      configuration: ['*'],
      formatters: [toMultiline, addWarningHeader],
    },
    [path('dev', 'Dockerfile')]: {
      configuration: [
        'ARG DOCKER_BUILD_NODEJS_VERSION',
        `FROM ${dbdImagePrefix}devenv:\${DOCKER_BUILD_NODEJS_VERSION}`,
      ],
      formatters: [...dockerfileCommonFormatters, toMultiline].reverse(),
    },
    ...(await dockerConfigurationForServices({
      addWarningHeader,
      dockerfileCommonFormatters,
      dbdImagePrefix,
      serviceDirs,
    })),
  });
};

const setDBNVersionInEnv = ({ formatters, dbnVersion }) =>
  dbnVersion
    ? {
        '.env': {
          configuration: [`DOCKER_BUILD_NODEJS_VERSION=${dbnVersion}`],
          formatters,
        },
      }
    : {};

const dockerConfigurationForServices = async ({
  addWarningHeader,
  dockerfileCommonFormatters,
  dbdImagePrefix,
  serviceDirs,
}) =>
  Object.fromEntries(
    (
      await Promise.all(
        serviceDirs.map(async (context) => {
          return [
            [
              path(context, '.dockerignore'),
              {
                configuration: ['node_modules'],
                formatters: [toMultiline, addWarningHeader],
              },
            ],
            [
              path(context, 'Dockerfile'),
              {
                configuration: [
                  'ARG DOCKER_BUILD_NODEJS_VERSION',
                  `FROM ${dbdImagePrefix}builder:\${DOCKER_BUILD_NODEJS_VERSION} as builder`,
                  `FROM ${dbdImagePrefix}runtime:\${DOCKER_BUILD_NODEJS_VERSION}`,
                  ...(await getAdditionalCommands(context)),
                ],
                formatters: [
                  ...dockerfileCommonFormatters,
                  addHashedHeader('For additional commands, add { "r2d2bzh": { "dockerfileCommands": [ ... ] } }'),
                  addHashedHeader(`in ${context}/package.json`),
                  toMultiline,
                ].reverse(),
              },
            ],
          ];
        })
      )
    ).flat()
  );

const getAdditionalCommands = async (context) => {
  try {
    return extractCommandsFrom(await readJSONFile(path(context, 'package.json'))) || [];
  } catch (e) {
    return [];
  }
};

const extractCommandsFrom = extractField(['r2d2bzh', 'dockerfileCommands']);
