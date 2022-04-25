// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=16.0.0';

export const docker = {
  dockerBuildNodeJS: '2.0.1',
  nats: '2.8.1-alpine3.15',
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^1.0.2',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.0.0',
  '@r2d2bzh/yac': '^1.0.0',
  ava: '^4.2.0',
  c8: '^7.11.2',
  moleculer: '^0.14.20',
  nats: '^2.6.1',
  nodemon: '^2.0.15',
  uuid: '^8.3.2',
};
