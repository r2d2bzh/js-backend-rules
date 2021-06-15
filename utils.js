import { promises as fs } from 'fs';
import path from 'path';
import FileHound from 'filehound';
import mixin from 'mixin-deep';

export const findDirWith = (root) => async (glob) =>
  (await FileHound.create().path(root).discard('.*/node_modules/.*').match(glob).find())
    .map((p) => p.slice(process.cwd().length + 1))
    .map((p) => path.dirname(p));

export const readJSONFile = async (path) => {
  try {
    const json = await fs.readFile(path, { encoding: 'utf8' });
    return JSON.parse(json);
  } catch (e) {
    throw new Error(`failed to extract JSON from ${path} (${e.message})`);
  }
};

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

const compose = (g) => (f) => (x) => f(g(x));
export const pipe = (functions) =>
  functions.reduce(
    (comp, func) => compose(comp)(func),
    (x) => x
  );
