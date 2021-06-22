import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import FileHound from 'filehound';
import { readJSONFile } from '@r2d2bzh/js-rules';

export const npm =
  (...args) =>
  (cwd) =>
    new Promise((resolve, reject) =>
      spawn('npm', args, { cwd }).on('close', (code) => {
        const commandDesc = `'npm${args.reduce((s, a) => `${s} ${a}`, '')}' in ${cwd}`;
        return code === 0 ? resolve(`${commandDesc} succeeded`) : reject(new Error(`${commandDesc} failed (${code})`));
      })
    );

export const findDirWith = async (glob) =>
  (await FileHound.create().path('.').discard('.*/node_modules/.*').match(glob).find()).map((p) => path.dirname(p));

export const writeJSONFile = async (path, content) => {
  try {
    await fs.writeFile(path, JSON.stringify(content, null, 2), { encoding: 'utf8' });
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
