// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=24.7.0';

export const docker = {
  dockerBuildNodeJS: '3.4.0',
  nats: '2.11.9-alpine3.22',
};

export const eslint = {
  eslint: '^9.39.2',
  '@r2d2bzh/eslint-config': '^2.1.0',
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^2.2.0',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.1.0',
  '@r2d2bzh/moleculer-test-utils': '^1.2.0',
  '@r2d2bzh/yac': '^1.1.0',
  ava: '^6.4.1',
  c8: '^10.1.3',
  moleculer: '^0.14.35',
  nats: '^2.29.3',
  nodemon: '^3.1.11',
  uuid: '^13.0.0',
};
