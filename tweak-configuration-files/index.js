import jsRules from '@r2d2bzh/js-rules';
import { pipe } from '../utils.js';
import addGitConfig from './git.js';
import addReleaseItConfig from './release-it.js';
import addDockerConfig from './docker.js';
import addHelmConfig from './helm.js';

export default ({ projectDetails, editWarning, subPackages, serviceDirs }) => {
  const toYAML = jsRules.toYAML(editWarning);
  const toIgnore = jsRules.toIgnore(editWarning);

  return pipe([
    addGitConfig({ toIgnore }),
    addReleaseItConfig({ toYAML, subPackages }),
    addDockerConfig({ toIgnore, serviceDirs }),
    addHelmConfig({ toYAML, projectDetails }),
  ]);
};
