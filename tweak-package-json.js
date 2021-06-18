import { join as path } from 'path';
import { mixinJSONFile } from './utils.js';

export default (serviceDirs) =>
  Promise.all(Object.entries(packageScripts(serviceDirs)).map(([pack, scripts]) => mixinJSONFile(pack, scripts)));

const packageScripts = (serviceDirs) => ({
  'package.json': {
    scripts: {
      lint: 'eslint .',
      release: 'release-it',
      pretest: 'npm run lint',
      test: 'docker-compose run test',
      'test:debug': 'docker-compose run --publish 9229 test debug',
    },
  },
  [path('test', 'package.json')]: {
    scripts: {
      checkdeps: serviceDirs.reduce((s, p) => `${s} && (cd "${path('..', p)}" && npm i)`, 'true'),
      precov: 'npm run checkdeps',
      cov: 'c8 ava',
      prenocov: 'npm run checkdeps',
      nocov: 'ava',
      debug: 'ava debug --host 0.0.0.0',
    },
  },
});
