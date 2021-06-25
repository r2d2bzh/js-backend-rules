import { join as path } from 'path';
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

export default ({ addWarningHeader, serviceDirs, natsRegistry, webservicesRegistry }) => {
  const services = serviceDirs.reduce(addServiceToConfiguration(webservicesRegistry), {});
  const testVolumes = ['./test:/home/user/dev', ...serviceDirs.map((dir) => `./${dir}:/home/user/${dir}`)];
  return (config) => ({
    ...config,
    'docker-compose.yml': {
      configuration: {
        services: {
          ...services,
          test: {
            build,
            volumes: testVolumes,
            profiles: ['test'],
            entrypoint: ['npm', 'run'],
            command: ['cov'],
          },
          _test: {
            build,
            volumes: testVolumes,
            ports: [9229],
          },
          nats: {
            image: `${path(natsRegistry || '', 'nats')}:${versions[natsRegistry ? 'local' : 'hub'].nats}`,
          },
        },
      },
      formatters: [
        addWarningHeader,
        addHashedHeader('If you need to customize the compose configuration, please use docker-compose.override.yml'),
        addHashedHeader('More details are available here:'),
        addHashedHeader('- https://docs.docker.com/compose/reference/#specifying-multiple-compose-files'),
        addHashedHeader('- https://docs.docker.com/compose/extends/#adding-and-overriding-configuration'),
        addHashedHeader('- https://github.com/compose-spec/compose-spec/blob/master/spec.md'),
        toYAML,
      ].reverse(),
    },
  });
};

const addServiceToConfiguration = (webservicesRegistry) => (configuration, serviceDir) => ({
  ...configuration,
  [serviceDir]: {
    build,
    depends_on: ['nats'],
    volumes: [`./${serviceDir}:/home/user/dev`],
    command: ['npm', 'start'],
    ports: [9229],
  },
  [`${serviceDir}.rel`]: {
    image: `${webservicesRegistry}/api-${serviceDir}:\${VERSION:-dev}`,
    build: {
      context: `./${serviceDir}`,
      args: {
        DOCKER_BUILD_NODEJS_VERSION: '${DOCKER_BUILD_NODEJS_VERSION}',
      },
    },
    depends_on: ['nats'],
  },
});
