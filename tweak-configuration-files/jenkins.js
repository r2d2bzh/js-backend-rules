import { addHeader, toMultiline } from '@r2d2bzh/js-rules';

export default ({ name, editWarning, serviceDirs }) =>
  (config) => ({
    ...config,
    Jenkinsfile: {
      configuration: [
        "library 'shared-libraries@master'",
        'buildOctoHecker {',
        `    serviceName = "${serviceDirs.reduce((rels, svc) => `${rels} ${svc}.rel`, '').trimStart()}"`,
        `    releaseName = "${name}"`,
        '    testCommand = "docker-compose run test"',
        '    testTeardown = "docker-compose down"',
        '    sonarCheck = true',
        '}',
      ],
      formatters: [toMultiline, addHeader('// ')(editWarning)],
    },
  });
