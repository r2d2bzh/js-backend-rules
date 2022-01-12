import { addHeader, addHashedHeader, toYAML } from '@r2d2bzh/js-rules';
import { docker as versions } from '../versions.js';

const build = {
  context: './dev',
  args: {
    UID: '${UID}',
    GID: '${GID}',
    DOCKER_BUILD_NODEJS_VERSION: '${DOCKER_BUILD_NODEJS_VERSION}',
  },
};

export default ({ addWarningHeader, serviceDirs, releaseImagePath }) => {
  const services = serviceDirs.reduce(addServiceToConfiguration(releaseImagePath), {});
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
            image: `nats:${versions.nats}`,
          },
        },
      },
      formatters: [
        addWarningHeader,
        addHashedHeader('To customize the registry path of the released images, the following'),
        addHashedHeader('setting is available in the package.json file of the root project:'),
        addHashedHeader('{ "r2d2bzh": { "dockerRegistry": ... } }'),
        addHeader('#')(''),
        addHashedHeader('If you need to customize the compose configuration any further,'),
        addHashedHeader('please use docker-compose.override.yml'),
        addHeader('#')(''),
        addHashedHeader('More details are available here:'),
        addHashedHeader('- https://docs.docker.com/compose/reference/#specifying-multiple-compose-files'),
        addHashedHeader('- https://docs.docker.com/compose/extends/#adding-and-overriding-configuration'),
        addHashedHeader('- https://github.com/compose-spec/compose-spec/blob/master/spec.md'),
        toYAML,
      ].reverse(),
    },
  });
};

const addServiceToConfiguration = (releaseImagePath) => (configuration, serviceDir) => ({
  ...configuration,
  [serviceDir]: {
    build,
    depends_on: ['nats'],
    volumes: [`./${serviceDir}:/home/user/dev`],
    command: ['npm', 'start'],
    ports: [9229],
  },
  [`${serviceDir}.rel`]: {
    image: `${releaseImagePath}/${serviceDir}:\${VERSION:-dev}`,
    build: {
      context: `./${serviceDir}`,
      args: {
        DOCKER_BUILD_NODEJS_VERSION: '${DOCKER_BUILD_NODEJS_VERSION}',
      },
    },
    depends_on: ['nats'],
    profiles: ['rel'],
  },
});
