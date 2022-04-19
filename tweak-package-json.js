import { join as path } from 'node:path';
import { mergeInJSONFile } from './utils.js';
import { npm as dependenciesVersions, nodejs as minimalNodeJS } from './versions.js';

export default ({ logger, serviceDirectories, subPackages }) =>
  Promise.all(
    Object.entries(
      packageTweaks({
        serviceDirectories,
        alienPackages: subPackages.filter((p) => !['test', ...serviceDirectories].includes(p)),
      })
    ).map(([pack, tweak]) => mergeInJSONFile(pack, tweak).then(() => logger.log(`${pack} tweaked`)))
  );

const commonPackageOptions = {
  type: 'module',
  engines: {
    node: minimalNodeJS,
  },
};

const packageTweaks = ({ serviceDirectories, alienPackages }) => ({
  'package.json': {
    ...commonPackageOptions,
    scripts: {
      r2d2: 'r2d2bzh-js-backend-rules',
      postinstall: 'true # postinstall is disabled since js-backend-rules 0.1.2',
      lint: 'eslint .',
      pretest: 'docker-compose build test',
      'pretest:debug': 'npm run pretest',
      test: 'docker-compose run test',
      'test:debug': 'docker-compose run --publish 9229 test debug',
      prerelease: 'npm run test',
      release: 'release-it',
    },
  },
  [path('test', 'package.json')]: {
    ...commonPackageOptions,
    scripts: {
      postinstall: serviceDirectories.map((directory) => `(cd "${path('..', directory)}" && npm i)`).join(' && '),
      precov: 'npm install',
      cov: 'c8 ava',
      prenocov: 'npm install',
      nocov: 'ava',
      predebug: 'npm install',
      debug: 'ava debug --host 0.0.0.0',
    },
    c8: {
      'check-coverage': true,
      all: true,
      allowExternal: true,
      src: serviceDirectories.map((p) => path('..', p)),
      exclude: ['.release-it.js', 'index.js', '**/__tests__/**'],
      reporter: ['lcov', 'text'],
    },
    dependencies: dependencies(['ava', 'c8', 'moleculer', 'uuid']),
  },
  ...Object.fromEntries(
    serviceDirectories.map((directory) => [
      path(directory, 'package.json'),
      {
        ...commonPackageOptions,
        scripts: {
          start: 'nodemon --exec "node --inspect=0.0.0.0:9229" .',
          prestart: 'npm i',
        },
        esbuildOptions: {
          external: ['avsc', 'protobufjs/minimal', 'thrift'],
        },
        dependencies: dependencies([
          '@r2d2bzh/moleculer-healthcheck-middleware',
          '@r2d2bzh/moleculer-start-checker-middleware',
          '@r2d2bzh/yac',
          'moleculer',
          'nats',
        ]),
        devDependencies: dependencies(['nodemon']),
      },
    ])
  ),
  ...Object.fromEntries(alienPackages.map((p) => [path(p, 'package.json'), commonPackageOptions])),
});

// eslint-disable-next-line security/detect-object-injection
const dependencies = (depList) => Object.fromEntries(depList.map((dep) => [dep, dependenciesVersions[dep]]));
