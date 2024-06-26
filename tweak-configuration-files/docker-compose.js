import { addHashedHeader, toYAML } from '@r2d2bzh/js-rules';
import { docker as versions } from '../versions.js';

const build = {
  context: './dev',
  args: {
    UID: '${UID}',
    GID: '${GID}',
    DOCKER_BUILD_NODEJS_VERSION: '${DOCKER_BUILD_NODEJS_VERSION}',
  },
};

const sanitizeImageName = (imageName) => imageName.replace(/^\/+/, '').replaceAll(/[^\w./:-]/gi, '');

export default ({
  addWarningHeader,
  serviceDirectories,
  releaseImagePath,
  projectName,
  volumeSourceRoot,
  rootDockerImage,
}) => {
  const shareImageName = `${sanitizeImageName(projectName)}-share:\${VERSION:-dev}`;
  const services = Object.fromEntries(
    serviceDirectories.flatMap(
      addServiceToConfiguration({ releaseImagePath, shareImageName, volumeSourceRoot, rootDockerImage }),
    ),
  );
  const testVolumes = [
    `${volumeSourceRoot}/test:/home/user/dev`,
    ...(rootDockerImage ? [`${volumeSourceRoot}/share:/home/user/share`] : []),
    ...serviceDirectories.map((directory) => `${volumeSourceRoot}/${directory}:/home/user/${directory}`),
  ];
  return (config) => ({
    ...config,
    'docker-compose.yml': {
      configuration: {
        services: {
          ...(rootDockerImage
            ? {
                share: {
                  image: shareImageName,
                  build: {
                    context: './share',
                  },
                  profiles: ['share'],
                },
              }
            : {}),
          ...services,
          test: {
            build,
            volumes: testVolumes,
            profiles: ['test'],
            entrypoint: ['npm', 'run'],
            command: ['cov'],
          },
          'test-runner': {
            build,
            volumes: testVolumes,
            ports: [9229],
          },
          nats: {
            image: `nats:${versions.nats}`,
          },
        },
      },
      formatters: [
        addWarningHeader,
        addHashedHeader([
          'To customize the registry path of the released images, the following',
          'setting is available in the package.json file of the root project:',
          '{ "r2d2bzh": { "dockerRegistry": ... } }',
          '',
          'The default path from where volumes are mounted is "." (the compose file path)',
          'This can also be customized in the package.json file of the root project:',
          '{ "r2d2bzh": { "volumeSourceRoot": ... } }',
          '',
          'If you need to customize the compose configuration any further,',
          'please use docker compose.override.yml',
          '',
          'More details are available here:',
          '- https://docs.docker.com/compose/reference/#specifying-multiple-compose-files',
          '- https://docs.docker.com/compose/extends/#adding-and-overriding-configuration',
          '- https://github.com/compose-spec/compose-spec/blob/master/spec.md',
        ]),
        toYAML,
      ].reverse(),
    },
  });
};

const addServiceToConfiguration =
  ({ releaseImagePath, shareImageName, volumeSourceRoot, rootDockerImage }) =>
  (serviceDirectory) => [
    [
      serviceDirectory,
      {
        build,
        depends_on: ['nats'],
        volumes: [
          `${volumeSourceRoot}/${serviceDirectory}:/home/user/dev`,
          ...(rootDockerImage ? [`${volumeSourceRoot}/share:/home/user/share`] : []),
        ],
        command: ['npm', 'start'],
        ports: [9229],
      },
    ],
    [
      `${serviceDirectory}.rel`,
      {
        image: `${sanitizeImageName(`${releaseImagePath}/${serviceDirectory}`)}:\${VERSION:-dev}`,
        build: {
          context: `./${serviceDirectory}`,
          args: {
            DOCKER_BUILD_NODEJS_VERSION: '${DOCKER_BUILD_NODEJS_VERSION}',
            ...(rootDockerImage ? { SHARE: shareImageName } : {}),
          },
        },
        depends_on: ['nats'],
        profiles: ['rel'],
      },
    ],
  ];
