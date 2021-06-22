import { addHashedHeader } from '@r2d2bzh/js-rules';
import { pipe, extractFieldAs } from '../utils.js';
import addGitConfig from './git.js';
import addReleaseItConfig from './release-it.js';
import addDockerConfig from './docker.js';
import addHelmConfig from './helm.js';
import addJenkinsConfig from './jenkins.js';

const extractDBNRegistryFrom = extractFieldAs(['dockerBuildNodejs', 'registry'], 'dbnRegistry');
const extractDBNVersionFrom = extractFieldAs(['dockerBuildNodejs', 'version'], 'dbnVersion');

export default ({ projectDetails, editWarning, subPackages, serviceDirs }) => {
  const addWarningHeader = addHashedHeader(editWarning);
  const { name, version, description } = projectDetails;

  return pipe([
    addGitConfig({ addWarningHeader }),
    addReleaseItConfig({ addWarningHeader, subPackages }),
    addDockerConfig({
      addWarningHeader,
      serviceDirs,
      ...extractDBNRegistryFrom(projectDetails),
      ...extractDBNVersionFrom(projectDetails),
    }),
    addHelmConfig({ addWarningHeader, name, version, description }),
    addJenkinsConfig({ name, editWarning, serviceDirs }),
  ]);
};
