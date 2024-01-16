// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=20.11.0';

export const docker = {
  dockerBuildNodeJS: '3.0.0-0',
  nats: '2.10.9-alpine3.19',
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^2.0.0',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.0.4',
  '@r2d2bzh/yac': '^1.0.4',
  ava: '^6.0.1',
  c8: '^9.1.0',
  moleculer: '^0.14.32',
  nats: '^2.18.0',
  nodemon: '^3.0.2',
  uuid: '^9.0.1',
};
