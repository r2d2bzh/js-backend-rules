import { addHeader, toMultiline } from '@r2d2bzh/js-rules';

export default ({ name, editWarning, serviceDirectories }) =>
  (config) => ({
    ...config,
    Jenkinsfile: {
      configuration: [
        "library 'shared-libraries@master'",
        'buildOctoHecker {',
        `    serviceName = "${serviceDirectories.map((service) => `${service}.rel`).join(' ')}"`,
        `    releaseName = "${name}"`,
        '    customBuildSteps = "docker-compose build share"',
        '    testCommand = "docker-compose run test"',
        '    testTeardown = "docker-compose down"',
        '    sonarCheck = true',
        '}',
      ],
      formatters: [toMultiline, addHeader('// ')(editWarning)],
    },
  });
