import { join as path } from 'path';
import { addHashedHeader } from '@r2d2bzh/js-rules';
import { pipe, extractField, extractFieldAs } from '../utils.js';
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
      ...extractDBNRegistryFrom(projectDetails),
    }),
    addDockerComposeConfig({
      addWarningHeader,
      serviceDirs,
      ...extractNatsRegistryFrom(projectDetails),
      releaseImagePath: path(extractField(['r2d2bzh', 'dockerRegistry'])(projectDetails) || '', projectPath),
    }),
    addHelmConfig({ addWarningHeader, name, version, description }),
    addJenkinsConfig({ name, editWarning, serviceDirs }),
  ]);
};

const extractDBNRegistryFrom = extractFieldAs(['r2d2bzh', 'dockerRegistry'], 'dbnRegistry', (r) =>
  path(r || '', 'tools')
);

const extractNatsRegistryFrom = extractFieldAs(['r2d2bzh', 'dockerRegistry'], 'natsRegistry', (r) =>
  path(r || '', 'thirdparties')
);
