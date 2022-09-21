// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=16.0.0';

export const docker = {
  dockerBuildNodeJS: '2.0.4',
  nats: '2.9.0-alpine3.16',
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^1.0.4',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.0.2',
  '@r2d2bzh/yac': '^1.0.2',
  ava: '^4.3.3',
  c8: '^7.12.0',
  moleculer: '^0.14.23',
  nats: '^2.7.1',
  nodemon: '^2.0.20',
  uuid: '^9.0.0',
};
