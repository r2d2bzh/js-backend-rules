// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=18.0.0';

export const docker = {
  dockerBuildNodeJS: '2.0.6',
  nats: '2.9.14-alpine3.17',
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^1.0.5',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.0.3',
  '@r2d2bzh/yac': '^1.0.3',
  ava: '^5.2.0',
  c8: '^7.12.0',
  moleculer: '^0.14.28',
  nats: '^2.12.0',
  nodemon: '^2.0.20',
  uuid: '^9.0.0',
};
