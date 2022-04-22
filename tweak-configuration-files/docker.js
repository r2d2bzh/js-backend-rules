import { join as path } from 'node:path';
// eslint-disable-next-line import/no-unresolved
import pMemoize from 'p-memoize';
import { toMultiline, addHashedHeader, readJSONFile } from '@r2d2bzh/js-rules';
import { extractValue } from '../utils.js';

export default ({ logger, addWarningHeader, serviceDirectories, dbnImagePrefix, dbnImageVersion }) => {
  const dockerfileCommonFormatters = [
    addWarningHeader,
    addHashedHeader([
      'The location from where docker-build-nodejs images are pulled',
      'can be set in the package.json file of the root project:',
      '{ "r2d2bzh": { "dockerBuildNodeJS": {',
      '  "imagePrefix": ...,',
      '  "imageVersion": ...,',
      '} } }',
    ]),
  ];
  return async (config) => ({
    ...config,
    '.env': {
      configuration: [`DOCKER_BUILD_NODEJS_VERSION=${dbnImageVersion}`],
      formatters: [toMultiline, addWarningHeader],
    },
    [path('dev', '.dockerignore')]: {
      configuration: ['*'],
      formatters: [toMultiline, addWarningHeader],
    },
    [path('dev', 'Dockerfile')]: {
      configuration: [
        'ARG DOCKER_BUILD_NODEJS_VERSION',
        `FROM ${dbnImagePrefix}devenv:\${DOCKER_BUILD_NODEJS_VERSION}`,
      ],
      formatters: [...dockerfileCommonFormatters, toMultiline].reverse(),
    },
    [path('share', 'Dockerfile')]: {
      configuration: ['FROM scratch', 'COPY . /share/'],
      formatters: [addWarningHeader, toMultiline].reverse(),
    },
    ...(await dockerConfigurationForServices({
      logger,
      addWarningHeader,
      dockerfileCommonFormatters,
      dbnImagePrefix,
      serviceDirectories,
    })),
  });
};

const dockerConfigurationForServices = async ({
  logger,
  addWarningHeader,
  dockerfileCommonFormatters,
  dbnImagePrefix,
  serviceDirectories,
}) => {
  const servicesConfiguration = await Promise.all(
    serviceDirectories.map(async (context) => {
      const { commands } = await getCustomSettings(context, logger);
      return [
        [
          path(context, '.dockerignore'),
          {
            configuration: ['node_modules', 'share'],
            formatters: [toMultiline, addWarningHeader],
          },
        ],
        [
          path(context, 'Dockerfile'),
          {
            configuration: [
              'ARG DOCKER_BUILD_NODEJS_VERSION',
              'ARG SHARE=scratch',
              `FROM \${SHARE} as share`,
              `FROM ${dbnImagePrefix}builder:\${DOCKER_BUILD_NODEJS_VERSION} as builder`,
              ...commands('builder'),
              `FROM ${dbnImagePrefix}runtime:\${DOCKER_BUILD_NODEJS_VERSION}`,
              ...commands('runtime'),
            ],
            formatters: [
              ...dockerfileCommonFormatters,
              addHashedHeader([
                `For additional builder and runtime commands, add the following in ${context}/package.json:`,
                '{ "r2d2bzh": { "dockerfileCommands": { "builder": [ ... ], "runtime": [ ... ] } } }',
                `To modify the share image, add the following in ${context}/package.json:`,
                '{ "r2d2bzh": { "dockerfileShare": "imageTag" } }',
              ]),
              toMultiline,
            ].reverse(),
          },
        ],
      ];
    })
  );
  return Object.fromEntries(servicesConfiguration.flat());
};

const getCustomSettings = async (context, logger) => {
  try {
    const { commands } = await getCustomSettingsFrom(path(context, 'package.json'));
    return {
      commands: (step) => {
        try {
          if (Symbol.iterator in new Object(commands)) {
            logger.error(`ignored old additional commands syntax, check ${path(context, 'Dockerfile')}`);
            return [];
          }
          // step is not a user input
          // eslint-disable-next-line security/detect-object-injection
          const stepCommands = commands?.[step];
          return Symbol.iterator in new Object(stepCommands) ? stepCommands : [];
        } catch (error) {
          logger.error(`failed to retrieve additional ${step} Dockerfile commands (${error.message})`);
          return [];
        }
      },
    };
  } catch (error) {
    logger.error(`failed to retrieve custom Dockerfile settings (${error.message})`);
    return {
      commands: () => [],
    };
  }
};

const getCustomSettingsFrom = pMemoize(async (filePath) => {
  const settings = await readJSONFile(filePath);
  return {
    commands: extractCommandsFrom(settings),
  };
});

const extractCommandsFrom = extractValue(['r2d2bzh', 'dockerfileCommands']);
