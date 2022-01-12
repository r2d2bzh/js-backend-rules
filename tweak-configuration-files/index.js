import { join as path } from 'path';
import { addHashedHeader } from '@r2d2bzh/js-rules';
import { pipe, extractField, extractFieldAs } from '../utils.js';
import { docker as versions } from '../versions.js';
import tweakEslintConfig from './eslint.js';
import addGitConfig from './git.js';
import addNpmConfig from './npm.js';
import addReleaseItConfig from './release-it.js';
import addDockerConfig from './docker.js';
import addDockerComposeConfig from './docker-compose.js';
import addHelmConfig from './helm.js';
import addJenkinsConfig from './jenkins.js';

export default ({ projectPath, projectDetails, editWarning, subPackages, serviceDirs }) => {
  const addWarningHeader = addHashedHeader(editWarning);
  const { name, version, description } = projectDetails;

  return pipe([
    tweakEslintConfig(),
    addGitConfig({ addWarningHeader }),
    addNpmConfig({ addWarningHeader }),
    addReleaseItConfig({ addWarningHeader, subPackages }),
    addDockerConfig({
      addWarningHeader,
      serviceDirs,
      ...extractDBNImagePrefixFrom(projectDetails),
      ...extractDBNImageVersionFrom(projectDetails),
    }),
    addDockerComposeConfig({
      addWarningHeader,
      serviceDirs,
      releaseImagePath: path(extractField(['r2d2bzh', 'dockerRegistry'])(projectDetails) || '', projectPath),
    }),
    addHelmConfig({ addWarningHeader, name, version, description }),
    addJenkinsConfig({ name, editWarning, serviceDirs }),
  ]);
};

const extractDBNImagePrefixFrom = extractFieldAs(
  ['r2d2bzh', 'dockerBuildNodeJS', 'imagePrefix'],
  'dbnImagePrefix',
  (r) => r || 'ghcr.io/r2d2bzh/docker-build-nodejs-'
);

const extractDBNImageVersionFrom = extractFieldAs(
  ['r2d2bzh', 'dockerBuildNodeJS', 'imageVersion'],
  'dbnImageVersion',
  (r) => r || versions.dockerBuildNodeJS
);
