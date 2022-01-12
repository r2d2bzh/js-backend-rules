// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=16.0.0';

export const docker = {
  dockerBuildNodeJS: 'main',
  nats: '2.6.6-alpine3.14',
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^1.0.2',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.0.0',
  ava: '^4.0.1',
  c8: '^7.11.0',
  moleculer: '^0.14.19',
  nats: '^2.4.0',
  nodemon: '^2.0.15',
  uuid: '^8.3.2',
};
