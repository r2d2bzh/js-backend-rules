/* eslint-disable security/detect-non-literal-fs-filename, security/detect-object-injection */
import { spawn as childSpawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { URL } from 'url';
import FileHound from 'filehound';
import gitRemoteOriginUrl from 'git-remote-origin-url';
import { readJSONFile } from '@r2d2bzh/js-rules';

export const spawn =
  (exec, ...args) =>
  (cwd = '.') =>
    new Promise((resolve, reject) =>
      childSpawn(exec, args, { cwd, stdio: ['ignore', 'ignore', 'inherit'] }).on('close', (code) => {
        const commandDesc = `'${exec} ${args.join(' ')}' in ${cwd}`;
        return code === 0 ? resolve(`${commandDesc} succeeded`) : reject(new Error(`${commandDesc} failed (${code})`));
      })
    );

export const findDirWith = async (glob) =>
  (await FileHound.create().path('.').discard('(^|.*/)node_modules/.*').match(glob).find()).map((p) => path.dirname(p));

export const writeJSONFile = async (path, content) => {
  try {
    await fs.writeFile(path, `${JSON.stringify(content, null, 2)}\n`, { encoding: 'utf8' });
  } catch (e) {
    throw new Error(`failed to write JSON to ${path} (${e.message})`);
  }
};

export const mixinJSONFile = async (path, ...objects) => {
  const original = await readJSONFile(path);
  return writeJSONFile(path, mixin(original, ...objects));
};

export const pipe = (functions) =>
  functions.reduce(
    (comp, func) => compose(comp)(func),
    (x) => x
  );
const compose = (g) => (f) => async (x) => f(await g(x));

export const extractField = (path) => (object) =>
  path.reduce((value, current) => (value ? value[current] : value), object);

export const extractFieldAs = (path, name, mapper = (v) => v) => {
  const extractFieldFrom = extractField(path);
  return (object) => {
    const fieldValue = extractFieldFrom(object);
    return fieldValue ? { [name]: mapper(fieldValue) } : {};
  };
};

export const getProjectPath = async () =>
  pipe([sanitizeGitURL, getURLPathname, removeDotGit])(await gitRemoteOriginUrl());

const mixin = (original, ...alternates) =>
  alternates.reduce((result, alternate) => mixinTwo(result, alternate), original);

const mixinTwo = (original, alternate) => {
  try {
    return original.constructor.name === alternate.constructor.name ? mixinSame(original, alternate) : alternate;
  } catch (e) {
    return alternate;
  }
};

const mixinSame = (original, alternate) => {
  switch (original.constructor.name) {
    case 'Object':
      return Object.entries(alternate).reduce((o, [k, v]) => ({ ...o, [k]: mixinTwo(o[k], v) }), original);
    case 'Array':
      return Array.from(new Set(original.concat(alternate))).sort();
    default:
      return alternate;
  }
};

const sanitizeGitURL = (url) =>
  url.startsWith('git@') ? `git+ssh://${url.replace(/:([^:]*)$/, (match, p) => `/${p}`)}` : url;

const getURLPathname = (url) => {
  const { pathname } = new URL(url);
  return pathname;
};

const removeDotGit = (url) => (url.endsWith('.git') ? url.slice(0, -4) : url);
