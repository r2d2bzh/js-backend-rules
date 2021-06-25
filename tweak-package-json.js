import { join as path } from 'path';
import { mixinJSONFile } from './utils.js';
import { npm as dependenciesVersions, nodejs as minimalNodeJS } from './versions.js';

export default ({ logPreamble, serviceDirs }) =>
  Promise.all(
    Object.entries(packageTweaks(serviceDirs)).map(([pack, tweak]) =>
      mixinJSONFile(pack, tweak).then(() => console.log(logPreamble, `${pack} tweaked`))
    )
  );

const commonPackageOptions = {
  type: 'module',
  engines: {
    node: minimalNodeJS,
  },
};

const packageTweaks = (serviceDirs) => ({
  'package.json': {
    ...commonPackageOptions,
    scripts: {
      lint: 'eslint .',
      release: 'release-it',
      pretest: 'npm run lint',
      test: 'docker-compose run test',
      'test:debug': 'docker-compose run --publish 9229 test debug',
    },
  },
  [path('test', 'package.json')]: {
    ...commonPackageOptions,
    scripts: {
      checkdeps: serviceDirs.reduce((s, p) => `${s} && (cd "${path('..', p)}" && npm i)`, 'true'),
      precov: 'npm run checkdeps',
      cov: 'c8 ava',
      prenocov: 'npm run checkdeps',
      nocov: 'ava',
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
});

const dependencies = (depList) => depList.reduce((deps, dep) => ({ ...deps, [dep]: dependenciesVersions[dep] }), {});
