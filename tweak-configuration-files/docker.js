import { join as path } from 'path';
import pMemoize from 'p-memoize';
import { toMultiline, addHashedHeader, readJSONFile } from '@r2d2bzh/js-rules';
import { extractField } from '../utils.js';
import { docker as versions } from '../versions.js';

export default ({ addWarningHeader, serviceDirs, dbnRegistry }) => {
  const dbdImagePrefix = path(dbnRegistry || '', 'docker-build-nodejs-');
  const dockerfileCommonFormatters = [
    addWarningHeader,
    addHashedHeader('The registry where docker-build-nodejs images are located can be set from'),
    addHashedHeader('{ "r2d2bzh": { "dockerRegistry": ... } } in the package.json file of the root project'),
  ];
  return async (config) => ({
    ...config,
    '.env': {
      configuration: [`DOCKER_BUILD_NODEJS_VERSION=${versions.local.dockerBuildNodejs}`],
      formatters: [toMultiline, addWarningHeader],
    },
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
                  ...(await getAdditionalBuilderCommands(context)),
                  `FROM ${dbdImagePrefix}runtime:\${DOCKER_BUILD_NODEJS_VERSION}`,
                  ...(await getAdditionalRuntimeCommands(context)),
                ],
                formatters: [
                  ...dockerfileCommonFormatters,
                  addHashedHeader(
                    'For additional runtime commands, add { "r2d2bzh": { "dockerfileCommands": [ ... ] } }'
                  ),
                  addHashedHeader(`in ${context}/package.json`),
                  addHashedHeader('For additional builder commands, you can also use the following syntax:'),
                  addHashedHeader('{ "r2d2bzh": { "dockerfileCommands": { "builder": [ ... ], "runtime": [ ...] } } }'),
                  toMultiline,
                ].reverse(),
              },
            ],
          ];
        })
      )
    ).flat()
  );

const getAdditionalBuilderCommands = async (context) => {
  try {
    const commands = await getCommands(path(context, 'package.json'));
    return commands instanceof Array ? [] : commands.builder ? commands.builder : [];
  } catch (e) {
    return [];
  }
};

const getAdditionalRuntimeCommands = async (context) => {
  try {
    const commands = await getCommands(path(context, 'package.json'));
    return commands instanceof Array ? commands : commands.runtime ? commands.runtime : [];
  } catch (e) {
    return [];
  }
};

const getCommands = pMemoize(async (filePath) => extractCommandsFrom(await readJSONFile(filePath)));

const extractCommandsFrom = extractField(['r2d2bzh', 'dockerfileCommands']);
