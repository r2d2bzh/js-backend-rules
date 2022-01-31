/* eslint-disable security/detect-non-literal-fs-filename, security/detect-object-injection */
import { spawn as childSpawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import FileHound from 'filehound';
import gitRemoteOriginUrl from 'git-remote-origin-url';
import { readJSONFile } from '@r2d2bzh/js-rules';

export const spawn =
  (exec, ...arguments_) =>
  (cwd = '.') =>
    new Promise((resolve, reject) =>
      childSpawn(exec, arguments_, { cwd, stdio: ['ignore', 'ignore', 'inherit'] }).on('close', (code) => {
        const commandDesc = `'${exec} ${arguments_.join(' ')}' in ${cwd}`;
        return code === 0 ? resolve(`${commandDesc} succeeded`) : reject(new Error(`${commandDesc} failed (${code})`));
      })
    );

export const findDirectoriesWith = async (glob) => {
  const findGlobNotInNodeModules = await FileHound.create()
    .path('.')
    .discard('(^|.*/)node_modules/.*')
    .match(glob)
    .find();
  return findGlobNotInNodeModules.map((p) => path.dirname(p));
};

export const writeJSONFile = async (path, content) => {
  try {
    await fs.writeFile(path, `${JSON.stringify(content, undefined, 2)}\n`, { encoding: 'utf8' });
  } catch (error) {
    throw new Error(`failed to write JSON to ${path} (${error.message})`);
  }
};

export const mergeInJSONFile = async (path, ...objects) => {
  const original = await readJSONFile(path);
  return writeJSONFile(path, merge(original, ...objects));
};

const identity = (x) => x;
export const pipe = (functions) => {
  let pipe = identity;
  for (const function_ of functions) {
    pipe = compose(pipe)(function_);
  }
  return pipe;
};
const compose = (g) => (f) => async (x) => f(await g(x));

export const extractValue = (path) => (object) => {
  let extractedValue = object;
  for (const field of path) {
    extractedValue = extractedValue?.[field];
    if (extractedValue === undefined) {
      return;
    }
  }
  return extractedValue;
};

export const extractValueAs = (path, key, mapper = (v) => v) => {
  const extractValueFrom = extractValue(path);
  return (object) => {
    const value = mapper(extractValueFrom(object));
    return value ? { [key]: value } : {};
  };
};

export const getProjectPath = async () =>
  pipe([sanitizeGitURL, getURLPathname, removeDotGit])(await gitRemoteOriginUrl());

const merge = (original, ...overrides) => {
  let merge = original;
  for (const override of overrides) {
    merge = mergeTwo(merge, override);
  }
  return merge;
};

const mergeTwo = (original, override) => {
  try {
    return original.constructor.name === override.constructor.name ? mergeSameType(original, override) : override;
  } catch {
    return override;
  }
};

const mergeSameType = (original, override) => {
  switch (original.constructor.name) {
    case 'Object': {
      const merge = { ...original };
      for (const [key, value] of Object.entries(override)) {
        merge[key] = mergeTwo(original[key], value);
      }
      return merge;
    }
    case 'Array':
      return [...new Set([...original, ...override])].sort();
    default:
      return override;
  }
};

const sanitizeGitURL = (url) =>
  url.startsWith('git@') ? `git+ssh://${url.replace(/:([^:]*)$/, (match, p) => `/${p}`)}` : url;

const getURLPathname = (url) => {
  const { pathname } = new URL(url);
  return pathname;
};

const removeDotGit = (url) => (url.endsWith('.git') ? url.slice(0, -4) : url);
