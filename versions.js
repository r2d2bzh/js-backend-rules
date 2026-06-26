// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=24.7.0';

export const docker = {
  dockerBuildNodeJS: '3.4.0',
  nats: '2.14.2-alpine3.22',
};

export const eslint = {
  eslint: '^10.5.0',
  '@r2d2bzh/eslint-config': '^3.0.1',
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^2.3.0',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.2.1',
  '@r2d2bzh/moleculer-test-utils': '^1.3.0',
  '@r2d2bzh/yac': '^1.2.0',
  ava: '^8.0.1',
  c8: '^11.0.0',
  moleculer: '^0.14.35',
  nats: '^2.29.3',
  nodemon: '^3.1.14',
  uuid: '^14.0.1',
};
