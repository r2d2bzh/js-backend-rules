/* eslint-disable security/detect-non-literal-fs-filename */

import { promises as fs } from 'fs';
import { join as path, dirname, relative } from 'path';
import process from 'process';
import { findUp } from 'find-up';
import { install as jsRules, readJSONFile, extractPackageDetails } from '@r2d2bzh/js-rules';
import tweakPackageJSON from './tweak-package-json.js';
import tweakConfigurationFiles from './tweak-configuration-files/index.js';
import { findDirWith, spawn } from './utils.js';
import colorizeConsole from './colorizeConsole.js';

const discardedServiceDirs = ['.', 'dev', 'test'];

colorizeConsole();

export const install = async ({ logger = console, ...options } = {}) => {
  const { logPreamble, ...projectData } = await logOnFail('JS-BACKEND-RULES INIT:')(logger, async () => {
    if (options.gitParent) {
      await cwdToGitParent();
    }
    return gatherProjectData(logger);
  })();
  await logOnFail(logPreamble)(logger, async () => {
    await _install({ logger, logPreamble, ...projectData, ...options });
    logger.log(logPreamble, 'successfully deployed');
  })();
};

const logOnFail =
  (logPreamble) =>
  (logger, fn) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      logger.error(logPreamble, 'deployment failure -', e);
      throw e;
    }
  };

const cwdToGitParent = async () => {
  const gitParent = await findUp(
    async (dir) => {
      try {
        const gitStat = await fs.stat(path(dir, '.git'));
        return gitStat.isDirectory() && dir;
      } catch (e) {
        return;
      }
    },
    {
      type: 'directory',
    }
  );
  if (gitParent) {
    process.chdir(gitParent);
  } else {
    throw new Error('no git parent directory found');
  }
};

const gatherProjectData = async (logger) => {
  const jsrStrings = await jsRulesStrings(logger);
  return {
    ...jsrStrings,
    ...(await findComponents(jsrStrings.logPreamble, logger)),
  };
};

const jsRulesStrings = (logger) =>
  extractPackageDetails({
    url: import.meta.url,
    extract: ({ name, version }) => ({
      logPreamble: `${name}[${version}]:`,
      editWarning: `DO NOT EDIT THIS FILE AS IT IS GENERATED BY ${name}`,
    }),
    logger,
  });

const findComponents = async (logPreamble, logger) => {
  const [packages, dockerContexts] = await Promise.all(['package.json', 'Dockerfile'].map(findDirWith));
  return {
    serviceDirs: packages
      .filter((p) => dockerContexts.includes(p))
      .filter(
        warnPredicate(
          (p) => `${logPreamble} deep service ${p} is discarded`,
          (p) => !p.includes('/'),
          logger
        )
      )
      .filter(
        warnPredicate(
          (p) => `${logPreamble} ${p} cannot be a service`,
          (p) => !discardedServiceDirs.includes(p),
          logger
        )
      ),
    subPackages: packages.filter((p) => p !== '.'),
  };
};

const warnPredicate = (warnFormatter, predicate, logger) => (x) => {
  const result = predicate(x);
  if (!result) {
    logger.warn(warnFormatter(x));
  }
  return result;
};

const _install = async ({ logger, logPreamble, editWarning, serviceDirs, subPackages, npmInstall = true }) => {
  await structureProject(logPreamble, logger);
  await tweakFiles({ logger, logPreamble, editWarning, serviceDirs, subPackages });
  if (npmInstall) {
    await dockerNpmInstall(logPreamble, logger)(['_test', ...serviceDirs]);
  }
};

const structureProject = async (logPreamble, logger) => {
  await ensureProjectDirectories();
  await ensurePackageJSONfiles();
  await ensureProjectSymlinks([[path('test', '__tests__'), '__tests__']], logPreamble, logger);
  await ensureProjectFiles(
    [
      [
        path(relative(process.cwd(), dirname(new URL(import.meta.url).pathname)), 'js-backend-rules.adoc'),
        'js-backend-rules.adoc',
      ],
    ],
    logPreamble,
    logger
  );
};

const ensureProjectDirectories = () =>
  Promise.all(
    ['dev', path('helm', 'templates'), path('test', '__tests__')].map((p) => fs.mkdir(p, { recursive: true }))
  );

const ensurePackageJSONfiles = () => Promise.all(['test'].map(spawn('npm', 'init', '-y')));

const ensureProjectItems = (addItem) => (items, logPreamble, logger) =>
  Promise.all(
    items.map(([src, dest]) =>
      fs
        .unlink(dest)
        .catch((e) => logger.warn(logPreamble, `${dest} was not unlinked (${e.message})`)) // path does not exist or is something we do not want to delete (dir...)
        .then(() => addItem(src, dest))
    )
  );

const ensureProjectSymlinks = ensureProjectItems(fs.symlink);

const ensureProjectFiles = ensureProjectItems(fs.copyFile);

const tweakFiles = async ({ logger, logPreamble, editWarning, serviceDirs, subPackages }) => {
  const [projectDetails] = await Promise.all([
    readJSONFile('package.json'),
    tweakPackageJSON({ logger, logPreamble, serviceDirs, subPackages }),
  ]);
  await jsRules({
    logger,
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

const dockerNpmInstall = (logPreamble, logger) => async (services) => {
  // We cannot operate parallel docker-compose runs for now:
  // https://github.com/docker/compose/issues/1516
  await services.reduce(async (before, service) => {
    await before;
    try {
      logger.log(
        logPreamble,
        await spawn('docker-compose', 'run', '--rm', '--entrypoint=""', service, 'npm', 'install')()
      );
    } catch (e) {
      logger.error(logPreamble, e.message);
      throw e;
    }
  }, Promise.resolve());
};
