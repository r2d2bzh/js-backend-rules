import { join as path } from 'path';
import { mixinJSONFile } from './utils.js';
import { npm as dependenciesVersions, nodejs as minimalNodeJS } from './versions.js';

export default ({ logger, logPreamble, serviceDirs, subPackages }) =>
  Promise.all(
    Object.entries(
      packageTweaks({ serviceDirs, alienPackages: subPackages.filter((p) => !['test', ...serviceDirs].includes(p)) })
    ).map(([pack, tweak]) => mixinJSONFile(pack, tweak).then(() => logger.log(logPreamble, `${pack} tweaked`)))
  );

const commonPackageOptions = {
  type: 'module',
  engines: {
    node: minimalNodeJS,
  },
};

const packageTweaks = ({ serviceDirs, alienPackages }) => ({
  'package.json': {
    ...commonPackageOptions,
    scripts: {
      r2d2: 'r2d2bzh-js-backend-rules',
      postinstall: 'npm run r2d2',
      lint: 'eslint .',
      pretest: 'true # pretest is disabled since js-backend-rules 0.1.0',
      test: 'docker-compose run test',
      'test:debug': 'docker-compose run --publish 9229 test debug',
      prerelease: 'npm run test',
      release: 'release-it',
    },
  },
  [path('test', 'package.json')]: {
    ...commonPackageOptions,
    scripts: {
      postinstall: serviceDirs.reduce((s, p) => `${s} && (cd "${path('..', p)}" && npm i)`, 'true'),
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
      src: serviceDirs.map((p) => path('..', p)),
      exclude: ['.release-it.js', 'index.js', '**/__tests__/**'],
      reporter: ['lcov', 'text'],
    },
    dependencies: dependencies(['ava', 'c8', 'moleculer', 'uuid']),
  },
  ...Object.fromEntries(
    serviceDirs.map((dir) => [
      path(dir, 'package.json'),
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
const dependencies = (depList) => depList.reduce((deps, dep) => ({ ...deps, [dep]: dependenciesVersions[dep] }), {});
