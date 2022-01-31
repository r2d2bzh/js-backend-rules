import { join as path } from 'node:path';
import { addHashedHeader } from '@r2d2bzh/js-rules';
import { pipe, extractValue, extractValueAs } from '../utils.js';
import { docker as versions } from '../versions.js';
import tweakEslintConfig from './eslint.js';
import addGitConfig from './git.js';
import addNpmConfig from './npm.js';
import addReleaseItConfig from './release-it.js';
import addDockerConfig from './docker.js';
import addDockerComposeConfig from './docker-compose.js';
import addHelmConfig from './helm.js';
import addJenkinsConfig from './jenkins.js';

export default ({ logger, projectPath, projectDetails, editWarning, subPackages, serviceDirectories }) => {
  const addWarningHeader = addHashedHeader(editWarning);
  const { name, version, description } = projectDetails;

  return pipe([
    tweakEslintConfig(),
    addGitConfig({ addWarningHeader }),
    addNpmConfig({ addWarningHeader }),
    addReleaseItConfig({ addWarningHeader, subPackages }),
    addDockerConfig({
      logger,
      addWarningHeader,
      serviceDirectories,
      ...extractDBNImagePrefixFrom(projectDetails),
      ...extractDBNImageVersionFrom(projectDetails),
    }),
    addDockerComposeConfig({
      addWarningHeader,
      serviceDirectories,
      releaseImagePath: path(extractValue(['r2d2bzh', 'dockerRegistry'])(projectDetails) || '', projectPath),
    }),
    addHelmConfig({ addWarningHeader, name, version, description }),
    addJenkinsConfig({ name, editWarning, serviceDirectories }),
  ]);
};

const extractDBNImagePrefixFrom = extractValueAs(
  ['r2d2bzh', 'dockerBuildNodeJS', 'imagePrefix'],
  'dbnImagePrefix',
  (r) => r || 'ghcr.io/r2d2bzh/docker-build-nodejs-'
);

const extractDBNImageVersionFrom = extractValueAs(
  ['r2d2bzh', 'dockerBuildNodeJS', 'imageVersion'],
  'dbnImageVersion',
  (r) => r || versions.dockerBuildNodeJS
);
