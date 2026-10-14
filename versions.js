// NodeJS version constraint, WARNING:
// Ensure that docker-build-nodejs uses a compliant NodeJS engine
export const nodejs = '>=26.10.0';

export const docker = {
  dockerBuildNodeJS: '4.0.0-0',
  nats: '2.14.8-alpine3.22',
};

export const eslint = {
  eslint: '^10.12.0',
  '@r2d2bzh/eslint-config': '^4.0.0',
};

export const npm = {
  '@r2d2bzh/moleculer-healthcheck-middleware': '^2.4.0',
  '@r2d2bzh/moleculer-start-checker-middleware': '^1.3.0',
  '@r2d2bzh/moleculer-test-utils': '^1.3.0',
  '@r2d2bzh/yac': '^1.2.1',
  ava: '^8.0.1',
  c8: '^12.0.0',
  moleculer: '^0.14.36',
  nats: '^2.29.3',
  tsx: '^4.23.15',
  uuid: '^14.0.3',
};
