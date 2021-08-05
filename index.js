import { promises as fs } from 'fs';
import { join as path, dirname, relative } from 'path';
import { install as jsRules, readJSONFile, extractPackageDetails } from '@r2d2bzh/js-rules';
import tweakPackageJSON from './tweak-package-json.js';
import tweakConfigurationFiles from './tweak-configuration-files/index.js';
import { findDirWith, spawn } from './utils.js';
import colorizeConsole from './colorizeConsole.js';

const discardedServiceDirs = ['.', 'dev', 'test'];

colorizeConsole();

export const install = async (options = {}) => {
  const { logPreamble, ...projectData } = await gatherProjectData();
  try {
    await _install({ logPreamble, ...projectData, ...options });
    console.log(logPreamble, 'successfully deployed');
  } catch (e) {
    console.error(logPreamble, 'deployment failure -', e);
    throw e;
  }
};

const gatherProjectData = async () => {
  const jsrStrings = await jsRulesStrings();
  return {
    ...jsrStrings,
    ...(await findComponents(jsrStrings.logPreamble)),
  };
};

const jsRulesStrings = () =>
  extractPackageDetails(import.meta.url, ({ name, version }) => ({
    logPreamble: `${name}[${version}]:`,
    editWarning: `DO NOT EDIT THIS FILE AS IT IS GENERATED BY ${name}`,
  }));

const findComponents = async (logPreamble) => {
  const [packages, dockerContexts] = await Promise.all(['package.json', 'Dockerfile'].map(findDirWith));
  return {
    serviceDirs: packages
      .filter((p) => dockerContexts.includes(p))
      .filter(
        warnPredicate(
          (p) => `${logPreamble} deep service ${p} is discarded`,
          (p) => !p.includes('/')
        )
      )
      .filter(
        warnPredicate(
          (p) => `${logPreamble} ${p} cannot be a service`,
          (p) => !discardedServiceDirs.includes(p)
        )
      ),
    subPackages: packages.filter((p) => p !== '.'),
  };
};

const warnPredicate = (warnFormatter, predicate) => (x) => {
  const result = predicate(x);
  if (!result) {
    console.warn(warnFormatter(x));
  }
  return result;
};

const _install = async ({ logPreamble, editWarning, serviceDirs, subPackages, npmInstall = true }) => {
  await structureProject(logPreamble);
  await tweakFiles({ logPreamble, editWarning, serviceDirs, subPackages });
  if (npmInstall) {
    await dockerNpmInstall(logPreamble)(['_test', ...serviceDirs]);
  }
};

const structureProject = async (logPreamble) => {
  await ensureProjectDirectories();
  await ensurePackageJSONfiles();
  await ensureProjectSymlinks([[path('test', '__tests__'), '__tests__']], logPreamble);
  await ensureProjectFiles(
    [
      [
        path(relative(process.cwd(), dirname(new URL(import.meta.url).pathname)), 'js-backend-rules.adoc'),
        'js-backend-rules.adoc',
      ],
    ],
    logPreamble
  );
};

const ensureProjectDirectories = () =>
  Promise.all(
    ['dev', path('helm', 'templates'), path('test', '__tests__')].map((p) => fs.mkdir(p, { recursive: true }))
  );

const ensurePackageJSONfiles = () => Promise.all(['test'].map(spawn('npm', 'init', '-y')));

const ensureProjectItems = (addItem) => (items, logPreamble) =>
  Promise.all(
    items.map(([src, dest]) =>
      fs
        .unlink(dest)
        .catch((e) => console.warn(logPreamble, `${dest} was not unlinked (${e.message})`)) // path does not exist or is something we do not want to delete (dir...)
        .then(() => addItem(src, dest))
    )
  );

const ensureProjectSymlinks = ensureProjectItems(fs.symlink);

const ensureProjectFiles = ensureProjectItems(fs.copyFile);

const tweakFiles = async ({ logPreamble, editWarning, serviceDirs, subPackages }) => {
  const [projectDetails] = await Promise.all([
    readJSONFile('package.json'),
    tweakPackageJSON({ logPreamble, serviceDirs }),
  ]);
  await jsRules({
    logPreamble,
    editWarning,
    tweakConfigurationFiles: tweakConfigurationFiles({
      projectDetails,
      editWarning,
      subPackages,
      serviceDirs,
    }),
    resultLogger: {
      log: () => {},
      error: () => {},
    },
  });
};

const dockerNpmInstall = (logPreamble) => async (services) => {
  // We cannot operate parallel docker-compose runs for now:
  // https://github.com/docker/compose/issues/1516
  await services.reduce(async (before, service) => {
    await before;
    try {
      console.log(logPreamble, await spawn('docker-compose', 'run', '--rm', service, 'npm', 'install')());
    } catch (e) {
      console.error(logPreamble, e.message);
      throw e;
    }
  }, Promise.resolve());
};
