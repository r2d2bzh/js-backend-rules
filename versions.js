// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=16.0.0';

export const docker = {
  dockerBuildNodeJS: '2.0.2',
  nats: '2.8.3-alpine3.15',
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^1.0.4',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.0.1',
  '@r2d2bzh/yac': '^1.0.1',
  ava: '^4.2.0',
  c8: '^7.11.3',
  moleculer: '^0.14.21',
  nats: '^2.7.0',
  nodemon: '^2.0.16',
  uuid: '^8.3.2',
};
