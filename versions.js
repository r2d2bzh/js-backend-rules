// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=14.16.1';

export const docker = {
  hub: {
    nats: '2.2.6-alpine3.13',
  },
  local: {
    dockerBuildNodejs: '2.2.1',
    nats: '1.1.3',
  },
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^1.0.1',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.0.0',
  ava: '^3.15.0',
  c8: '^7.10.0',
  moleculer: '^0.14.18',
  nats: '^2.1.0',
  nodemon: '^2.0.15',
  uuid: '^8.3.2',
};
