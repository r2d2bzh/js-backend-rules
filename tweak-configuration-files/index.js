import path from 'node:path';
import { addHashedHeader } from '@r2d2bzh/js-rules';
import { pipe, extractValue, extractValueAs } from '../utils.js';
import { docker as versions } from '../versions.js';
import addGitConfig from './git.js';
import addNpmConfig from './npm.js';
import addReleaseItConfig from './release-it.js';
import addDockerConfig from './docker.js';
import addDockerComposeConfig from './docker-compose.js';
import addHelmConfig from './helm.js';

export default ({
  logger,
  projectPath,
  projectDetails,
  helmChart,
  editWarning,
  scaffolderName,
  subPackages,
  serviceDirectories,
}) => {
  const addWarningHeader = addHashedHeader(editWarning);
  const {
    name,
    version,
    description,
    r2d2bzh: { rootDockerImage = false, helm: { chart: helmChartOverride = {} } = {} } = {},
  } = projectDetails;

  const releaseImagePath = path.join(extractValue(['r2d2bzh', 'dockerRegistry'], '')(projectDetails), projectPath);
  const volumeSourceRoot = extractValue(['r2d2bzh', 'volumeSourceRoot'], '.')(projectDetails);

  return pipe([
    addGitConfig({ addWarningHeader }),
    addNpmConfig({ addWarningHeader }),
    addReleaseItConfig({ addWarningHeader, subPackages }),
    addDockerConfig({
      logger,
      addWarningHeader,
      serviceDirectories,
      ...extractDBNImagePrefixFrom(projectDetails),
      ...extractDBNImageVersionFrom(projectDetails),
      rootDockerImage,
    }),
    addDockerComposeConfig({
      addWarningHeader,
      serviceDirectories,
      releaseImagePath,
      projectName: name,
      volumeSourceRoot,
      rootDockerImage,
    }),
    addHelmConfig({
      helmChart,
      helmChartOverride,
      scaffolderName,
      name,
      version,
      description,
    }),
  ]);
};

const extractDBNImagePrefixFrom = extractValueAs(
  ['r2d2bzh', 'dockerBuildNodeJS', 'imagePrefix'],
  'dbnImagePrefix',
  (r) => r || 'ghcr.io/r2d2bzh/docker-build-nodejs-',
);

const extractDBNImageVersionFrom = extractValueAs(
  ['r2d2bzh', 'dockerBuildNodeJS', 'imageVersion'],
  'dbnImageVersion',
  (r) => r || versions.dockerBuildNodeJS,
);
